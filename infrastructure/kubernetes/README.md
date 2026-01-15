# Kubernetes Deployment Manifests

## 🚀 Overview

This directory contains Kubernetes manifests for deploying the e-commerce marketplace to any Kubernetes cluster.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                │
│                                                         │
│  ┌─────────────────────────────────────────────┐     │
│  │              Namespace: ecommerce          │     │
│  │                                         │     │
│  │  ┌─────────────────────────────────────┐    │     │
│  │  │     Microservices Pods            │    │     │
│  │  │  ┌─────────────────────────┐    │    │     │
│  │  │  │  API Gateway        │    │    │     │
│  │  │  │  Product Service    │    │    │     │
│  │  │  │  Order Service     │    │    │     │
│  │  │  │  Payment Service   │    │    │     │
│  │  │  │  Review Service    │    │    │     │
│  │  │  │  Search Service    │    │    │     │
│  │  │  │  Notification Svc  │    │    │     │
│  │  │  └─────────────────────────┘    │    │     │
│  │  └─────────────────────────────────────┘    │     │
│  │                                         │     │
│  │  ┌─────────────────────────────────────┐    │     │
│  │  │     Infrastructure Pods           │    │     │
│  │  │  ┌─────────────────────────┐    │    │     │
│  │  │  │  MongoDB           │    │    │     │
│  │  │  │  PostgreSQL        │    │    │     │
│  │  │  │  Redis             │    │    │     │
│  │  │  │  RabbitMQ          │    │    │     │
│  │  │  │  Elasticsearch     │    │    │     │
│  │  │  └─────────────────────────┘    │    │     │
│  │  └─────────────────────────────────────┘    │     │
│  └─────────────────────────────────────────────────────┘     │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐     │
│  │              Ingress Controller              │     │
│  │                                         │     │
│  │  ┌─────────────────────────────────────┐    │     │
│  │  │  SSL Termination              │    │     │
│  │  │  Load Balancing              │    │     │
│  │  │  Domain Routing              │    │     │
│  │  └─────────────────────────────────────┘    │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

## 📋 Prerequisites

- **Kubernetes 1.25+**
- **kubectl configured**
- **Ingress Controller** (nginx/traefik)
- **cert-manager** for SSL certificates
- **StorageClass** configured

## 🔧 Configuration

### Environment Variables

Update `configmaps.yaml` and `secrets.yaml`:

```yaml
# Production values
NODE_ENV: "production"
LOG_LEVEL: "info"

# Database connections
MONGODB_URI: "mongodb://mongodb-service:27017/ecommerce"
POSTGRES_URI: "postgresql://postgres:password@postgres-service:5432/ecommerce"
REDIS_URL: "redis://redis-service:6379"

# External services
ELASTICSEARCH_URL: "http://elasticsearch-service:9200"
RABBITMQ_URL: "amqp://admin:password@rabbitmq-service:5672"
```

### Secrets Management

```bash
# Create secrets
kubectl create secret generic ecommerce-secrets \
  --from-literal=db-password=your-password \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=stripe-secret-key=your-stripe-key

# Encode sensitive values
echo -n 'your-password' | base64
```

## 🚀 Deployment

### 1. Create Namespace
```bash
kubectl apply -f namespace.yaml
```

### 2. Deploy Infrastructure Services
```bash
kubectl apply -f mongodb-deployment.yaml
kubectl apply -f postgres-deployment.yaml
kubectl apply -f redis-deployment.yaml
kubectl apply -f rabbitmq-deployment.yaml
kubectl apply -f elasticsearch-deployment.yaml
```

### 3. Deploy Microservices
```bash
kubectl apply -f microservices-deployment.yaml
```

### 4. Configure Ingress
```bash
kubectl apply -f ingress.yaml
```

### 5. Setup Auto-scaling
```bash
kubectl apply -f hpa.yaml
```

## 📊 Service Configuration

### Resource Limits
- **API Gateway**: 256Mi RAM, 250m CPU
- **Microservices**: 256Mi RAM, 250m CPU
- **Databases**: 512Mi RAM, 500m CPU
- **Cache/Search**: 1Gi RAM, 1000m CPU

