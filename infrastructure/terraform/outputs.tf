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

output "s3_bucket_name" {
  description = "S3 bucket name for assets"
  value       = module.s3_buckets.s3_bucket_id
}
