# E-commerce Marketplace API Documentation

## Overview

This document provides comprehensive API documentation for the Amazon-like e-commerce marketplace system. The system follows a microservices architecture with the following services:

- **API Gateway** (Port 3000) - Central entry point and authentication
- **Product Service** (Port 3001) - Product catalog and inventory management
- **Order Service** (Port 3002) - Order processing and management
- **Payment Service** (Port 3003) - Payment processing and refunds
- **Review Service** (Port 3004) - Product reviews and ratings
- **Search Service** (Port 3005) - Product search and analytics
- **Notification Service** (Port 3006) - Email, SMS, and push notifications

## Base URL

```
http://localhost:3000/api
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "role": "buyer", // "buyer" or "seller"
  "phone": "+1234567890",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

#### Logout
```http
POST /api/auth/logout
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

## Product Service API

### Get Products
```http
GET /api/products?page=1&limit=20&category=Electronics&minPrice=10&maxPrice=1000&sortBy=price&sortOrder=asc
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20)
- `category` (string): Filter by category
- `subcategory` (string): Filter by subcategory
- `minPrice` (number): Minimum price filter
- `maxPrice` (number): Maximum price filter
- `sortBy` (string): Sort field (price, rating, createdAt, name)
- `sortOrder` (string): Sort order (asc, desc)
- `search` (string): Search query

### Get Product by ID
```http
GET /api/products/:id
```

### Create Product (Seller/Admin)
```http
POST /api/products
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Product Name",
  "description": "Product description",
  "price": 99.99,
  "category": "Electronics",
  "subcategory": "Smartphones",
  "brand": "Apple",
  "inventory": {
    "quantity": 100
  },
  "images": [
    {
      "url": "https://example.com/image.jpg",
      "alt": "Product image",
      "isPrimary": true
    }
  ],
  "tags": ["smartphone", "apple", "ios"]
}
```

### Update Product (Seller/Admin)
```http
PUT /api/products/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Product Name",
  "price": 89.99,
  "inventory": {
    "quantity": 150
  }
}
```

### Delete Product (Seller/Admin)
```http
DELETE /api/products/:id
Authorization: Bearer <token>
```

### Get Categories
```http
GET /api/categories
```

### Get Inventory (Seller)
```http
GET /api/inventory/my-products
Authorization: Bearer <token>
```

### Reserve Inventory (Internal)
```http
PATCH /api/inventory/:productId/reserve
Content-Type: application/json

