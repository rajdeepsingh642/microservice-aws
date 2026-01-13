# Quick Start Guide

## 🚀 Fast Setup with Separate Docker Compose Files

### Option 1: Start Backend Only
```bash
# Start infrastructure and backend services
docker-compose -f docker-compose.backend.yml up -d

# View logs
docker-compose -f docker-compose.backend.yml logs -f

# Stop backend services
docker-compose -f docker-compose.backend.yml down
```

### Option 2: Start Frontend Only
```bash
# Start frontend applications (requires backend running)
docker-compose -f docker-compose.frontend.yml up -d

# View logs
docker-compose -f docker-compose.frontend.yml logs -f

# Stop frontend services
docker-compose -f docker-compose.frontend.yml down
```

### Option 3: Start All Services (Recommended)
```bash
# Step 1: Start backend services first
docker-compose -f docker-compose.backend.yml up -d

# Step 2: Wait 30 seconds for backend to initialize
sleep 30

# Step 3: Start frontend applications
docker-compose -f docker-compose.frontend.yml up -d

# View all logs
docker-compose -f docker-compose.backend.yml logs -f &
docker-compose -f docker-compose.frontend.yml logs -f &
```

## 📱 Access Applications

Once services are running:

- **API Gateway**: http://localhost:3000
- **Buyer App**: http://localhost:3100
- **Seller App**: http://localhost:3101
- **Admin App**: http://localhost:3102
- **RabbitMQ Management**: http://localhost:15672 (admin/password)
- **Elasticsearch**: http://localhost:9200

## 🔧 Environment Setup

Before starting, copy the environment file:
```bash
cp .env.example .env
# Edit .env with your configuration
```

## 📊 Check Service Status

```bash
# Check backend services
docker-compose -f docker-compose.backend.yml ps

# Check frontend services
docker-compose -f docker-compose.frontend.yml ps

# Check all containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

## 🐛 Troubleshooting

### Backend Issues
```bash
# Check specific service logs
docker logs api-gateway
docker logs product-service
docker logs order-service

# Restart specific service
docker-compose -f docker-compose.backend.yml restart api-gateway
```

### Frontend Issues
```bash
# Check frontend logs
docker logs buyer-app
docker logs seller-app
docker logs admin-app

# Rebuild frontend
docker-compose -f docker-compose.frontend.yml build --no-cache
```

### Port Conflicts
If ports are already in use:
```bash
# Kill processes using the ports
sudo lsof -ti:3000 | xargs kill -9
sudo lsof -ti:3100 | xargs kill -9
sudo lsof -ti:3101 | xargs kill -9
sudo lsof -ti:3102 | xargs kill -9
```

## 🔄 Development Workflow

### Making Changes to Backend
```bash
# Changes are automatically mounted
# Just restart the service if needed
docker-compose -f docker-compose.backend.yml restart <service-name>
```

### Making Changes to Frontend
```bash
# Changes are automatically mounted
# React hot reload should work automatically
# If not, restart the frontend service
docker-compose -f docker-compose.frontend.yml restart <app-name>
```

## 📦 Production Deployment

For production, use the original docker-compose.yml:
```bash
docker-compose -f docker-compose.yml up -d
```

## 🧪 Testing Services

### Test Backend Health
```bash
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
```

### Test Frontend Access
```bash
curl http://localhost:3100
curl http://localhost:3101
curl http://localhost:3102
```

## 📝 Notes

- Backend services use ports 3000-3006
- Frontend apps use ports 3100-3102
- Infrastructure services use standard ports (27017, 5432, 6379, 5672, 9200, 15672)
- All services are connected to `ecommerce-network` Docker network
- Volume mounts enable live code changes during development
