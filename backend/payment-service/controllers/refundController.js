const database = require('../../../shared/utils/database');
const paymentService = require('../services/paymentService');
const logger = require('../../../shared/utils/logger');

class RefundController {
  async createRefund(req, res) {
    try {
      const { paymentId, amount, reason } = req.body;
      const userId = req.user.userId;

      // Validate refund data
      if (!paymentId || !amount || !reason) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Payment ID, amount, and reason are required'
        });
      }

      // Process refund
      const refund = await paymentService.processRefund(paymentId, amount, reason);

      res.status(201).json({
        message: 'Refund processed successfully',
        refund
      });
    } catch (error) {
      logger.error('Error creating refund:', error);
      
      if (error.message.includes('cannot be refunded') || error.message.includes('not found')) {
        return res.status(400).json({
          error: 'Refund Failed',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to process refund'
      });
    }
  }

  async getRefundById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const pool = database.getPostgresPool();
      
      const query = `
        SELECT r.*, p.user_id as payment_user_id, o.user_id as order_user_id
        FROM refunds r
        INNER JOIN payments p ON r.payment_id = p.id
        INNER JOIN orders o ON r.order_id = o.id
        WHERE r.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Refund not found'
        });
      }

      const refund = result.rows[0];

      // Check if user has access to this refund
      if (refund.payment_user_id !== userId && refund.order_user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied'
        });
      }

      res.json(refund);
    } catch (error) {
      logger.error('Error fetching refund:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch refund'
      });
    }
  }

  async getUserRefunds(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const userId = req.user.userId;

      const pool = database.getPostgresPool();
      
      let query = `
        SELECT r.*, o.order_number, p.payment_method
        FROM refunds r
        INNER JOIN payments p ON r.payment_id = p.id
        INNER JOIN orders o ON r.order_id = o.id
        WHERE r.user_id = $1
      `;
      
      const params = [userId];
      
      if (status) {
        query += ` AND r.status = $2`;
        params.push(status);
      }
      
      query += ` 
        ORDER BY r.created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM refunds WHERE user_id = $1';
      const countParams = [userId];
      
      if (status) {
        countQuery += ' AND status = $2';
        countParams.push(status);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        refunds: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching user refunds:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch refunds'
      });
    }
  }

  async getRefundsByPaymentId(req, res) {
    try {
      const { paymentId } = req.params;
      const userId = req.user.userId;

      const pool = database.getPostgresPool();
      
      // First verify the user has access to this payment
      const paymentCheck = await pool.query(
        'SELECT id FROM payments WHERE id = $1 AND user_id = $2',
        [paymentId, userId]
      );

      if (paymentCheck.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Payment not found or access denied'
        });
      }

      // Get refunds for this payment
      const query = `
        SELECT r.*, o.order_number, p.payment_method
        FROM refunds r
        INNER JOIN payments p ON r.payment_id = p.id
        INNER JOIN orders o ON r.order_id = o.id
        WHERE r.payment_id = $1
        ORDER BY r.created_at DESC
      `;

      const result = await pool.query(query, [paymentId]);

      res.json({
        paymentId,
        refunds: result.rows
      });
    } catch (error) {
      logger.error('Error fetching refunds by payment:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch refunds'
      });
    }
  }

  async getAllRefundsAdmin(req, res) {
    try {
      const { page = 1, limit = 50, status, userId, paymentId, dateFrom, dateTo } = req.query;

      const pool = database.getPostgresPool();
      
      let query = `
        SELECT r.*, o.order_number, p.payment_method, u.email as user_email
        FROM refunds r
        INNER JOIN payments p ON r.payment_id = p.id
        INNER JOIN orders o ON r.order_id = o.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (status) {
        query += ` AND r.status = $${params.length + 1}`;
        params.push(status);
      }
      
      if (userId) {
        query += ` AND r.user_id = $${params.length + 1}`;
        params.push(userId);
      }
      
      if (paymentId) {
        query += ` AND r.payment_id = $${params.length + 1}`;
        params.push(paymentId);
      }
      
      if (dateFrom) {
        query += ` AND r.created_at >= $${params.length + 1}`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        query += ` AND r.created_at <= $${params.length + 1}`;
        params.push(dateTo);
      }
      
      query += ` 
        ORDER BY r.created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM refunds r WHERE 1=1';
      const countParams = [];
      
      if (status) {
        countQuery += ` AND r.status = $${countParams.length + 1}`;
        countParams.push(status);
      }
      
      if (userId) {
        countQuery += ` AND r.user_id = $${countParams.length + 1}`;
        countParams.push(userId);
      }
      
      if (paymentId) {
        countQuery += ` AND r.payment_id = $${countParams.length + 1}`;
        countParams.push(paymentId);
      }
      
      if (dateFrom) {
        countQuery += ` AND r.created_at >= $${countParams.length + 1}`;
        countParams.push(dateFrom);
      }
      
      if (dateTo) {
        countQuery += ` AND r.created_at <= $${countParams.length + 1}`;
        countParams.push(dateTo);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        refunds: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching all refunds for admin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch refunds'
      });
    }
  }

  async getRefundByIdAdmin(req, res) {
    try {
      const { id } = req.params;

      const pool = database.getPostgresPool();
      
      const query = `
        SELECT r.*, o.order_number, p.payment_method, p.amount as payment_amount,
               u.email as user_email, u.first_name, u.last_name
        FROM refunds r
        INNER JOIN payments p ON r.payment_id = p.id
        INNER JOIN orders o ON r.order_id = o.id
        LEFT JOIN users u ON r.user_id = u.id
        WHERE r.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Refund not found'
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching refund for admin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch refund'
      });
    }
  }
}

module.exports = new RefundController();
