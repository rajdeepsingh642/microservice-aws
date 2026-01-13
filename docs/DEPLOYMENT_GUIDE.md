# Deployment Guide

This guide covers the deployment of the Amazon-like e-commerce marketplace system across different environments.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Docker Deployment](#docker-deployment)
4. [Kubernetes Deployment](#kubernetes-deployment)
5. [AWS Deployment with Terraform](#aws-deployment-with-terraform)
6. [Environment Configuration](#environment-configuration)
7. [Monitoring and Logging](#monitoring-and-logging)
8. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- Node.js 18+ 
- Docker & Docker Compose
- kubectl (for Kubernetes)
- Terraform (for AWS deployment)
- Git

### System Requirements
- **Minimum**: 4GB RAM, 2 CPU cores
- **Recommended**: 8GB RAM, 4 CPU cores
- **Storage**: 20GB free space

## Local Development Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ecommerce-marketplace
```

### 2. Environment Configuration
Create `.env` file in the root directory:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Database Configuration
MONGODB_URI=mongodb://admin:password@localhost:27017/ecommerce?authSource=admin
POSTGRES_URI=postgresql://postgres:password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379

# Service URLs
PRODUCT_SERVICE_URL=http://localhost:3001
ORDER_SERVICE_URL=http://localhost:3002
PAYMENT_SERVICE_URL=http://localhost:3003
REVIEW_SERVICE_URL=http://localhost:3004
SEARCH_SERVICE_URL=http://localhost:3005
NOTIFICATION_SERVICE_URL=http://localhost:3006

# Message Queue
RABBITMQ_URL=amqp://admin:password@localhost:5672

# Search Engine
ELASTICSEARCH_URL=http://localhost:9200

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@ecommerce.com

# SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number

# Firebase (for push notifications)
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account","project_id":"your-project"}'

# Frontend URLs
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3100,http://localhost:3101,http://localhost:3102
FRONTEND_URL=http://localhost:3000

# Service API Key (for internal service communication)
SERVICE_API_KEY=your-internal-service-api-key

# Environment
NODE_ENV=development
LOG_LEVEL=info
```

### 3. Start Services with Docker Compose
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Verify Deployment
```bash
# Check service health
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
curl http://localhost:3006/health
```

## Docker Deployment

### Build Docker Images
```bash
# Build all services
docker-compose build

# Build specific service
docker-compose build product-service
```

### Production Docker Compose
Create `docker-compose.prod.yml`:
```yaml
version: '3.8'

services:
  # Use production images
  product-service:
    image: ecommerce/product-service:latest
    environment:
      NODE_ENV: production
    deploy:
      replicas: 2
      resources:
        limits:
          memory: 512M
        reservations:
          memory: 256M

  # Add other services with similar production configurations
```

### Deploy to Production
```bash
# Use production compose file
docker-compose -f docker-compose.prod.yml up -d

# Scale services
docker-compose -f docker-compose.prod.yml up -d --scale product-service=3
```

## Kubernetes Deployment

### 1. Create Namespace
```bash
kubectl create namespace ecommerce
```

### 2. Deploy Infrastructure
```bash
# Deploy databases and message queue
kubectl apply -f kubernetes/infrastructure/
```

### 3. Deploy Applications
```bash
# Deploy microservices
kubectl apply -f kubernetes/applications/
```

### 4. Configure Ingress
```bash
# Deploy ingress controller
kubectl apply -f kubernetes/ingress/
```

### 5. Verify Deployment
```bash
# Check pods
kubectl get pods -n ecommerce

# Check services
kubectl get services -n ecommerce

# Check ingress
kubectl get ingress -n ecommerce
```

### Kubernetes Manifests Structure
```
kubernetes/
├── infrastructure/
│   ├── mongodb.yaml
│   ├── postgresql.yaml
│   ├── redis.yaml
│   ├── rabbitmq.yaml
│   └── elasticsearch.yaml
├── applications/
│   ├── product-service.yaml
│   ├── order-service.yaml
│   ├── payment-service.yaml
│   ├── review-service.yaml
│   ├── search-service.yaml
│   ├── notification-service.yaml
│   └── api-gateway.yaml
├── configmaps/
│   ├── app-config.yaml
│   └── secrets.yaml
└── ingress/
    ├── api-ingress.yaml
    └── frontend-ingress.yaml
```

## AWS Deployment with Terraform

### 1. Initialize Terraform
```bash
cd infrastructure/terraform
terraform init
```

### 2. Plan Deployment
```bash
terraform plan
```

### 3. Apply Configuration
```bash
terraform apply
```

### Terraform Configuration Structure
```
infrastructure/terraform/
├── main.tf
├── variables.tf
├── outputs.tf
├── provider.tf
├── modules/
│   ├── vpc/
│   ├── eks/
│   ├── rds/
│   ├── elasticache/
│   ├── sqs/
│   ├── sns/
│   └── s3/
└── environments/
    ├── dev/
    ├── staging/
    └── prod/
```

### AWS Services Provisioned

#### VPC and Networking
- Custom VPC with public and private subnets
- Internet Gateway and NAT Gateways
- Security Groups and Network ACLs

#### EKS Cluster
- Managed Kubernetes cluster
- Node groups with auto-scaling
- IAM roles for service accounts

#### Databases
- RDS PostgreSQL for orders and payments
- DocumentDB (MongoDB) for products and reviews
- ElastiCache Redis for caching

#### Message Queues
- SQS queues for order processing
- SNS topics for notifications

#### Storage
- S3 buckets for product images
- EFS for shared storage

#### Monitoring
- CloudWatch for logs and metrics
- X-Ray for distributed tracing

## Environment Configuration

### Development Environment
```env
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_CORS=true
RATE_LIMIT_ENABLED=false
```

### Staging Environment
```env
NODE_ENV=staging
LOG_LEVEL=info
ENABLE_CORS=true
RATE_LIMIT_ENABLED=true
```

### Production Environment
```env
NODE_ENV=production
LOG_LEVEL=warn
ENABLE_CORS=false
RATE_LIMIT_ENABLED=true
SSL_ENABLED=true
```

## Monitoring and Logging

### Application Monitoring
- **Health Checks**: `/health` endpoint on all services
- **Metrics**: Custom metrics for business KPIs
- **Alerting**: Automated alerts for critical issues

### Log Management
- **Structured Logging**: JSON format with correlation IDs
- **Log Aggregation**: Centralized log collection
- **Log Retention**: Configurable retention policies

### Performance Monitoring
- **Response Times**: Track API response times
- **Error Rates**: Monitor error percentages
- **Throughput**: Track requests per second

### Infrastructure Monitoring
- **Resource Usage**: CPU, memory, disk, network
- **Service Health**: Container and service health
- **Auto-scaling**: Dynamic scaling based on load

## Troubleshooting

### Common Issues

#### Service Won't Start
1. Check environment variables
2. Verify database connections
3. Review service logs
4. Check port availability

#### Database Connection Issues
1. Verify connection strings
2. Check network connectivity
3. Validate credentials
4. Review database logs

#### High Memory Usage
1. Check for memory leaks
2. Monitor garbage collection
3. Review heap dumps
4. Optimize queries

#### Slow API Responses
1. Check database query performance
2. Review network latency
3. Monitor service dependencies
4. Analyze application logs

### Debug Commands

#### Docker
```bash
# View container logs
docker-compose logs -f service-name

# Execute command in container
docker-compose exec service-name sh

# Check resource usage
docker stats
```

#### Kubernetes
```bash
# View pod logs
kubectl logs -f pod-name -n ecommerce

# Execute command in pod
kubectl exec -it pod-name -n ecommerce -- sh

# Describe pod
kubectl describe pod pod-name -n ecommerce

# Check events
kubectl get events -n ecommerce
```

#### System Health
```bash
# Check all service health
for service in 3000 3001 3002 3003 3004 3005 3006; do
  echo "Checking port $service..."
  curl -f http://localhost:$service/health || echo "Service down"
done
```

### Performance Tuning

#### Database Optimization
- Add appropriate indexes
- Optimize query patterns
- Implement connection pooling
- Use read replicas for read-heavy workloads

#### Caching Strategy
- Implement Redis caching
- Use CDN for static assets
- Cache frequently accessed data
- Implement cache invalidation

#### Load Balancing
- Configure multiple service instances
- Use load balancers for high availability
- Implement health checks
- Configure auto-scaling policies

## Security Considerations

### Network Security
- Use HTTPS in production
- Implement firewall rules
- Secure inter-service communication
- Use VPN for admin access

### Data Protection
- Encrypt sensitive data at rest
- Use TLS for data in transit
- Implement data retention policies
- Regular security audits

### Access Control
- Implement RBAC
- Use least privilege principle
- Regular credential rotation
- Multi-factor authentication

## Backup and Recovery

### Database Backups
- Automated daily backups
- Point-in-time recovery
- Cross-region replication
- Regular restore testing

### Disaster Recovery
- Multi-region deployment
- Failover procedures
- Recovery time objectives
- Communication plans

## Rollback Procedures

### Application Rollback
```bash
# Docker rollback
docker-compose down
docker-compose up -d --image previous-version

# Kubernetes rollback
kubectl rollout undo deployment/service-name -n ecommerce
```

### Database Rollback
- Use database migrations
- Implement blue-green deployments
- Maintain backup snapshots
- Test rollback procedures

## Performance Testing

### Load Testing
- Use tools like JMeter or k6
- Test peak load scenarios
- Monitor system behavior
- Identify bottlenecks

### Stress Testing
- Test system limits
- Validate auto-scaling
- Check error handling
- Verify recovery procedures

This deployment guide provides comprehensive instructions for deploying the e-commerce marketplace system across different environments. Regular updates and maintenance are essential for optimal performance and security.
