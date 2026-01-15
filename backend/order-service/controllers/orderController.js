const { v4: uuidv4 } = require('uuid');
const database = require('/app/shared/utils/database');
const orderService = require('../services/orderService');
const logger = require('/app/shared/utils/logger');

class OrderController {
  async getMyOrders(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const userId = req.user.userId;

      const pool = database.getPostgresPool();
      let query = `
        SELECT o.*, 
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'product_id', oi.product_id,
                   'product_name', oi.product_name,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'total_price', oi.total_price
                 )
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.user_id = $1
      `;
      
      const params = [userId];
      
      if (status) {
        query += ` AND o.status = $2`;
        params.push(status);
      }
      
      query += ` 
        GROUP BY o.id 
        ORDER BY o.created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM orders WHERE user_id = $1';
      const countParams = [userId];
      
      if (status) {
        countQuery += ' AND status = $2';
        countParams.push(status);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        orders: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching user orders:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch orders'
      });
    }
  }

  async getMyOrderById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const pool = database.getPostgresPool();
      
      const query = `
        SELECT o.*, 
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'product_id', oi.product_id,
                   'product_name', oi.product_name,
                   'product_sku', oi.product_sku,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'total_price', oi.total_price,
                   'product_snapshot', oi.product_snapshot
                 )
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1 AND o.user_id = $2
        GROUP BY o.id
      `;

      const result = await pool.query(query, [id, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Order not found'
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching order:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch order'
      });
    }
  }

  async createOrder(req, res) {
    try {
      const { items, shippingAddress, billingAddress, paymentMethod, notes } = req.body;
      const userId = req.user.userId;

      // Validate items and calculate totals
      const orderData = await orderService.validateOrderItems(items);
      
      // Generate order number
      const orderNumber = await orderService.generateOrderNumber();

      const pool = database.getPostgresPool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Create order
        const orderQuery = `
          INSERT INTO orders (
            user_id, order_number, status, total_amount, subtotal, 
            tax_amount, shipping_amount, discount_amount,
            shipping_address, billing_address, payment_method, notes
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING *
        `;

        const orderValues = [
          userId,
          orderNumber,
          'pending',
          orderData.totalAmount,
          orderData.subtotal,
          orderData.taxAmount,
          orderData.shippingAmount,
          orderData.discountAmount,
          JSON.stringify(shippingAddress),
          billingAddress ? JSON.stringify(billingAddress) : null,
          paymentMethod,
          notes || null
        ];

        const orderResult = await client.query(orderQuery, orderValues);
        const order = orderResult.rows[0];

        // Create order items
        for (const item of orderData.validatedItems) {
          const itemQuery = `
            INSERT INTO order_items (
              order_id, product_id, product_name, product_sku,
              quantity, unit_price, total_price, product_snapshot
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;

          await client.query(itemQuery, [
            order.id,
            item.productId,
            item.productName,
            item.productSku,
            item.quantity,
            item.unitPrice,
            item.totalPrice,
            JSON.stringify(item.productSnapshot)
          ]);

          // Reserve inventory
          await orderService.reserveInventory(item.productId, item.quantity);
        }

        // Create initial status history
        await client.query(`
          INSERT INTO order_status_history (order_id, status, comment)
          VALUES ($1, $2, $3)
        `, [order.id, 'pending', 'Order created']);

        await client.query('COMMIT');

        // Send notifications
        await orderService.sendOrderNotifications(order, orderData.validatedItems);

        res.status(201).json({
          message: 'Order created successfully',
          order: {
            ...order,
            items: orderData.validatedItems
          }
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error creating order:', error);
      
      if (error.message.includes('Insufficient inventory')) {
        return res.status(400).json({
          error: 'Bad Request',
          message: error.message
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create order'
      });
    }
  }

  async cancelOrder(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;
      const { reason } = req.body;

      const pool = database.getPostgresPool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Check order ownership and status
        const orderCheck = await client.query(
          'SELECT * FROM orders WHERE id = $1 AND user_id = $2',
          [id, userId]
        );

        if (orderCheck.rows.length === 0) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Order not found'
          });
        }

