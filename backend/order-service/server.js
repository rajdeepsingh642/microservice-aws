require('module-alias/register');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const database = require('/app/shared/utils/database');
const logger = require('/app/shared/utils/logger');

// Import routes
const orderRoutes = require('./routes/orders');
const orderItemRoutes = require('./routes/orderItems');

const app = express();
const PORT = process.env.PORT || 3002;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests',
    message: 'Rate limit exceeded. Please try again later.'
  }
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'order-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip
  });

  res.status(err.status || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message || 'Something went wrong',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await database.disconnectAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await database.disconnectAll();
  process.exit(0);
});

// Start server
async function startServer() {
  try {
    // Connect to databases
    await database.connectPostgres(process.env.POSTGRES_URI);
    await database.connectRedis(process.env.REDIS_URL);

    // Initialize database tables
    await initializeDatabase();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Order service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function initializeDatabase() {
  const pool = database.getPostgresPool();
  
  // Create orders table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      order_number VARCHAR(50) UNIQUE NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      total_amount DECIMAL(10,2) NOT NULL,
      subtotal DECIMAL(10,2) NOT NULL,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      shipping_amount DECIMAL(10,2) DEFAULT 0,
      discount_amount DECIMAL(10,2) DEFAULT 0,
      currency VARCHAR(3) DEFAULT 'USD',
      
      shipping_address JSONB NOT NULL,
      billing_address JSONB,
      payment_method VARCHAR(50) NOT NULL,
      payment_status VARCHAR(20) DEFAULT 'pending',
      payment_id VARCHAR(255),
      
      notes TEXT,
      tracking_number VARCHAR(255),
      estimated_delivery DATE,
      actual_delivery DATE,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create order_items table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id UUID NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_sku VARCHAR(100) NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      
      product_snapshot JSONB,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create order_status_history table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_status_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      status VARCHAR(20) NOT NULL,
      comment TEXT,
      changed_by UUID,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
    CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
  `);

  logger.info('Database tables initialized successfully');
}

startServer();

module.exports = app;
