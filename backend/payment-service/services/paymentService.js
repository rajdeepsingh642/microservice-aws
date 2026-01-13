const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const database = require('../../../shared/utils/database');
const logger = require('../../../shared/utils/logger');

class PaymentService {
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
      logger.error('Error initializing payment service connections:', error);
    }
  }

  async setupQueues() {
    try {
      await this.rabbitmqChannel.assertQueue('payment_events', { durable: true });
      await this.rabbitmqChannel.assertQueue('notification_requests', { durable: true });
      logger.info('RabbitMQ queues setup completed for payment service');
    } catch (error) {
      logger.error('Error setting up RabbitMQ queues:', error);
    }
  }

  async processStripePayment({ orderId, userId, amount, paymentDetails, billingAddress }) {
    try {
      const pool = database.getPostgresPool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Create payment record
        const paymentId = uuidv4();
        const paymentIntentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const insertQuery = `
          INSERT INTO payments (
            id, order_id, user_id, payment_intent_id, payment_method, 
            amount, currency, status, payment_details, billing_address,
            stripe_payment_intent_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING *
        `;

        const paymentValues = [
          paymentId,
          orderId,
          userId,
          paymentIntentId,
          'stripe',
          amount,
          'USD',
          'processing',
          JSON.stringify(paymentDetails),
          JSON.stringify(billingAddress),
          paymentIntentId
        ];

        const paymentResult = await client.query(insertQuery, paymentValues);
        const payment = paymentResult.rows[0];

        // Create Stripe payment intent
        const stripePaymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: 'usd',
          metadata: {
            orderId: orderId,
            paymentId: paymentId
          },
          payment_method: paymentDetails.paymentMethodId,
          confirmation_method: 'manual',
          confirm: true
        });

        // Update payment with Stripe response
        await client.query(`
          UPDATE payments 
          SET stripe_charge_id = $1,
              stripe_receipt_url = $2,
              status = $3,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $4
        `, [
          stripePaymentIntent.charges.data[0]?.id,
          stripePaymentIntent.charges.data[0]?.receipt_url,
          stripePaymentIntent.status === 'succeeded' ? 'completed' : 'failed',
          paymentId
        ]);

        await client.query('COMMIT');

        // Send payment event
        await this.sendPaymentEvent(payment, stripePaymentIntent.status);

        return {
          ...payment,
          clientSecret: stripePaymentIntent.client_secret,
          status: stripePaymentIntent.status === 'succeeded' ? 'completed' : 'failed'
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error processing Stripe payment:', error);
      throw new Error(`Stripe payment failed: ${error.message}`);
    }
  }

  async processPayPalPayment({ orderId, userId, amount, paymentDetails, billingAddress }) {
    try {
      const pool = database.getPostgresPool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Create payment record
        const paymentId = uuidv4();
        const paymentIntentId = `pp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const insertQuery = `
          INSERT INTO payments (
            id, order_id, user_id, payment_intent_id, payment_method, 
            amount, currency, status, payment_details, billing_address
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          RETURNING *
        `;

        const paymentValues = [
          paymentId,
          orderId,
          userId,
          paymentIntentId,
          'paypal',
          amount,
          'USD',
          'pending',
          JSON.stringify(paymentDetails),
          JSON.stringify(billingAddress)
        ];

        const paymentResult = await client.query(insertQuery, paymentValues);
        const payment = paymentResult.rows[0];

        await client.query('COMMIT');

        // In a real implementation, you would integrate with PayPal API here
        // For now, we'll simulate PayPal payment
        const paypalResult = await this.simulatePayPalPayment(paymentDetails, amount);

        // Update payment status
        await pool.query(`
          UPDATE payments 
          SET status = $1, 
              payment_details = payment_details || $2::jsonb,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = $3
        `, [paypalResult.status, JSON.stringify({ paypalOrderId: paypalResult.orderId }), paymentId]);

        // Send payment event
        await this.sendPaymentEvent(payment, paypalResult.status);

        return {
          ...payment,
          paypalOrderId: paypalResult.orderId,
          approvalUrl: paypalResult.approvalUrl,
          status: paypalResult.status
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error processing PayPal payment:', error);
      throw new Error(`PayPal payment failed: ${error.message}`);
    }
  }

  async processCashOnDelivery({ orderId, userId, amount, paymentDetails, billingAddress }) {
    try {
      const pool = database.getPostgresPool();

      // Create payment record
      const paymentId = uuidv4();
      const paymentIntentId = `cod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const insertQuery = `
        INSERT INTO payments (
          id, order_id, user_id, payment_intent_id, payment_method, 
          amount, currency, status, payment_details, billing_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const paymentValues = [
        paymentId,
        orderId,
        userId,
        paymentIntentId,
        'cash_on_delivery',
        amount,
        'USD',
        'pending',
        JSON.stringify(paymentDetails),
        JSON.stringify(billingAddress)
      ];

      const result = await pool.query(insertQuery, paymentValues);
      const payment = result.rows[0];

      // Send payment event
      await this.sendPaymentEvent(payment, 'pending');

      return payment;
    } catch (error) {
      logger.error('Error processing cash on delivery payment:', error);
      throw new Error(`Cash on delivery payment failed: ${error.message}`);
    }
  }

  async simulatePayPalPayment(paymentDetails, amount) {
    // Simulate PayPal API response
    return {
      orderId: `PAYPAL-${Date.now()}`,
      status: 'pending',
      approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=${Date.now()}`
    };
  }

  async processRefund(paymentId, amount, reason) {
    try {
      const pool = database.getPostgresPool();
      const client = await pool.connect();

      try {
        await client.query('BEGIN');

        // Get payment details
        const paymentQuery = 'SELECT * FROM payments WHERE id = $1';
        const paymentResult = await client.query(paymentQuery, [paymentId]);

        if (paymentResult.rows.length === 0) {
          throw new Error('Payment not found');
        }

        const payment = paymentResult.rows[0];

        if (payment.status !== 'completed') {
          throw new Error('Payment cannot be refunded in current status');
        }

        // Create refund record
        const refundId = uuidv4();
        const refundIntentId = `ref_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        const insertRefundQuery = `
          INSERT INTO refunds (
            id, payment_id, order_id, user_id, refund_id, 
            amount, currency, status, reason
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
          RETURNING *
        `;

        const refundValues = [
          refundId,
          paymentId,
          payment.order_id,
          payment.user_id,
          refundIntentId,
          amount,
          'USD',
          'processing',
          reason
        ];

        const refundResult = await client.query(insertRefundQuery, refundValues);
        const refund = refundResult.rows[0];

        // Process refund based on payment method
        let refundStatus;
        if (payment.payment_method === 'stripe' && payment.stripe_charge_id) {
          const stripeRefund = await stripe.refunds.create({
            charge: payment.stripe_charge_id,
            amount: Math.round(amount * 100), // Convert to cents
            reason: 'requested_by_customer',
            metadata: {
              refundId: refundId,
              reason: reason
            }
          });

          await client.query(`
            UPDATE refunds 
            SET stripe_refund_id = $1,
                stripe_receipt_url = $2,
                status = $3,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $4
          `, [
            stripeRefund.id,
            stripeRefund.receipt_url,
            stripeRefund.status === 'succeeded' ? 'completed' : 'failed',
            refundId
          ]);

          refundStatus = stripeRefund.status === 'succeeded' ? 'completed' : 'failed';
        } else {
          // Simulate refund for other payment methods
          await client.query(`
            UPDATE refunds 
            SET status = 'completed',
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [refundId]);

          refundStatus = 'completed';
        }

        await client.query('COMMIT');

        // Send refund notification
        await this.sendRefundNotification(refund, payment);

        return {
          ...refund,
          status: refundStatus
        };
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Error processing refund:', error);
      throw new Error(`Refund processing failed: ${error.message}`);
    }
  }

  async sendPaymentEvent(payment, status) {
    try {
      if (!this.rabbitmqChannel) return;

      const paymentEvent = {
        type: 'payment_processed',
        paymentId: payment.id,
        orderId: payment.order_id,
        userId: payment.user_id,
        amount: payment.amount,
        paymentMethod: payment.payment_method,
        status: status,
        timestamp: new Date().toISOString()
      };

      await this.rabbitmqChannel.sendToQueue(
        'payment_events',
        Buffer.from(JSON.stringify(paymentEvent)),
        { persistent: true }
      );

      logger.info(`Payment event sent for payment ${payment.id}`);
    } catch (error) {
      logger.error('Error sending payment event:', error);
    }
  }

  async sendRefundNotification(refund, payment) {
    try {
      if (!this.rabbitmqChannel) return;

      const notificationRequest = {
        type: 'refund_processed',
        userId: payment.user_id,
        data: {
          refundId: refund.id,
          orderId: payment.order_id,
          amount: refund.amount,
          reason: refund.reason,
          status: refund.status
        },
        timestamp: new Date().toISOString()
      };

      await this.rabbitmqChannel.sendToQueue(
        'notification_requests',
        Buffer.from(JSON.stringify(notificationRequest)),
        { persistent: true }
      );

      logger.info(`Refund notification sent for refund ${refund.id}`);
    } catch (error) {
      logger.error('Error sending refund notification:', error);
    }
  }

  async sendPaymentConfirmationNotification(payment) {
    try {
      if (!this.rabbitmqChannel) return;

      const notificationRequest = {
        type: 'payment_confirmed',
        userId: payment.user_id,
        data: {
          paymentId: payment.id,
          orderId: payment.order_id,
          amount: payment.amount,
          paymentMethod: payment.payment_method
        },
        timestamp: new Date().toISOString()
      };

      await this.rabbitmqChannel.sendToQueue(
        'notification_requests',
        Buffer.from(JSON.stringify(notificationRequest)),
        { persistent: true }
      );

      logger.info(`Payment confirmation notification sent for payment ${payment.id}`);
    } catch (error) {
      logger.error('Error sending payment confirmation notification:', error);
    }
  }

  async getPaymentStats(userId, role = 'buyer') {
    try {
      const pool = database.getPostgresPool();

      let query;
      let params;

      if (role === 'buyer') {
        query = `
          SELECT 
            COUNT(*) as total_payments,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_spent,
            COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0) as average_payment
          FROM payments 
          WHERE user_id = $1
        `;
        params = [userId];
      } else {
        query = `
          SELECT 
            COUNT(*) as total_payments,
            COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
            COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
            COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
            COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
            COALESCE(AVG(CASE WHEN status = 'completed' THEN amount END), 0) as average_payment
          FROM payments 
          WHERE 1=1
        `;
        params = [];
      }

      const result = await pool.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting payment stats:', error);
      throw error;
    }
  }

  async getRevenueAnalytics(period = '30d') {
    try {
      const pool = database.getPostgresPool();

      let dateFilter;
      switch (period) {
        case '7d':
          dateFilter = "created_at >= CURRENT_DATE - INTERVAL '7 days'";
          break;
        case '30d':
          dateFilter = "created_at >= CURRENT_DATE - INTERVAL '30 days'";
          break;
        case '90d':
          dateFilter = "created_at >= CURRENT_DATE - INTERVAL '90 days'";
          break;
        case '1y':
          dateFilter = "created_at >= CURRENT_DATE - INTERVAL '1 year'";
          break;
        default:
          dateFilter = "1=1";
      }

      const query = `
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as payment_count,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful_payments,
          SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as revenue,
          COUNT(DISTINCT user_id) as unique_customers
        FROM payments 
        WHERE ${dateFilter}
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date DESC
      `;

      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      logger.error('Error getting revenue analytics:', error);
      throw error;
    }
  }
}

module.exports = new PaymentService();
