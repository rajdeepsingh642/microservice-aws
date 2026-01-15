terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.0"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
  
  default_tags {
    Environment = var.environment
    Project    = "ecommerce-marketplace"
    ManagedBy   = "terraform"
  }
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.project_name}-vpc"
  cidr = var.vpc_cidr

  azs             = var.availability_zones
  private_subnets = var.private_subnet_cidrs
  public_subnets  = var.public_subnet_cidrs

  enable_nat_gateway = true
  enable_vpn_gateway = false
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = {
    Name = "${var.project_name}-vpc"
    Environment = var.environment
  }
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  version = "~> 19.0"

  cluster_name    = "${var.project_name}-eks"
  cluster_version = var.kubernetes_version

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets
  cluster_endpoint_public_access = true

  node_security_group_additional_rules = {
    ingress_nodes = {
      description = "Node to node communication"
      protocol    = "-1"
      from_port   = 0
      to_port     = 0
      type        = "ingress"
      self        = true
    }
  }

  eks_managed_node_groups = {
    main = {
      min_size     = var.node_min_size
      max_size     = var.node_max_size
      desired_size = var.node_desired_size

      instance_types = var.node_instance_types
      capacity_type = "ON_DEMAND"

      k8s_labels = {
        Environment = var.environment
        Project     = var.project_name
        NodeGroup   = "main"
      }

      additional_tags = {
        Name        = "${var.project_name}-main-node-group"
        Environment = var.environment
      }
    }
  }

  tags = {
    Name        = "${var.project_name}-eks"
    Environment = var.environment
  }
}

# RDS PostgreSQL
module "rds" {
  source = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.project_name}-postgres"

  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.medium"

  allocated_storage     = 100
  max_allocated_storage = 1000
  storage_encrypted     = true

  db_name  = "ecommerce"
  username = var.db_username
  port     = 5432

  vpc_security_group_ids = [module.vpc.security_group_id]
  db_subnet_group_name   = module.vpc.database_subnet_group_name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  deletion_protection = var.environment == "production" ? true : false

  tags = {
    Name        = "${var.project_name}-postgres"
    Environment = var.environment
  }
}

# ElastiCache Redis
module "elasticache" {
  source = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"

  name = "${var.project_name}-redis"

  engine = "redis"
  engine_version = "7.0"

  node_type = "cache.t3.micro"
  num_cache_nodes = 1

  parameter_group_name = "default.redis7"
  port = 6379

  subnet_ids = module.vpc.private_subnets
  security_group_ids = [module.vpc.security_group_id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Name        = "${var.project_name}-redis"
    Environment = var.environment
  }
}

# Elasticsearch Cluster
module "elasticsearch" {
  source = "terraform-aws-modules/elasticsearch/aws"
  version = "~> 1.0"

  domain_name = "${var.project_name}-es"

  elasticsearch_version = "8.11.0"

  cluster_config = {
    instance_type = "t3.small.elasticsearch"
    instance_count = 2
  }

  vpc_options = {
    subnet_ids = [module.vpc.private_subnets[0]]
    security_group_ids = [module.vpc.security_group_id]
  }

  ebs_options = {
    volume_size = 100
    volume_type = "gp3"
  }

  access_policies = <<POLICIES
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "*"
      },
      "Action": "es:*",
      "Resource": "arn:aws:es:${var.aws_region}:*:domain/${var.project_name}-es/*"
    }
  ]
}
POLICIES

  tags = {
    Name        = "${var.project_name}-elasticsearch"
    Environment = var.environment
  }
}

# S3 Buckets
module "s3_buckets" {
  source = "terraform-aws-modules/s3-bucket/aws"
  version = "~> 4.0"

  bucket = "${var.project_name}-assets"
  acl    = "private"

  versioning = {
    enabled = true
  }

  server_side_encryption_configuration = {
    rule = {
      apply_server_side_encryption_by_default = true
    }
  }

  tags = {
    Name        = "${var.project_name}-assets"
    Environment = var.environment
  }
}

# Application Load Balancer
module "alb" {
  source = "terraform-aws-modules/alb/aws"
  version = "~> 8.0"

  name = "${var.project_name}-alb"

  vpc_id          = module.vpc.vpc_id
  subnets         = module.vpc.public_subnets
  security_groups = [module.vpc.security_group_id]

  http_tcp_listeners = [
    {
      port        = 80
      protocol    = "HTTP"
      action_type = "redirect"
      redirect = {
        port        = "443"
        protocol    = "HTTPS"
        status_code = "301"
      }
    },
    {
      port        = 443
      protocol    = "HTTPS"
      action_type = "forward"
      target_group_index = 0
    }
  ]

  target_groups = [
    {
      name_prefix      = "${var.project_name}-"
      backend_protocol = "HTTP"
      backend_port   = 3000
      target_type    = "ip"
      health_check = {
        enabled             = true
        healthy_threshold   = 2
        interval           = 30
        matcher            = "200-301"
        path               = "/health"
        port              = "traffic-port"
        protocol           = "HTTP"
        timeout            = 5
        unhealthy_threshold = 2
      }
    }
  ]

  tags = {
    Name        = "${var.project_name}-alb"
    Environment = var.environment
  }
}

# Route53
module "route53" {
  source = "terraform-aws-modules/route53/aws"
  version = "~> 2.0"

  zone_id = var.route53_zone_id

  records = [
    {
      name    = var.domain_name
      type    = "A"
      alias   = {
        name    = module.alb.dns_name
        zone_id = module.alb.zone_id
      }
    }
  ]
}

# IAM Roles for Services
resource "aws_iam_role" "ecs_task_role" {
  name = "${var.project_name}-ecs-task-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-ecs-task-role"
    Environment = var.environment
  }
}

resource "aws_iam_role_policy_attachment" "ecs_task_role_policy" {
  role       = aws_iam_role.ecs_task_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "cluster_name" {
  description = "EKS cluster name"
  value       = module.eks.cluster_name
}

output "database_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds.db_instance_endpoint
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache.cache_endpoint
}

output "elasticsearch_endpoint" {
  description = "Elasticsearch endpoint"
  value       = module.elasticsearch.domain_endpoint
}

output "load_balancer_dns" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.dns_name
}