        const order = orderCheck.rows[0];

        if (!['pending', 'confirmed'].includes(order.status)) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Order cannot be cancelled in current status'
          });
        }

        // Update order status
        await client.query(
          'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          ['cancelled', id]
        );

        // Add status history
        await client.query(`
          INSERT INTO order_status_history (order_id, status, comment, changed_by)
          VALUES ($1, $2, $3, $4)
        `, [id, 'cancelled', reason || 'Order cancelled by user', userId]);

        // Release inventory
        const itemsQuery = await client.query(
          'SELECT product_id, quantity FROM order_items WHERE order_id = $1',
          [id]
        );

        for (const item of itemsQuery.rows) {
          await orderService.releaseInventory(item.product_id, item.quantity);
        }

        await client.query('COMMIT');

        // Send cancellation notification
        await orderService.sendCancellationNotification(order, reason);

        res.json({
          message: 'Order cancelled successfully'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error cancelling order:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to cancel order'
      });
    }
  }

  async getSellerOrders(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const sellerId = req.user.userId;

      const pool = database.getPostgresPool();
      
      let query = `
        SELECT DISTINCT o.*, 
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'product_id', oi.product_id,
                   'product_name', oi.product_name,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'total_price', oi.total_price
                 )
               ) as items
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN products p ON oi.product_id = p.id::text
        WHERE p.seller_id = $1
      `;
      
      const params = [sellerId];
      
      if (status) {
        query += ` AND o.status = $2`;
        params.push(status);
      }
      
      query += ` 
        GROUP BY o.id 
        ORDER BY o.created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = `
        SELECT COUNT(DISTINCT o.id) 
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN products p ON oi.product_id = p.id::text
        WHERE p.seller_id = $1
      `;
      const countParams = [sellerId];
      
      if (status) {
        countQuery += ' AND o.status = $2';
        countParams.push(status);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        orders: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching seller orders:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch orders'
      });
    }
  }

  async getSellerOrderById(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user.userId;

      const pool = database.getPostgresPool();
      
      const query = `
        SELECT o.*, 
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'product_id', oi.product_id,
                   'product_name', oi.product_name,
                   'product_sku', oi.product_sku,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'total_price', oi.total_price,
                   'product_snapshot', oi.product_snapshot
                 )
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1 AND EXISTS (
          SELECT 1 FROM order_items oi2
          INNER JOIN products p ON oi2.product_id = p.id::text
          WHERE oi2.order_id = o.id AND p.seller_id = $2
        )
        GROUP BY o.id
      `;

      const result = await pool.query(query, [id, sellerId]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Order not found'
        });
      }

      res.json(result.rows[0]);
    } catch (error) {
      logger.error('Error fetching seller order:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch order'
      });
    }
  }

  async fulfillOrder(req, res) {
    try {
      const { id } = req.params;
      const sellerId = req.user.userId;

      const pool = database.getPostgresPool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Update order status to processing
        await client.query(`
          UPDATE orders 
          SET status = 'processing', updated_at = CURRENT_TIMESTAMP 
          WHERE id = $1 AND status = 'confirmed'
        `, [id]);

        // Add status history
        await client.query(`
          INSERT INTO order_status_history (order_id, status, comment, changed_by)
          VALUES ($1, $2, $3, $4)
        `, [id, 'processing', 'Order is being processed', sellerId]);

        await client.query('COMMIT');

        res.json({
          message: 'Order marked as processing'
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error fulfilling order:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fulfill order'
      });
    }
  }

  async shipOrder(req, res) {
    try {
      const { id } = req.params;
      const { trackingNumber, carrier, estimatedDelivery } = req.body;
      const sellerId = req.user.userId;

      const pool = database.getPostgresPool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Update order with shipping information
        await client.query(`
          UPDATE orders 
          SET status = 'shipped', 
              tracking_number = $1,
              estimated_delivery = $2,
              updated_at = CURRENT_TIMESTAMP 
          WHERE id = $3 AND status = 'processing'
        `, [trackingNumber, estimatedDelivery, id]);

        // Add status history
        await client.query(`
          INSERT INTO order_status_history (order_id, status, comment, changed_by)
          VALUES ($1, $2, $3, $4)
        `, [id, 'shipped', `Order shipped with ${carrier}. Tracking: ${trackingNumber}`, sellerId]);

        await client.query('COMMIT');

        // Send shipping notification
        await orderService.sendShippingNotification(id, trackingNumber, carrier);

        res.json({
          message: 'Order shipped successfully',
          trackingNumber,
          estimatedDelivery
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error shipping order:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to ship order'
      });
    }
  }

  async getAllOrdersAdmin(req, res) {
    try {
      const { page = 1, limit = 50, status, userId, dateFrom, dateTo } = req.query;

      const pool = database.getPostgresPool();
      
      let query = `
        SELECT o.*, 
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'product_id', oi.product_id,
                   'product_name', oi.product_name,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'total_price', oi.total_price
                 )
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE 1=1
      `;
      
      const params = [];
      
      if (status) {
        query += ` AND o.status = $${params.length + 1}`;
        params.push(status);
      }
      
      if (userId) {
        query += ` AND o.user_id = $${params.length + 1}`;
        params.push(userId);
      }
      
      if (dateFrom) {
        query += ` AND o.created_at >= $${params.length + 1}`;
        params.push(dateFrom);
      }
      
      if (dateTo) {
        query += ` AND o.created_at <= $${params.length + 1}`;
        params.push(dateTo);
      }
      
      query += ` 
        GROUP BY o.id 
        ORDER BY o.created_at DESC 
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `;
      
      params.push(limit, (page - 1) * limit);

      const result = await pool.query(query, params);

      // Get total count
      let countQuery = 'SELECT COUNT(*) FROM orders o WHERE 1=1';
      const countParams = [];
      
      if (status) {
        countQuery += ` AND o.status = $${countParams.length + 1}`;
        countParams.push(status);
      }
      
      if (userId) {
        countQuery += ` AND o.user_id = $${countParams.length + 1}`;
        countParams.push(userId);
      }
      
      if (dateFrom) {
        countQuery += ` AND o.created_at >= $${countParams.length + 1}`;
        countParams.push(dateFrom);
      }
      
      if (dateTo) {
        countQuery += ` AND o.created_at <= $${countParams.length + 1}`;
        countParams.push(dateTo);
      }
      
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].count);

      res.json({
        orders: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching all orders for admin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch orders'
      });
    }
  }

  async getOrderByIdAdmin(req, res) {
    try {
      const { id } = req.params;

      const pool = database.getPostgresPool();
      
      const query = `
        SELECT o.*, 
               json_agg(
                 json_build_object(
                   'id', oi.id,
                   'product_id', oi.product_id,
                   'product_name', oi.product_name,
                   'product_sku', oi.product_sku,
                   'quantity', oi.quantity,
                   'unit_price', oi.unit_price,
                   'total_price', oi.total_price,
                   'product_snapshot', oi.product_snapshot
                 )
               ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Order not found'
        });
      }

      // Get status history
      const historyQuery = `
        SELECT * FROM order_status_history 
        WHERE order_id = $1 
        ORDER BY created_at ASC
      `;
      const historyResult = await pool.query(historyQuery, [id]);

      res.json({
        ...result.rows[0],
        statusHistory: historyResult.rows
      });
    } catch (error) {
      logger.error('Error fetching order for admin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch order'
      });
    }
  }

  async updateOrderStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, comment } = req.body;
      const adminId = req.user.userId;

      const pool = database.getPostgresPool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Update order status
        await client.query(`
          UPDATE orders 
          SET status = $1, updated_at = CURRENT_TIMESTAMP 
          WHERE id = $2
        `, [status, id]);

        // Add status history
        await client.query(`
          INSERT INTO order_status_history (order_id, status, comment, changed_by)
          VALUES ($1, $2, $3, $4)
        `, [id, status, comment || `Status updated to ${status}`, adminId]);

        await client.query('COMMIT');

        res.json({
          message: 'Order status updated successfully',
          status
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error updating order status:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update order status'
      });
    }
  }
}

module.exports = new OrderController();