{
  "quantity": 5
}
```

## Order Service API

### Get My Orders
```http
GET /api/orders/my-orders?page=1&limit=20&status=pending
Authorization: Bearer <token>
```

### Get Order by ID
```http
GET /api/orders/my-orders/:id
Authorization: Bearer <token>
```

### Create Order
```http
POST /api/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "items": [
    {
      "productId": "product-id",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "paymentMethod": "stripe",
  "notes": "Special delivery instructions"
}
```

### Cancel Order
```http
PATCH /api/orders/:id/cancel
Authorization: Bearer <token>
Content-Type: application/json

{
  "reason": "No longer needed"
}
```

### Get Seller Orders
```http
GET /api/orders/seller-orders?page=1&limit=20&status=confirmed
Authorization: Bearer <token>
```

### Fulfill Order (Seller)
```http
PATCH /api/orders/:id/fulfill
Authorization: Bearer <token>
```

### Ship Order (Seller)
```http
PATCH /api/orders/:id/ship
Authorization: Bearer <token>
Content-Type: application/json

{
  "trackingNumber": "1Z999AA10123456784",
  "carrier": "UPS",
  "estimatedDelivery": "2024-01-15"
}
```

## Payment Service API

### Create Payment
```http
POST /api/payments
Authorization: Bearer <token>
Content-Type: application/json

{
  "orderId": "order-id",
  "amount": 99.99,
  "paymentMethod": "stripe",
  "paymentDetails": {
    "paymentMethodId": "pm_stripe_token"
  },
  "billingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

### Get Payment by ID
```http
GET /api/payments/:id
Authorization: Bearer <token>
```

### Get My Payments
```http
GET /api/payments/my-payments?page=1&limit=20&status=completed
Authorization: Bearer <token>
```

### Process Refund
```http
POST /api/refunds
Authorization: Bearer <token>
Content-Type: application/json

{
  "paymentId": "payment-id",
  "amount": 50.00,
  "reason": "Product returned"
}
```

### Webhook Endpoints
```http
POST /api/webhooks/stripe
POST /api/webhooks/paypal
```

## Review Service API

### Get Product Reviews
```http
GET /api/reviews/product/:productId?page=1&limit=20&rating=5
```

### Create Review
```http
POST /api/reviews
Authorization: Bearer <token>
Content-Type: application/json

{
  "productId": "product-id",
  "orderId": "order-id",
  "rating": 5,
  "title": "Great product!",
  "comment": "Really happy with this purchase.",
  "images": ["https://example.com/review-image.jpg"]
}
```

### Update Review
```http
PUT /api/reviews/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "rating": 4,
  "comment": "Updated review text."
}
```

### Delete Review
```http
DELETE /api/reviews/:id
Authorization: Bearer <token>
```

### Mark Review Helpful
```http
POST /api/reviews/:id/helpful
Authorization: Bearer <token>
```

### Get Product Rating
```http
GET /api/ratings/product/:productId
```

## Search Service API

### Search Products
```http
GET /api/search/products?q=iphone&page=1&limit=20&category=Electronics&minPrice=100&maxPrice=1000&rating=4&sortBy=relevance&sortOrder=desc
```

### Get Search Suggestions
```http
GET /api/search/suggestions?q=iph&limit=10
```

### Get Trending Searches
```http
GET /api/search/trending?limit=10
```

### Get Categories
```http
GET /api/search/categories
```

### Advanced Search
```http
POST /api/search/advanced
Content-Type: application/json

{
  "query": "smartphone",
  "filters": {
    "category": "Electronics",
    "brand": ["Apple", "Samsung"],
    "priceRange": {
      "min": 100,
      "max": 1000
    },
    "rating": 4,
    "features": ["5G", "Wireless Charging"]
  },
  "sortBy": "rating",
  "sortOrder": "desc"
}
```

## Notification Service API

### Get My Notifications
```http
GET /api/notifications/my-notifications?page=1&limit=20&type=order&status=unread
Authorization: Bearer <token>
```

### Get Unread Count
```http
GET /api/notifications/unread-count
Authorization: Bearer <token>
```

### Mark as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer <token>
```

### Mark All as Read
```http
PATCH /api/notifications/read-all
Authorization: Bearer <token>
```

### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer <token>
```

### Register FCM Token
```http
POST /api/push/register-token
Authorization: Bearer <token>
Content-Type: application/json

{
  "token": "fcm-device-token"
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Human-readable error message",
  "details": "Additional error details (if available)"
}
```

### Common HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `422` - Unprocessable Entity
- `429` - Too Many Requests
- `500` - Internal Server Error
- `503` - Service Unavailable

## Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Search API**: 200 requests per 15 minutes per IP
- **Authentication**: 10 requests per minute per IP

## Pagination

Most list endpoints support pagination with the following parameters:

- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

Response includes pagination metadata:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

## Sorting

Sortable endpoints support:

- `sortBy` (string): Field to sort by
- `sortOrder` (string): `asc` or `desc` (default: `desc`)

## Filtering

Filterable endpoints support various filter parameters as documented in each endpoint.

## Webhooks

### Payment Webhooks

- **Stripe**: `/api/webhooks/stripe`
- **PayPal**: `/api/webhooks/paypal`

Webhook events include:
- Payment succeeded/failed
- Charge disputes
- Refunds processed

## SDK and Client Libraries

Client SDKs are available for:
- JavaScript/Node.js
- Python
- Java
- Go

## Testing

Use the provided Postman collection or use curl examples:

```bash
# Get products
curl -X GET "http://localhost:3000/api/products?page=1&limit=10"

# Create product (requires auth)
curl -X POST "http://localhost:3000/api/products" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":99.99,"category":"Electronics"}'
```

## Support

For API support and questions:
- Documentation: [Link to docs]
- GitHub Issues: [Link to repo]
- Email: support@ecommerce.com
