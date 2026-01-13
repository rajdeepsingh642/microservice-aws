const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const database = require('../../../shared/utils/database');
const paymentService = require('../services/paymentService');
const logger = require('../../../shared/utils/logger');

class WebhookController {
  async handleStripeWebhook(req, res) {
    try {
      const sig = req.headers['stripe-signature'];
      const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!webhookSecret) {
        logger.warn('Stripe webhook secret not configured');
        return res.status(400).json({ error: 'Webhook secret not configured' });
      }

      let event;

      try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
      } catch (err) {
        logger.error('Stripe webhook signature verification failed:', err);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentIntentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentIntentFailed(event.data.object);
          break;
        case 'payment_intent.canceled':
          await this.handlePaymentIntentCanceled(event.data.object);
          break;
        case 'charge.succeeded':
          await this.handleChargeSucceeded(event.data.object);
          break;
        case 'charge.failed':
          await this.handleChargeFailed(event.data.object);
          break;
        case 'charge.dispute.created':
          await this.handleChargeDisputeCreated(event.data.object);
          break;
        default:
          logger.info(`Unhandled Stripe event type: ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Error handling Stripe webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  async handlePayPalWebhook(req, res) {
    try {
      const event = req.body;
      const eventType = event.event_type;

      // Handle PayPal webhook events
      switch (eventType) {
        case 'PAYMENT.CAPTURE.COMPLETED':
          await this.handlePayPalPaymentCompleted(event);
          break;
        case 'PAYMENT.CAPTURE.DENIED':
          await this.handlePayPalPaymentDenied(event);
          break;
        case 'PAYMENT.SALE.COMPLETED':
          await this.handlePayPalSaleCompleted(event);
          break;
        case 'PAYMENT.SALE.DENIED':
          await this.handlePayPalSaleDenied(event);
          break;
        default:
          logger.info(`Unhandled PayPal event type: ${eventType}`);
      }

      res.json({ received: true });
    } catch (error) {
      logger.error('Error handling PayPal webhook:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }

  async handlePaymentIntentSucceeded(paymentIntent) {
    try {
      const pool = database.getPostgresPool();
      
      // Find payment by Stripe payment intent ID
      const query = `
        UPDATE payments 
        SET status = 'completed',
            stripe_charge_id = $1,
            stripe_receipt_url = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE stripe_payment_intent_id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [
        paymentIntent.charges.data[0]?.id,
        paymentIntent.charges.data[0]?.receipt_url,
        paymentIntent.id
      ]);

      if (result.rows.length > 0) {
        const payment = result.rows[0];
        logger.info(`Payment ${payment.id} completed via Stripe webhook`);
        
        // Send payment success notification
        await this.sendPaymentSuccessNotification(payment);
      }
    } catch (error) {
      logger.error('Error handling payment intent succeeded:', error);
    }
  }

  async handlePaymentIntentFailed(paymentIntent) {
    try {
      const pool = database.getPostgresPool();
      
      const query = `
        UPDATE payments 
        SET status = 'failed',
            failure_reason = $1,
            failure_code = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE stripe_payment_intent_id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [
        paymentIntent.last_payment_error?.message || 'Payment failed',
        paymentIntent.last_payment_error?.code || 'unknown_error',
        paymentIntent.id
      ]);

      if (result.rows.length > 0) {
        const payment = result.rows[0];
        logger.info(`Payment ${payment.id} failed via Stripe webhook`);
        
        // Send payment failure notification
        await this.sendPaymentFailureNotification(payment);
      }
    } catch (error) {
      logger.error('Error handling payment intent failed:', error);
    }
  }

  async handlePaymentIntentCanceled(paymentIntent) {
    try {
      const pool = database.getPostgresPool();
      
      const query = `
        UPDATE payments 
        SET status = 'cancelled',
            updated_at = CURRENT_TIMESTAMP
        WHERE stripe_payment_intent_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [paymentIntent.id]);

      if (result.rows.length > 0) {
        const payment = result.rows[0];
        logger.info(`Payment ${payment.id} cancelled via Stripe webhook`);
      }
    } catch (error) {
      logger.error('Error handling payment intent canceled:', error);
    }
  }

  async handleChargeSucceeded(charge) {
    try {
      const pool = database.getPostgresPool();
      
      const query = `
        UPDATE payments 
        SET status = 'completed',
            stripe_charge_id = $1,
            stripe_receipt_url = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE stripe_charge_id = $1
        RETURNING *
      `;

      const result = await pool.query(query, [charge.id, charge.receipt_url]);

      if (result.rows.length > 0) {
        const payment = result.rows[0];
        logger.info(`Payment ${payment.id} charge succeeded via Stripe webhook`);
      }
    } catch (error) {
      logger.error('Error handling charge succeeded:', error);
    }
  }

  async handleChargeFailed(charge) {
    try {
      const pool = database.getPostgresPool();
      
      const query = `
        UPDATE payments 
        SET status = 'failed',
            failure_reason = $1,
            failure_code = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE stripe_charge_id = $3
        RETURNING *
      `;

      const result = await pool.query(query, [
        charge.failure_message || 'Charge failed',
        charge.failure_code || 'unknown_error',
        charge.id
      ]);

      if (result.rows.length > 0) {
        const payment = result.rows[0];
        logger.info(`Payment ${payment.id} charge failed via Stripe webhook`);
      }
    } catch (error) {
      logger.error('Error handling charge failed:', error);
    }
  }

  async handleChargeDisputeCreated(dispute) {
    try {
      const pool = database.getPostgresPool();
      
      // Find payment by charge ID
      const query = `
        SELECT * FROM payments 
        WHERE stripe_charge_id = $1
      `;

      const result = await pool.query(query, [dispute.charge]);

      if (result.rows.length > 0) {
        const payment = result.rows[0];
        logger.warn(`Payment ${payment.id} has a dispute created: ${dispute.reason}`);
        
        // Send dispute notification to admin
        await this.sendDisputeNotification(payment, dispute);
      }
    } catch (error) {
      logger.error('Error handling charge dispute created:', error);
    }
  }

  async handlePayPalPaymentCompleted(event) {
    try {
      const pool = database.getPostgresPool();
      
      // Update payment status based on PayPal order ID
      const paypalOrderId = event.resource.supplementary_data.related_ids.order_id;
      
      const query = `
        UPDATE payments 
        SET status = 'completed',
            payment_details = payment_details || $1::jsonb,
            updated_at = CURRENT_TIMESTAMP
        WHERE payment_details->>'paypalOrderId' = $2
        RETURNING *
      `;

      const result = await pool.query(query, [
        JSON.stringify({ paypalCaptureId: event.resource.id }),
        paypalOrderId
      ]);

      if (result.rows.length > 0) {
        const payment = result.rows[0];
        logger.info(`Payment ${payment.id} completed via PayPal webhook`);
        
        // Send payment success notification
        await this.sendPaymentSuccessNotification(payment);
      }
    } catch (error) {
      logger.error('Error handling PayPal payment completed:', error);
    }
  }

  async handlePayPalPaymentDenied(event) {
    try {
      const pool = database.getPostgresPool();
      
      const paypalOrderId = event.resource.supplementary_data.related_ids.order_id;
      
      const query = `
        UPDATE payments 
        SET status = 'failed',
            failure_reason = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE payment_details->>'paypalOrderId' = $2
        RETURNING *
      `;

      const result = await pool.query(query, [
        'PayPal payment denied',
        paypalOrderId
      ]);

      if (result.rows.length > 0) {
        const payment = result.rows[0];
        logger.info(`Payment ${payment.id} denied via PayPal webhook`);
        
        // Send payment failure notification
        await this.sendPaymentFailureNotification(payment);
      }
    } catch (error) {
      logger.error('Error handling PayPal payment denied:', error);
    }
  }

  async handlePayPalSaleCompleted(event) {
    // Similar to payment completed
    await this.handlePayPalPaymentCompleted(event);
  }

  async handlePayPalSaleDenied(event) {
    // Similar to payment denied
    await this.handlePayPalPaymentDenied(event);
  }

  async sendPaymentSuccessNotification(payment) {
    try {
      if (!paymentService.rabbitmqChannel) return;

      const notificationRequest = {
        type: 'payment_success',
        userId: payment.user_id,
        data: {
          paymentId: payment.id,
          orderId: payment.order_id,
          amount: payment.amount,
          paymentMethod: payment.payment_method
        },
        timestamp: new Date().toISOString()
      };

      await paymentService.rabbitmqChannel.sendToQueue(
        'notification_requests',
        Buffer.from(JSON.stringify(notificationRequest)),
        { persistent: true }
      );

      logger.info(`Payment success notification sent for payment ${payment.id}`);
    } catch (error) {
      logger.error('Error sending payment success notification:', error);
    }
  }

  async sendPaymentFailureNotification(payment) {
    try {
      if (!paymentService.rabbitmqChannel) return;

      const notificationRequest = {
        type: 'payment_failure',
        userId: payment.user_id,
        data: {
          paymentId: payment.id,
          orderId: payment.order_id,
          amount: payment.amount,
          paymentMethod: payment.payment_method,
          failureReason: payment.failure_reason
        },
        timestamp: new Date().toISOString()
      };

      await paymentService.rabbitmqChannel.sendToQueue(
        'notification_requests',
        Buffer.from(JSON.stringify(notificationRequest)),
        { persistent: true }
      );

      logger.info(`Payment failure notification sent for payment ${payment.id}`);
    } catch (error) {
      logger.error('Error sending payment failure notification:', error);
    }
  }

  async sendDisputeNotification(payment, dispute) {
    try {
      if (!paymentService.rabbitmqChannel) return;

      const notificationRequest = {
        type: 'payment_dispute',
        userId: 'admin', // Send to admin
        data: {
          paymentId: payment.id,
          orderId: payment.order_id,
          amount: payment.amount,
          disputeReason: dispute.reason,
          disputeId: dispute.id
        },
        timestamp: new Date().toISOString()
      };

      await paymentService.rabbitmqChannel.sendToQueue(
        'notification_requests',
        Buffer.from(JSON.stringify(notificationRequest)),
        { persistent: true }
      );

      logger.info(`Payment dispute notification sent for payment ${payment.id}`);
    } catch (error) {
      logger.error('Error sending dispute notification:', error);
    }
  }
}

module.exports = new WebhookController();
