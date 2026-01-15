const database = require('/app/shared/utils/database');
const logger = require('/app/shared/utils/logger');

class OrderItemController {
  async getOrderItemsByOrderId(req, res) {
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

      // Get order items
      const query = `
        SELECT oi.*, p.name as current_product_name, p.status as current_product_status
        FROM order_items oi
        LEFT JOIN products p ON oi.product_id = p.id::text
        WHERE oi.order_id = $1
        ORDER BY oi.created_at ASC
      `;

      const result = await pool.query(query, [orderId]);

      res.json({
        orderId,
        items: result.rows
      });
    } catch (error) {
      logger.error('Error fetching order items:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch order items'
      });
    }
  }

  async getOrderItemById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const pool = database.getPostgresPool();
      
      const query = `
        SELECT oi.*, o.user_id, p.name as current_product_name, p.status as current_product_status
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id::text
        WHERE oi.id = $1
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Order item not found'
        });
      }

      const orderItem = result.rows[0];

      // Check if user has access to this order item
      if (orderItem.user_id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'Access denied'
        });
      }

      res.json(orderItem);
    } catch (error) {
      logger.error('Error fetching order item:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch order item'
      });
    }
  }

  async getAllOrderItemsAdmin(req, res) {
    try {
      const { page = 1, limit = 50, productId, orderId } = req.query;

      const pool = database.getPostgresPool();
      
      let query = `
        SELECT oi.*, o.order_number, o.user_id, o.status as order_status,
               p.name as current_product_name, p.status as current_product_status
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        LEFT JOIN products p ON oi.product_id = p.id::text
        WHERE 1=1
      `;
      
      const params = [];
      
      if (productId) {
        query += ` AND oi.product_id = $${params.length + 1}`;
        params.push(productId);
      }
      
      if (orderId) {
        query += ` AND oi.order_id = $${params.length + 1}`;
        params.push(orderId);
      }
      
      query += ` 
        ORDER BY oi.created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(*) 
        FROM order_items oi
        INNER JOIN orders o ON oi.order_id = o.id
        WHERE 1=1
      `;
      const countParams = [];
      
      if (productId) {
        countQuery += ` AND oi.product_id = $${countParams.length + 1}`;
        countParams.push(productId);
      }
      
      if (orderId) {
        countQuery += ` AND oi.order_id = $${countParams.length + 1}`;
        countParams.push(orderId);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        items: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching all order items for admin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch order items'
      });
    }
  }
}

module.exports = new OrderItemController();
