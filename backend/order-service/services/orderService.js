const axios = require('axios');
const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const logger = require('/app/shared/utils/logger');

class OrderService {
  constructor() {
    this.rabbitmqConnection = null;
    this.rabbitmqChannel = null;
    this.initializeConnections();
  }

  async initializeConnections() {
    try {
      // Initialize RabbitMQ
      if (process.env.RABBITMQ_URL) {
        this.rabbitmqConnection = await amqp.connect(process.env.RABBITMQ_URL);
        this.rabbitmqChannel = await this.rabbitmqConnection.createChannel();
        await this.setupQueues();
      }
    } catch (error) {
      logger.error('Error initializing order service connections:', error);
    }
  }

  async setupQueues() {
    try {
      await this.rabbitmqChannel.assertQueue('order_events', { durable: true });
      await this.rabbitmqChannel.assertQueue('inventory_updates', { durable: true });
      await this.rabbitmqChannel.assertQueue('payment_requests', { durable: true });
      await this.rabbitmqChannel.assertQueue('notification_requests', { durable: true });
      logger.info('RabbitMQ queues setup completed for order service');
    } catch (error) {
      logger.error('Error setting up RabbitMQ queues:', error);
    }
  }

  async generateOrderNumber() {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  async validateOrderItems(items) {
    try {
      const validatedItems = [];
      let subtotal = 0;

      // Get product service URL
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';

      for (const item of items) {
        // Fetch product details
        const response = await axios.get(`${productServiceUrl}/api/products/${item.productId}`);
        const product = response.data;

        if (!product || product.status !== 'active') {
          throw new Error(`Product ${item.productId} is not available`);
        }

        const availableInventory = product?.inventory?.available ?? product?.stock ?? product?.inventory?.quantity;

        if (typeof availableInventory !== 'number') {
          throw new Error(`Inventory data missing for product ${product.name || item.productId}`);
        }

        if (availableInventory < item.quantity) {
          throw new Error(`Insufficient inventory for product ${product.name}. Available: ${availableInventory}, Requested: ${item.quantity}`);
        }

        const unitPrice = product.price;
        const totalPrice = unitPrice * item.quantity;

        validatedItems.push({
          productId: item.productId,
          productName: product.name,
          productSku: product.sku,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          productSnapshot: {
            name: product.name,
            sku: product.sku,
            price: product.price,
            images: product.images
          }
        });

        subtotal += totalPrice;
      }

      // Calculate totals
      const taxAmount = subtotal * 0.08; // 8% tax
      const shippingAmount = subtotal > 100 ? 0 : 10; // Free shipping over $100
      const discountAmount = 0; // Could be calculated based on promotions
      const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

      return {
        validatedItems,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        totalAmount
      };
    } catch (error) {
      logger.error('Error validating order items:', error);
      throw error;
    }
  }

  async reserveInventory(productId, quantity) {
    try {
      if (typeof productId === 'string' && productId.startsWith('mock')) {
        logger.info(`Skipping inventory reserve for mock product ${productId}`);
        return;
      }
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';
      
      await axios.patch(`${productServiceUrl}/api/inventory/${productId}/reserve`, {
        quantity
      });

      logger.info(`Reserved ${quantity} units of product ${productId}`);
    } catch (error) {
      logger.error('Error reserving inventory:', error);
      throw new Error(`Failed to reserve inventory: ${error.message}`);
    }
  }

  async releaseInventory(productId, quantity) {
    try {
      if (typeof productId === 'string' && productId.startsWith('mock')) {
        logger.info(`Skipping inventory release for mock product ${productId}`);
        return;
      }
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';
      
      await axios.patch(`${productServiceUrl}/api/inventory/${productId}/release`, {
        quantity
      });

      logger.info(`Released ${quantity} units of product ${productId}`);
    } catch (error) {
      logger.error('Error releasing inventory:', error);
      throw new Error(`Failed to release inventory: ${error.message}`);
    }
  }

  async consumeInventory(productId, quantity) {
    try {
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';
      
      // This would be a new endpoint in product service
      await axios.patch(`${productServiceUrl}/api/inventory/${productId}/consume`, {
        quantity
      });

      logger.info(`Consumed ${quantity} units of product ${productId}`);
    } catch (error) {
      logger.error('Error consuming inventory:', error);
      throw new Error(`Failed to consume inventory: ${error.message}`);
    }
  }

  async sendOrderNotifications(order, items) {
    try {
      if (!this.rabbitmqChannel) return;

      // Send order created event
      const orderEvent = {
        type: 'order_created',
        orderId: order.id,
        userId: order.user_id,
        orderNumber: order.order_number,
        totalAmount: order.total_amount,
        itemCount: items.length,
        timestamp: new Date().toISOString()
      };

      await this.rabbitmqChannel.sendToQueue(
        'order_events',
        Buffer.from(JSON.stringify(orderEvent)),
        { persistent: true }
      );

      // Send notification request
      const notificationRequest = {
        type: 'order_confirmation',
        userId: order.user_id,
        data: {
          orderNumber: order.order_number,
          items: items.map(item => ({
            name: item.productName,
            quantity: item.quantity,
            price: item.unitPrice
          })),
          totalAmount: order.total_amount,
          shippingAddress: order.shipping_address
        },
        timestamp: new Date().toISOString()
      };

      await this.rabbitmqChannel.sendToQueue(
        'notification_requests',
        Buffer.from(JSON.stringify(notificationRequest)),
        { persistent: true }
      );

      logger.info(`Order notifications sent for order ${order.id}`);
    } catch (error) {
      logger.error('Error sending order notifications:', error);
    }
  }

  async sendCancellationNotification(order, reason) {
    try {
      if (!this.rabbitmqChannel) return;

      const notificationRequest = {
        type: 'order_cancelled',
        userId: order.user_id,
        data: {
          orderNumber: order.order_number,
          reason: reason || 'Cancelled by user',
          refundAmount: order.total_amount
        },
        timestamp: new Date().toISOString()
      };

      await this.rabbitmqChannel.sendToQueue(
        'notification_requests',
        Buffer.from(JSON.stringify(notificationRequest)),
        { persistent: true }
      );

      logger.info(`Cancellation notification sent for order ${order.id}`);
    } catch (error) {
      logger.error('Error sending cancellation notification:', error);
    }
  }

  async sendShippingNotification(orderId, trackingNumber, carrier) {
    try {
      if (!this.rabbitmqChannel) return;

      const notificationRequest = {
        type: 'order_shipped',
        orderId: orderId,
        data: {
          trackingNumber,
          carrier
        },
        timestamp: new Date().toISOString()
      };

      await this.rabbitmqChannel.sendToQueue(
        'notification_requests',
        Buffer.from(JSON.stringify(notificationRequest)),
        { persistent: true }
      );

      logger.info(`Shipping notification sent for order ${orderId}`);
    } catch (error) {
      logger.error('Error sending shipping notification:', error);
    }
  }

  async processPayment(orderId, amount, paymentMethod, paymentDetails) {
    try {
      const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003';
      
      const paymentResponse = await axios.post(`${paymentServiceUrl}/api/payments`, {
        orderId,
        amount,
        paymentMethod,
        paymentDetails
      });

      return paymentResponse.data;
    } catch (error) {
      logger.error('Error processing payment:', error);
      throw new Error(`Payment processing failed: ${error.message}`);
    }
  }

  async refundPayment(orderId, amount, reason) {
    try {
      const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003';
      
      const refundResponse = await axios.post(`${paymentServiceUrl}/api/refunds`, {
        orderId,
        amount,
        reason
      });

      return refundResponse.data;
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  async getOrderStats(userId, role = 'buyer') {
    try {
      const database = require('/app/shared/utils/database');
      const pool = database.getPostgresPool();

      let query;
      let params;

      if (role === 'buyer') {
        query = `
          SELECT 
            COUNT(*) as total_orders,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
            COUNT(CASE WHEN status = 'shipped' THEN 1 END) as shipped_orders,
            COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_orders,
            COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
            COALESCE(SUM(total_amount), 0) as total_spent,
            COALESCE(AVG(total_amount), 0) as average_order_value
          FROM orders 
          WHERE user_id = $1
        `;
        params = [userId];
      } else if (role === 'seller') {
        query = `
          SELECT 
            COUNT(DISTINCT o.id) as total_orders,
            COUNT(DISTINCT CASE WHEN o.status = 'pending' THEN o.id END) as pending_orders,
            COUNT(DISTINCT CASE WHEN o.status = 'shipped' THEN o.id END) as shipped_orders,
            COUNT(DISTINCT CASE WHEN o.status = 'delivered' THEN o.id END) as delivered_orders,
            COUNT(DISTINCT CASE WHEN o.status = 'cancelled' THEN o.id END) as cancelled_orders,
            COALESCE(SUM(oi.total_price), 0) as total_revenue,
            COALESCE(AVG(o.total_amount), 0) as average_order_value
          FROM orders o
          INNER JOIN order_items oi ON o.id = oi.order_id
          INNER JOIN products p ON oi.product_id = p.id::text
          WHERE p.seller_id = $1
        `;
        params = [userId];
      }

      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting order stats:', error);
      throw error;
    }
  }

  async getRevenueAnalytics(sellerId, period = '30d') {
    try {
      const database = require('/app/shared/utils/database');
      const pool = database.getPostgresPool();

      let dateFilter;
      switch (period) {
        case '7d':
          dateFilter = "o.created_at >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case '30d':
          dateFilter = "o.created_at >= CURRENT_DATE - INTERVAL '30 days'";
          break;
        case '90d':
          dateFilter = "o.created_at >= CURRENT_DATE - INTERVAL '90 days'";
          break;
        case '1y':
          dateFilter = "o.created_at >= CURRENT_DATE - INTERVAL '1 year'";
          break;
        default:
          dateFilter = "1=1";
      }

      const query = `
        SELECT 
          DATE_TRUNC('day', o.created_at) as date,
          COUNT(DISTINCT o.id) as order_count,
          SUM(oi.total_price) as revenue,
          COUNT(DISTINCT o.user_id) as unique_customers
        FROM orders o
        INNER JOIN order_items oi ON o.id = oi.order_id
        INNER JOIN products p ON oi.product_id = p.id::text
        WHERE p.seller_id = $1 AND ${dateFilter}
        GROUP BY DATE_TRUNC('day', o.created_at)
        ORDER BY date DESC
      `;

      const result = await pool.query(query, [sellerId]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting revenue analytics:', error);
      throw error;
    }
  }
}

module.exports = new OrderService();
