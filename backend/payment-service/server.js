require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const database = require('../../shared/utils/database');
const logger = require('../../shared/utils/logger');

// Import routes
const paymentRoutes = require('./routes/payments');
const refundRoutes = require('./routes/refunds');
const webhookRoutes = require('./routes/webhooks');

const app = express();
const PORT = process.env.PORT || 3003;

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
    service: 'payment-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/payments', paymentRoutes);
app.use('/api/refunds', refundRoutes);
app.use('/api/webhooks', webhookRoutes);

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
      logger.info(`Payment service running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

async function initializeDatabase() {
  const pool = database.getPostgresPool();
  
  // Create payments table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id UUID NOT NULL,
      user_id UUID NOT NULL,
      payment_intent_id VARCHAR(255) UNIQUE,
      payment_method VARCHAR(50) NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'USD',
      status VARCHAR(20) DEFAULT 'pending',
      
      payment_details JSONB,
      billing_address JSONB,
      
      stripe_charge_id VARCHAR(255),
      stripe_payment_intent_id VARCHAR(255),
      stripe_receipt_url TEXT,
      
      failure_reason TEXT,
      failure_code VARCHAR(100),
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create refunds table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS refunds (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      order_id UUID NOT NULL,
      user_id UUID NOT NULL,
      refund_id VARCHAR(255) UNIQUE,
      amount DECIMAL(10,2) NOT NULL,
      currency VARCHAR(3) DEFAULT 'USD',
      status VARCHAR(20) DEFAULT 'pending',
      reason TEXT,
      
      stripe_refund_id VARCHAR(255),
      stripe_receipt_url TEXT,
      
      failure_reason TEXT,
      failure_code VARCHAR(100),
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create payment_methods table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payment_methods (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL,
      type VARCHAR(50) NOT NULL,
      provider VARCHAR(50) NOT NULL,
      provider_payment_method_id VARCHAR(255) NOT NULL,
      last4 VARCHAR(4),
      expiry_month INTEGER,
      expiry_year INTEGER,
      brand VARCHAR(50),
      is_default BOOLEAN DEFAULT false,
      is_active BOOLEAN DEFAULT true,
      
      metadata JSONB,
      
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      
      UNIQUE(user_id, provider_payment_method_id)
    );
  `);

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_payments_order_id ON payments(order_id);
    CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
    CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
    CREATE INDEX IF NOT EXISTS idx_payments_stripe_intent ON payments(stripe_payment_intent_id);
    CREATE INDEX IF NOT EXISTS idx_refunds_payment_id ON refunds(payment_id);
    CREATE INDEX IF NOT EXISTS idx_refunds_order_id ON refunds(order_id);
    CREATE INDEX IF NOT EXISTS idx_refunds_user_id ON refunds(user_id);
    CREATE INDEX IF NOT EXISTS idx_payment_methods_user_id ON payment_methods(user_id);
    CREATE INDEX IF NOT EXISTS idx_payment_methods_is_default ON payment_methods(is_default);
  `);

  logger.info('Database tables initialized successfully');
}

startServer();

module.exports = app;
