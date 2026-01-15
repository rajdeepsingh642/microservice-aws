const { v4: uuidv4 } = require('uuid');
const database = require('/app/shared/utils/database');
const paymentService = require('../services/paymentService');
const logger = require('/app/shared/utils/logger');

class PaymentController {
  async createPayment(req, res) {
    try {
      const { orderId, amount, paymentMethod, paymentDetails, billingAddress } = req.body;
      const userId = req.user.userId;

      // Validate payment data
      if (!orderId || !amount || !paymentMethod) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Order ID, amount, and payment method are required'
        });
      }

      // Process payment based on method
      let paymentResult;
      switch (paymentMethod) {
        case 'stripe':
          paymentResult = await paymentService.processStripePayment({
            orderId,
            userId,
            amount,
            paymentDetails,
            billingAddress
          });
          break;
        case 'paypal':
          paymentResult = await paymentService.processPayPalPayment({
            orderId,
            userId,
            amount,
            paymentDetails,
            billingAddress
          });
          break;
        case 'cash_on_delivery':
          paymentResult = await paymentService.processCashOnDelivery({
            orderId,
            userId,
            amount,
            paymentDetails,
            billingAddress
          });
          break;
        default:
          return res.status(400).json({
            error: 'Validation Error',
            message: 'Invalid payment method'
          });
      }

      res.status(201).json({
        message: 'Payment initiated successfully',
        payment: paymentResult
      });
    } catch (error) {
      logger.error('Error creating payment:', error);
      
      if (error.message.includes('Insufficient funds') || error.message.includes('Payment declined')) {
        return res.status(400).json({
          error: 'Payment Failed',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process payment'
      });
    }
  }

  async getPaymentById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const pool = database.getPostgresPool();
      
      const query = `
        SELECT p.*, o.order_number, o.user_id as order_user_id
        FROM payments p
        INNER JOIN orders o ON p.order_id = o.id
        WHERE p.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Payment not found'
        });
      }

      const payment = result.rows[0];

      // Check if user has access to this payment
      if (payment.user_id !== userId && payment.order_user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied'
        });
      }

      res.json(payment);
    } catch (error) {
      logger.error('Error fetching payment:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch payment'
      });
    }
  }

  async getUserPayments(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const userId = req.user.userId;

      const pool = database.getPostgresPool();
      
      let query = `
        SELECT p.*, o.order_number
        FROM payments p
        INNER JOIN orders o ON p.order_id = o.id
        WHERE p.user_id = $1
      `;
      
      const params = [userId];
      
      if (status) {
        query += ` AND p.status = $2`;
        params.push(status);
      }
      
      query += ` 
        ORDER BY p.created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM payments WHERE user_id = $1';
      const countParams = [userId];
      
      if (status) {
        countQuery += ' AND status = $2';
        countParams.push(status);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        payments: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching user payments:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch payments'
      });
    }
  }

  async getPaymentsByOrderId(req, res) {
    try {
      const { orderId } = req.params;
      const userId = req.user.userId;

      const pool = database.getPostgresPool();
      
      // First verify the user has access to this order
      const orderCheck = await pool.query(
        'SELECT id FROM orders WHERE id = $1 AND user_id = $2',
        [orderId, userId]
      );

      if (orderCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Order not found or access denied'
        });
      }

      // Get payments for this order
      const query = `
        SELECT p.*, o.order_number
        FROM payments p
        INNER JOIN orders o ON p.order_id = o.id
        WHERE p.order_id = $1
        ORDER BY p.created_at DESC
      `;

      const result = await pool.query(query, [orderId]);

      res.json({
        orderId,
        payments: result.rows
      });
    } catch (error) {
      logger.error('Error fetching payments by order:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch payments'
      });
    }
  }

  async confirmPayment(req, res) {
    try {
      const { id } = req.params;
      const { confirmationCode, notes } = req.body;
      const userId = req.user.userId;

      const pool = database.getPostgresPool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Get payment details
        const paymentQuery = `
          SELECT p.*, o.user_id as order_user_id
          FROM payments p
          INNER JOIN orders o ON p.order_id = o.id
          WHERE p.id = $1 AND p.payment_method = 'cash_on_delivery'
        `;

        const paymentResult = await client.query(paymentQuery, [id]);

        if (paymentResult.rows.length === 0) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Payment not found or not cash on delivery'
          });
        }

        const payment = paymentResult.rows[0];

        // Check if user has access to this payment
        if (payment.user_id !== userId && payment.order_user_id !== userId && req.user.role !== 'admin') {
          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access denied'
          });
        }

        if (payment.status !== 'pending') {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Payment cannot be confirmed in current status'
          });
        }

        // Update payment status
        await client.query(`
          UPDATE payments 
          SET status = 'confirmed', 
              updated_at = CURRENT_TIMESTAMP,
              payment_details = COALESCE(payment_details, '{}') || $1::jsonb
          WHERE id = $2
        `, [JSON.stringify({ confirmationCode, notes, confirmedBy: userId }), id]);

        await client.query('COMMIT');

        // Send confirmation notification
        await paymentService.sendPaymentConfirmationNotification(payment);

        res.json({
          message: 'Payment confirmed successfully'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error confirming payment:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to confirm payment'
      });
    }
  }

  async getAllPaymentsAdmin(req, res) {
    try {
      const { page = 1, limit = 50, status, userId, paymentMethod, dateFrom, dateTo } = req.query;

      const pool = database.getPostgresPool();
      
      let query = `
        SELECT p.*, o.order_number, u.email as user_email
        FROM payments p
        INNER JOIN orders o ON p.order_id = o.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (status) {
        query += ` AND p.status = $${params.length + 1}`;
        params.push(status);
      }
      
      if (userId) {
        query += ` AND p.user_id = $${params.length + 1}`;
        params.push(userId);
      }
      
      if (paymentMethod) {
        query += ` AND p.payment_method = $${params.length + 1}`;
        params.push(paymentMethod);
      }
      
      if (dateFrom) {
        query += ` AND p.created_at >= $${params.length + 1}`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        query += ` AND p.created_at <= $${params.length + 1}`;
        params.push(dateTo);
      }
      
      query += ` 
        ORDER BY p.created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM payments p WHERE 1=1';
      const countParams = [];
      
      if (status) {
        countQuery += ` AND p.status = $${countParams.length + 1}`;
        countParams.push(status);
      }
      
      if (userId) {
        countQuery += ` AND p.user_id = $${countParams.length + 1}`;
        countParams.push(userId);
      }
      
      if (paymentMethod) {
        countQuery += ` AND p.payment_method = $${countParams.length + 1}`;
        countParams.push(paymentMethod);
      }
      
      if (dateFrom) {
        countQuery += ` AND p.created_at >= $${countParams.length + 1}`;
        countParams.push(dateFrom);
      }
      
      if (dateTo) {
        countQuery += ` AND p.created_at <= $${countParams.length + 1}`;
        countParams.push(dateTo);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        payments: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching all payments for admin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch payments'
      });
    }
  }

  async getPaymentByIdAdmin(req, res) {
    try {
      const { id } = req.params;

      const pool = database.getPostgresPool();
      
      const query = `
        SELECT p.*, o.order_number, u.email as user_email, u.first_name, u.last_name
        FROM payments p
        INNER JOIN orders o ON p.order_id = o.id
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Payment not found'
        });
      }

      // Get related refunds
      const refundsQuery = `
        SELECT * FROM refunds 
        WHERE payment_id = $1 
        ORDER BY created_at DESC
      `;
      const refundsResult = await pool.query(refundsQuery, [id]);

      res.json({
        ...result.rows[0],
        refunds: refundsResult.rows
      });
    } catch (error) {
      logger.error('Error fetching payment for admin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch payment'
      });
    }
  }
}

module.exports = new PaymentController();
