# E-commerce Marketplace

A complete Amazon-like e-commerce marketplace built with microservices architecture, featuring modern web technologies and best practices.

## Features

### Backend Microservices
- **API Gateway** - Central entry point with authentication and routing
- **Product Service** - Product catalog, inventory management, and search integration
- **Order Service** - Order processing, workflow orchestration, and status tracking
- **Payment Service** - Payment processing with Stripe simulation and refunds
- **Review Service** - Product reviews, ratings, and approval workflow
- **Search Service** - Elasticsearch-powered search with advanced filtering
- **Notification Service** - Multi-channel notifications (email, SMS, push)

### Frontend Applications
- **Buyer App** - Customer shopping experience with cart and wishlist
- **Seller App** - Seller dashboard for product and order management
- **Admin App** - Administrative interface for system management

### Infrastructure
- **Docker & Docker Compose** - Containerization and local development
- **MongoDB** - Product catalog, reviews, users
- **PostgreSQL** - Orders, payments, transactions
- **Redis** - Caching and session management
- **RabbitMQ** - Message queuing for inter-service communication
- **Elasticsearch** - Advanced product search and analytics

### Key Features
- **JWT Authentication** - Secure user authentication with refresh tokens
- **Payment Processing** - Stripe integration with webhook handling
- **Advanced Search** - Full-text search with filtering and suggestions
- **Multi-channel Notifications** - Email, SMS, and push notifications
- **Analytics & Reporting** - Sales, orders, and user analytics
- **Shopping Cart** - Persistent cart with quantity management
- **Reviews & Ratings** - Product reviews with approval system
- **Inventory Management** - Real-time inventory tracking
- **Real-time Updates** - WebSocket support for live updates

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend    │    │  API Gateway    │    │   Backend      │
│   Applications │◄──►│   (Port 3000)   │◄──►│  Microservices   │
│                │    │                 │    │                │
│ • Buyer App   │    │ • Authentication │    │ • Products     │
│ • Seller App  │    │ • Authorization  │    │ • Orders       │
│ • Admin App   │    │ • Rate Limiting │    │ • Payments      │
└─────────────────┘    │ • CORS          │    │ • Reviews       │
                       │ • Validation     │    │ • Search        │
                       └─────────────────┘    │ • Notifications │
                                              └─────────────────┘
```

## Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Document database (products, reviews)
- **PostgreSQL** - Relational database (orders, payments)
- **Redis** - In-memory data store
- **RabbitMQ** - Message broker
- **Elasticsearch** - Search engine
- **JWT** - Authentication tokens
- **Winston** - Logging

### Frontend
- **React 18** - UI library
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Material-UI** - UI component library
- **React Query** - Server state management
- **Axios** - HTTP client

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Nginx** - Reverse proxy (production)
- **GitHub Actions** - CI/CD pipeline

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git
- 4GB+ RAM (8GB+ recommended)
- 20GB+ free disk space

## Quick Start

### 1. Clone Repository
```bash
git clone <repository-url>
cd ecommerce-marketplace
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Services
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### 4. Access Applications
- **API Gateway**: http://localhost:3000
- **Buyer App**: http://localhost:3100
- **Seller App**: http://localhost:3101
- **Admin App**: http://localhost:3102
- **RabbitMQ Management**: http://localhost:15672 (admin/password)
- **Elasticsearch**: http://localhost:9200

## API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All API endpoints (except public ones) require JWT authentication:

```http
Authorization: Bearer <your-jwt-token>
```

### Key Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

#### Products
- `GET /products` - List products with filtering
- `GET /products/:id` - Get product details
- `POST /products` - Create product (seller/admin)
- `PUT /products/:id` - Update product (seller/admin)
- `DELETE /products/:id` - Delete product (seller/admin)

#### Orders
- `GET /orders/my-orders` - Get user orders
- `POST /orders` - Create new order
- `PATCH /orders/:id/cancel` - Cancel order
- `GET /orders/seller-orders` - Get seller orders

#### Payments
- `POST /payments` - Process payment
- `GET /payments/my-payments` - Get user payments
- `POST /refunds` - Process refund

#### Search
- `GET /search/products` - Search products
- `GET /search/suggestions` - Get search suggestions
- `GET /search/trending` - Get trending searches

