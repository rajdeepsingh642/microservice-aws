#!/bin/bash

# 🚀 Production E-commerce Platform Deployment
echo "🚀 Starting Production Deployment..."

# Set environment variables
export NODE_ENV=production
export REACT_APP_API_URL=https://your-domain.com/api
export REACT_APP_ENV=production

# Stop existing containers
echo "🛑 Stopping existing services..."
docker-compose -f docker-compose.prod.yml down --remove-orphans

# Build and start production services
echo "🏗 Building production services..."
docker-compose -f docker-compose.prod.yml up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to initialize..."
sleep 45

# Health checks
echo "🔍 Checking service health..."
echo "API Gateway: $(curl -s http://localhost:3000/health || echo '❌ Down')"
echo "Product Service: $(curl -s http://localhost:3001/health || echo '❌ Down')"
echo "Order Service: $(curl -s http://localhost:3002/health || echo '❌ Down')"
echo "Payment Service: $(curl -s http://localhost:3003/health || echo '❌ Down')"
echo "Buyer App: $(curl -s http://localhost:3008 || echo '❌ Down')"
echo "Seller App: $(curl -s http://localhost:3011 || echo '❌ Down')"

# SSL Certificate Setup
echo "📜 Setting up SSL certificates..."
mkdir -p nginx/ssl

# Generate production SSL certificate (replace with real certificates in production)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=IN/ST=Delhi/L=Your-Company/OU=IT/CN=your-domain.com"

# Start Nginx
echo "🌐 Starting Nginx load balancer..."
docker run -d \
  --name ecommerce-nginx \
  -p 80:80 -p 443:443 \
  -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf \
  -v $(pwd)/nginx/ssl:/etc/nginx/ssl \
  --network ecommerce-network \
  nginx:alpine

# Show final status
echo ""
echo "✅ Production Deployment Complete!"
echo ""
echo "🌐 E-commerce Platform is now live:"
echo "🛒 Buyer App: https://your-domain.com"
echo "🏪 Seller App: https://seller.your-domain.com" 
echo "🔧 API Gateway: https://your-domain.com/api"
echo "📊 Nginx Load Balancer: http://your-domain.com (ports 80/443)"
echo ""
echo "📝 To view logs: docker-compose -f docker-compose.prod.yml logs -f [service-name]"
echo "🛑 To stop: docker-compose -f docker-compose.prod.yml down"
echo ""
echo "🎯 Next Steps:"
echo "1. Update your-domain.com in the nginx.conf file"
echo "2. Replace SSL certificates with real ones"
echo "3. Configure your DNS settings"
echo "4. Set up domain email and monitoring"
echo ""
echo "🚀 Your e-commerce platform is ready for production!"
