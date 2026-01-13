const express = require('express');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authenticateToken } = require('../../../shared/middleware/auth');
const proxyService = require('../services/proxyService');

// Service configurations
const services = {
  products: {
    target: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/api/products': '/api/products',
      '^/api/categories': '/api/categories',
      '^/api/inventory': '/api/inventory'
    }
  },
  orders: {
    target: process.env.ORDER_SERVICE_URL || 'http://order-service:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/api/orders': '/api/orders',
      '^/api/order-items': '/api/order-items'
    }
  },
  payments: {
    target: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/api/payments': '/api/payments',
      '^/api/refunds': '/api/refunds',
      '^/api/webhooks': '/api/webhooks'
    }
  },
  reviews: {
    target: process.env.REVIEW_SERVICE_URL || 'http://review-service:3004',
    changeOrigin: true,
    pathRewrite: {
      '^/api/reviews': '/api/reviews',
      '^/api/ratings': '/api/ratings'
    }
  },
  search: {
    target: process.env.SEARCH_SERVICE_URL || 'http://search-service:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/api/search': '/api/search',
      '^/api/analytics': '/api/analytics'
    }
  },
  notifications: {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006',
    changeOrigin: true,
    pathRewrite: {
      '^/api/notifications': '/api/notifications',
      '^/api/emails': '/api/emails',
      '^/api/sms': '/api/sms',
      '^/api/push': '/api/push'
    }
  }
};

// Create proxy middleware for each service
Object.keys(services).forEach(serviceName => {
  const service = services[serviceName];
  
  const proxy = createProxyMiddleware({
    target: service.target,
    changeOrigin: service.changeOrigin,
    pathRewrite: service.pathRewrite,
    onProxyReq: (proxyReq, req, res) => {
      // Add user information to headers if authenticated
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.userId);
        proxyReq.setHeader('X-User-Email', req.user.email);
        proxyReq.setHeader('X-User-Role', req.user.role);
      }
      
      // Add correlation ID for tracing
      proxyReq.setHeader('X-Correlation-ID', req.headers['x-correlation-id'] || require('uuid').v4());
    },
    onProxyRes: (proxyRes, req, res) => {
      // Log response
      console.log(`${req.method} ${req.originalUrl} -> ${proxyRes.statusCode}`);
    },
    onError: (err, req, res) => {
      console.error(`Proxy error for ${req.method} ${req.originalUrl}:`, err.message);
      res.status(503).json({
        error: 'Service Unavailable',
        message: 'The requested service is currently unavailable'
      });
    }
  });

  // Apply authentication middleware for protected routes
  const publicPaths = [
    '/api/products',
    '/api/search',
    '/api/ratings'
  ];

  const isPublicPath = (path) => {
    return publicPaths.some(publicPath => path.startsWith(publicPath));
  };

  router.use(service.pathRewrite[`^/${Object.keys(service.pathRewrite)[0]}`], 
    isPublicPath ? proxy : authenticateToken, proxy);
});

// Health check for all services
router.get('/health/services', async (req, res) => {
  try {
    const healthStatus = await proxyService.checkAllServicesHealth();
    res.json(healthStatus);
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to check services health'
    });
  }
});

module.exports = router;