### Health Checks
All services include:
- **Liveness Probes**: Container restart on failure
- **Readiness Probes**: Traffic routing only when ready
- **Startup Probes**: Graceful startup handling

### Storage
- **Persistent Volumes**: 20-30Gi per service
- **StorageClass**: gp2 (SSD)
- **Access Modes**: ReadWriteOnce

## 🔒 Security Configuration

### Network Policies
```yaml
# Example network policy
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: ecommerce-network-policy
spec:
  podSelector:
    matchLabels:
      app: api-gateway
  policyTypes:
  - Ingress
  - Egress
```

### RBAC
```yaml
# Service accounts and roles
apiVersion: v1
kind: ServiceAccount
metadata:
  name: ecommerce-service-account
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: ecommerce-role
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list", "watch"]
```

## 📈 Monitoring & Logging

### Prometheus Monitoring
```yaml
# Service monitors
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: ecommerce-monitor
spec:
  selector:
    matchLabels:
      app: api-gateway
  endpoints:
  - port: http
```

### Logging
```yaml
# Fluentd configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluentd-config
data:
  fluent.conf: |
    <source>
      @type tail
      path /var/log/containers/*.log
      pos_file /var/log/fluentd-containers.log.pos
      tag kubernetes.*
    </source>
```

## 🚨 Troubleshooting

### Common Issues
1. **Image Pull Errors**: Check registry credentials
2. **Volume Mount Issues**: Verify PVC status
3. **Network Connectivity**: Check service DNS
4. **Resource Limits**: Monitor pod resource usage

### Debug Commands
```bash
# Check pod status
kubectl get pods -n ecommerce

# Describe pod issues
kubectl describe pod <pod-name> -n ecommerce

# Check service endpoints
kubectl get svc -n ecommerce

# View logs
kubectl logs <pod-name> -n ecommerce

# Port forward for debugging
kubectl port-forward svc/api-gateway-service 3000:3000 -n ecommerce
```

### Resource Issues
```bash
# Check resource usage
kubectl top pods -n ecommerce

# Check node resources
kubectl top nodes

# Describe resource quotas
kubectl describe resourcequota -n ecommerce
```

## 🔄 Updates & Maintenance

### Rolling Updates
```bash
# Update deployment
kubectl set image deployment/api-gateway \
  your-registry/api-gateway:v2.0.0 -n ecommerce

# Check rollout status
kubectl rollout status deployment/api-gateway -n ecommerce

# Rollback if needed
kubectl rollout undo deployment/api-gateway -n ecommerce
```

### Backup & Restore
```bash
# Backup configurations
kubectl get all -n ecommerce -o yaml > backup.yaml

# Restore from backup
kubectl apply -f backup.yaml
```

## 📝 Production Best Practices

### 1. Resource Management
- Use resource requests and limits
- Implement horizontal pod autoscaling
- Monitor resource utilization
- Set appropriate pod disruption budgets

### 2. Security
- Use network policies
- Implement RBAC
- Regular security updates
- Encrypt sensitive data

### 3. High Availability
- Multi-replica deployments
- Anti-affinity rules
- Proper health checks
- Graceful shutdown handling

### 4. Observability
- Structured logging
- Metrics collection
- Distributed tracing
- Alert configuration

## 🔗 External Services Integration

### AWS Services
```yaml
# RDS PostgreSQL
env:
- name: POSTGRES_URI
  valueFrom:
    secretKeyRef:
      name: aws-secrets
      key: rds-endpoint

# S3 Integration
env:
- name: AWS_S3_BUCKET
  valueFrom:
    configMapKeyRef:
      name: aws-config
      key: s3-bucket-name
```

### Third-party Services
```yaml
# Stripe integration
env:
- name: STRIPE_SECRET_KEY
  valueFrom:
    secretKeyRef:
      name: payment-secrets
      key: stripe-secret-key

# Email service
env:
- name: SMTP_PASSWORD
  valueFrom:
    secretKeyRef:
      name: notification-secrets
      key: smtp-password
```

## 📞 Support

- **Kubernetes Docs**: https://kubernetes.io/docs/
- **kubectl Reference**: https://kubectl.docs.kubernetes.io/
- **Ingress NGINX**: https://kubernetes.github.io/ingress-nginx/
