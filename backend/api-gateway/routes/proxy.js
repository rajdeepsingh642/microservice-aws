const express = require('express');
const router = express.Router();
const { createProxyMiddleware } = require('http-proxy-middleware');
const { authenticateToken } = require('/app/shared/middleware/auth');
const proxyService = require('../services/proxyService');

// Service configurations
const services = {
  products: {
    target: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3001',
    changeOrigin: true,
    pathRewrite: {
      '^/products': '/api/products',
      '^/categories': '/api/categories',
      '^/inventory': '/api/inventory'
    }
  },
  orders: {
    target: process.env.ORDER_SERVICE_URL || 'http://localhost:3002',
    changeOrigin: true,
    pathRewrite: {
      '^/orders': '/api/orders',
      '^/order-items': '/api/order-items'
    }
  },
  payments: {
    target: process.env.PAYMENT_SERVICE_URL || 'http://localhost:3003',
    changeOrigin: true,
    pathRewrite: {
      '^/payments': '/api/payments',
      '^/refunds': '/api/refunds',
      '^/webhooks': '/api/webhooks'
    }
  },
  reviews: {
    target: process.env.REVIEW_SERVICE_URL || 'http://localhost:3008',
    changeOrigin: true,
    pathRewrite: {
      '^/reviews': '/api/reviews',
      '^/ratings': '/api/ratings'
    }
  },
  search: {
    target: process.env.SEARCH_SERVICE_URL || 'http://localhost:3005',
    changeOrigin: true,
    pathRewrite: {
      '^/search': '/api/search',
      '^/analytics': '/api/analytics'
    }
  },
  notifications: {
    target: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006',
    changeOrigin: true,
    pathRewrite: {
      '^/notifications': '/api/notifications',
      '^/emails': '/api/emails',
      '^/sms': '/api/sms',
      '^/push': '/api/push'
    }
  }
};

// Create proxy middleware for each service
Object.keys(services).forEach(serviceName => {
  const service = services[serviceName];
  
  // Apply authentication middleware for protected routes
  const publicPaths = [
    '/products',
    '/search',
    '/ratings'
  ];

  const isPublicPath = (path) => {
    return publicPaths.some(publicPath => path.startsWith(publicPath));
  };

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

  Object.keys(service.pathRewrite).forEach(key => {
    const nonRegexPath = key.replace('^', '');
    const routeMatcher = new RegExp(key);
    const maybeAuth = isPublicPath(nonRegexPath) ? (req, res, next) => next() : authenticateToken;

    router.use(routeMatcher, maybeAuth, proxy);
  });
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