For detailed API documentation, see [API_DOCUMENTATION.md](./docs/API_DOCUMENTATION.md).

## Project Structure

```
ecommerce-marketplace/
├── backend/                    # Backend microservices
│   ├── api-gateway/          # API Gateway (Port 3000)
│   ├── product-service/        # Product Service (Port 3001)
│   ├── order-service/          # Order Service (Port 3002)
│   ├── payment-service/        # Payment Service (Port 3003)
│   ├── review-service/         # Review Service (Port 3004)
│   ├── search-service/         # Search Service (Port 3005)
│   └── notification-service/  # Notification Service (Port 3006)
├── frontend/                   # Frontend applications
│   ├── buyer-app/            # Buyer Application (Port 3100)
│   ├── seller-app/           # Seller Application (Port 3101)
│   └── admin-app/            # Admin Application (Port 3102)
├── shared/                     # Shared utilities and models
│   ├── models/               # Mongoose schemas
│   ├── middleware/           # Express middleware
│   └── utils/                # Utility functions
├── infrastructure/              # Infrastructure configuration
│   └── scripts/              # Database initialization scripts
├── docs/                      # Documentation
└── docker-compose.yml          # Development environment
```

## Development

### Environment Variables
Key environment variables in `.env`:

```env
# Database Configuration
MONGODB_URI=mongodb://admin:password@localhost:27017/ecommerce?authSource=admin
POSTGRES_URI=postgresql://postgres:password@localhost:5432/ecommerce
REDIS_URL=redis://localhost:6379

# Service URLs
PRODUCT_SERVICE_URL=http://product-service:3001
ORDER_SERVICE_URL=http://order-service:3002
PAYMENT_SERVICE_URL=http://payment-service:3003

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Database Initialization
Databases are automatically initialized on startup:

- **MongoDB**: Creates collections and indexes
- **PostgreSQL**: Creates tables and relationships
- **Redis**: Ready for caching

### Message Queues
RabbitMQ queues are automatically created:
- `product_events` - Product updates
- `order_events` - Order lifecycle events
- `payment_events` - Payment notifications
- `notification_requests` - Notification processing

## Testing

### Running Tests
```bash
# Run tests for all services
npm run test

# Run tests for specific service
cd backend/product-service && npm test
```

### Test Coverage
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows

## Deployment

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Deploy to production
docker-compose -f docker-compose.prod.yml up -d
```

### Kubernetes
```bash
# Apply Kubernetes manifests
kubectl apply -f kubernetes/

# Check deployment status
kubectl get pods -n ecommerce
```

### AWS Infrastructure
```bash
# Deploy with Terraform
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

## Monitoring & Logging

### Health Checks
All services expose `/health` endpoint:
```bash
curl http://localhost:3000/health
```

### Logging
- **Structured Logging**: JSON format with correlation IDs
- **Log Levels**: debug, info, warn, error
- **Log Aggregation**: Centralized log collection
- **Error Tracking**: Automatic error reporting

### Metrics
- **Response Times**: API performance monitoring
- **Error Rates**: Service health metrics
- **Business Metrics**: Orders, revenue, user activity

## Security

### Authentication & Authorization
- **JWT Tokens**: Access and refresh token pattern
- **Role-based Access**: Buyer, Seller, Admin roles
- **Password Security**: Bcrypt hashing with salt
- **Session Management**: Secure token storage

### API Security
- **Rate Limiting**: Prevent abuse and DDoS
- **Input Validation**: Request sanitization
- **CORS Configuration**: Cross-origin security
- **HTTPS Enforcement**: SSL/TLS in production

### Data Protection
- **Encryption**: Data at rest and in transit
- **Access Control**: Least privilege principle
- **Audit Logging**: Security event tracking
- **Backup Strategy**: Regular data backups

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages
- Keep PRs focused and small

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- **Documentation**: [Link to docs]
- **Issues**: [Link to GitHub Issues]
- **Email**: support@ecommerce.com
- **Discord**: [Link to Discord server]

## Acknowledgments

- Built with modern web technologies
- Inspired by leading e-commerce platforms
- Community contributions and feedback
- Open source libraries and tools

---

**Built with ❤️ for the e-commerce community**
