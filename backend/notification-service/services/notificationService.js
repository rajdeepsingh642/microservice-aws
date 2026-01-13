const amqp = require('amqplib');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
const admin = require('firebase-admin');
const logger = require('../../../shared/utils/logger');

class NotificationService {
  constructor() {
    this.rabbitmqConnection = null;
    this.rabbitmqChannel = null;
    this.emailTransporter = null;
    this.smsClient = null;
    this.firebaseApp = null;
  }

  async initialize() {
    try {
      // Initialize RabbitMQ
      if (process.env.RABBITMQ_URL) {
        this.rabbitmqConnection = await amqp.connect(process.env.RABBITMQ_URL);
        this.rabbitmqChannel = await this.rabbitmqConnection.createChannel();
        await this.setupQueues();
        await this.startConsumer();
      }

      // Initialize Email Service
      await this.initializeEmailService();

      // Initialize SMS Service
      await this.initializeSmsService();

      // Initialize Firebase for Push Notifications
      await this.initializeFirebase();

      logger.info('Notification service initialized successfully');
    } catch (error) {
      logger.error('Error initializing notification service:', error);
      throw error;
    }
  }

  async setupQueues() {
    try {
      await this.rabbitmqChannel.assertQueue('notification_requests', { durable: true });
      await this.rabbitmqChannel.assertQueue('email_queue', { durable: true });
      await this.rabbitmqChannel.assertQueue('sms_queue', { durable: true });
      await this.rabbitmqChannel.assertQueue('push_queue', { durable: true });
      logger.info('RabbitMQ queues setup completed for notification service');
    } catch (error) {
      logger.error('Error setting up RabbitMQ queues:', error);
    }
  }

  async startConsumer() {
    try {
      await this.rabbitmqChannel.consume('notification_requests', async (msg) => {
        if (msg) {
          try {
            const notification = JSON.parse(msg.content.toString());
            await this.processNotificationRequest(notification);
            this.rabbitmqChannel.ack(msg);
          } catch (error) {
            logger.error('Error processing notification request:', error);
            this.rabbitmqChannel.nack(msg, false, false);
          }
        }
      });
      logger.info('Notification consumer started');
    } catch (error) {
      logger.error('Error starting consumer:', error);
    }
  }

  async initializeEmailService() {
    try {
      this.emailTransporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      // Test email connection
      await this.emailTransporter.verify();
      logger.info('Email service initialized successfully');
    } catch (error) {
      logger.error('Error initializing email service:', error);
    }
  }

  async initializeSmsService() {
    try {
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        this.smsClient = twilio(
          process.env.TWILIO_ACCOUNT_SID,
          process.env.TWILIO_AUTH_TOKEN
        );
        logger.info('SMS service initialized successfully');
      }
    } catch (error) {
      logger.error('Error initializing SMS service:', error);
    }
  }

  async initializeFirebase() {
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount)
        });
        this.firebaseApp = admin;
        logger.info('Firebase initialized successfully');
      }
    } catch (error) {
      logger.error('Error initializing Firebase:', error);
    }
  }

  async processNotificationRequest(notification) {
    try {
      const { userId, type, title, message, data, channels = ['in_app'] } = notification;

      // Get user preferences and contact info
      const userPreferences = await this.getUserPreferences(userId);
      const userInfo = await this.getUserInfo(userId);

      // Store in-app notification
      if (channels.includes('in_app')) {
        await this.storeInAppNotification(notification);
      }

      // Send email
      if (channels.includes('email') && userPreferences.emailNotifications) {
        await this.sendEmailNotification({
          to: userInfo.email,
          subject: title,
          text: message,
          html: this.generateEmailHtml(title, message, data)
        });
      }

      // Send SMS
      if (channels.includes('sms') && userPreferences.smsNotifications && userInfo.phone) {
        await this.sendSmsNotification({
          to: userInfo.phone,
          message: `${title}: ${message}`
        });
      }

      // Send push notification
      if (channels.includes('push') && userPreferences.pushNotifications) {
        await this.sendPushNotification({
          userId,
          title,
          message,
          data
        });
      }

      logger.info(`Notification processed for user ${userId}: ${type}`);
    } catch (error) {
      logger.error('Error processing notification request:', error);
      throw error;
    }
  }

  async sendNotification(notification) {
    try {
      // Store in-app notification
      await this.storeInAppNotification(notification);

      // Queue for other channels
      if (this.rabbitmqChannel) {
        const notificationWithId = {
          ...notification,
          id: require('uuid').v4(),
          timestamp: new Date().toISOString()
        };

        await this.rabbitmqChannel.sendToQueue(
          'notification_requests',
          Buffer.from(JSON.stringify(notificationWithId)),
          { persistent: true }
        );
      }

      return notification;
    } catch (error) {
      logger.error('Error sending notification:', error);
      throw error;
    }
  }

  async storeInAppNotification(notification) {
    try {
      const redis = require('../../../shared/utils/database').getRedisClient();
      
      if (!redis) return;

      const notificationData = {
        id: require('uuid').v4(),
        userId: notification.userId,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data || {},
        status: 'unread',
        createdAt: new Date().toISOString()
      };

      // Store in Redis list for user notifications
      const key = `notifications:${notification.userId}`;
      await redis.lpush(key, JSON.stringify(notificationData));
      
      // Keep only last 100 notifications per user
      await redis.ltrim(key, 0, 99);

      // Update unread count
      await redis.incr(`unread_count:${notification.userId}`);

      logger.info(`In-app notification stored for user ${notification.userId}`);
    } catch (error) {
      logger.error('Error storing in-app notification:', error);
    }
  }

  async sendEmailNotification(emailData) {
    try {
      if (!this.emailTransporter) {
        logger.warn('Email service not available');
        return;
      }

      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@ecommerce.com',
        ...emailData
      };

      await this.emailTransporter.sendMail(mailOptions);
      logger.info(`Email sent to ${emailData.to}`);
    } catch (error) {
      logger.error('Error sending email:', error);
    }
  }

  async sendSmsNotification(smsData) {
    try {
      if (!this.smsClient) {
        logger.warn('SMS service not available');
        return;
      }

      const message = await this.smsClient.messages.create({
        body: smsData.message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: smsData.to
      });

      logger.info(`SMS sent to ${smsData.to}: ${message.sid}`);
    } catch (error) {
      logger.error('Error sending SMS:', error);
    }
  }

  async sendPushNotification(pushData) {
    try {
      if (!this.firebaseApp) {
        logger.warn('Push notification service not available');
        return;
      }

      // Get user's FCM tokens
      const redis = require('../../../shared/utils/database').getRedisClient();
      const tokens = await redis.smembers(`fcm_tokens:${pushData.userId}`);

      if (tokens.length === 0) {
        logger.warn(`No FCM tokens found for user ${pushData.userId}`);
        return;
      }

      const message = {
        notification: {
          title: pushData.title,
          body: pushData.message
        },
        data: pushData.data || {},
        tokens: tokens
      };

      const response = await this.firebaseApp.messaging().sendMulticast(message);
      logger.info(`Push notification sent to ${tokens.length} devices for user ${pushData.userId}`);
    } catch (error) {
      logger.error('Error sending push notification:', error);
    }
  }

  async getUserNotifications(userId, options = {}) {
    try {
      const redis = require('../../../shared/utils/database').getRedisClient();
      
      if (!redis) {
        return { notifications: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
      }

      const key = `notifications:${userId}`;
      const notifications = await redis.lrange(key, 0, -1);
      
      let parsedNotifications = notifications.map(n => JSON.parse(n));

      // Apply filters
      if (options.type) {
        parsedNotifications = parsedNotifications.filter(n => n.type === options.type);
      }

      if (options.status) {
        parsedNotifications = parsedNotifications.filter(n => n.status === options.status);
      }

      // Sort by creation time (newest first)
      parsedNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply pagination
      const page = options.page || 1;
      const limit = options.limit || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedNotifications = parsedNotifications.slice(startIndex, endIndex);

      return {
        notifications: paginatedNotifications,
        pagination: {
          page,
          limit,
          total: parsedNotifications.length,
          pages: Math.ceil(parsedNotifications.length / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting user notifications:', error);
      throw error;
    }
  }

  async getUnreadCount(userId) {
    try {
      const redis = require('../../../shared/utils/database').getRedisClient();
      
      if (!redis) return 0;

      const count = await redis.get(`unread_count:${userId}`);
      return parseInt(count) || 0;
    } catch (error) {
      logger.error('Error getting unread count:', error);
      return 0;
    }
  }

  async markAsRead(notificationId, userId) {
    try {
      const redis = require('../../../shared/utils/database').getRedisClient();
      
      if (!redis) return;

      const key = `notifications:${userId}`;
      const notifications = await redis.lrange(key, 0, -1);
      
      let updated = false;
      for (let i = 0; i < notifications.length; i++) {
        const notification = JSON.parse(notifications[i]);
        if (notification.id === notificationId && notification.status === 'unread') {
          notification.status = 'read';
          await redis.lset(key, i, JSON.stringify(notification));
          updated = true;
          break;
        }
      }

      if (updated) {
        const currentCount = await redis.get(`unread_count:${userId}`);
        const newCount = Math.max(0, parseInt(currentCount) - 1);
        await redis.set(`unread_count:${userId}`, newCount);
      }
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      throw error;
    }
  }

  async markAllAsRead(userId) {
    try {
      const redis = require('../../../shared/utils/database').getRedisClient();
      
      if (!redis) return;

      const key = `notifications:${userId}`;
      const notifications = await redis.lrange(key, 0, -1);
      
      const updatedNotifications = notifications.map(n => {
        const notification = JSON.parse(n);
        if (notification.status === 'unread') {
          notification.status = 'read';
        }
        return JSON.stringify(notification);
      });

      if (updatedNotifications.length > 0) {
        await redis.del(key);
        await redis.lpush(key, ...updatedNotifications);
        await redis.set(`unread_count:${userId}`, 0);
      }
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  async deleteNotification(notificationId, userId) {
    try {
      const redis = require('../../../shared/utils/database').getRedisClient();
      
      if (!redis) return;

      const key = `notifications:${userId}`;
      const notifications = await redis.lrange(key, 0, -1);
      
      let deleted = false;
      for (let i = 0; i < notifications.length; i++) {
        const notification = JSON.parse(notifications[i]);
        if (notification.id === notificationId) {
          await redis.lrem(key, 1, notifications[i]);
          deleted = true;
          
          if (notification.status === 'unread') {
            const currentCount = await redis.get(`unread_count:${userId}`);
            const newCount = Math.max(0, parseInt(currentCount) - 1);
            await redis.set(`unread_count:${userId}`, newCount);
          }
          break;
        }
      }
    } catch (error) {
      logger.error('Error deleting notification:', error);
      throw error;
    }
  }

  async getAllNotifications(options = {}) {
    try {
      // This would typically query a database for all notifications
      // For now, return empty results
      return {
        notifications: [],
        pagination: {
          page: options.page || 1,
          limit: options.limit || 50,
          total: 0,
          pages: 0
        }
      };
    } catch (error) {
      logger.error('Error getting all notifications:', error);
      throw error;
    }
  }

  async getNotificationStats(period = '7d') {
    try {
      // This would typically query analytics data
      // For now, return mock data
      return {
        totalSent: 0,
        totalDelivered: 0,
        totalRead: 0,
        byType: {},
        byChannel: {
          email: 0,
          sms: 0,
          push: 0,
          in_app: 0
        }
      };
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw error;
    }
  }

  async getUserPreferences(userId) {
    try {
      // This would typically fetch from database
      // For now, return default preferences
      return {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        inAppNotifications: true
      };
    } catch (error) {
      logger.error('Error getting user preferences:', error);
      return {
        emailNotifications: true,
        smsNotifications: false,
        pushNotifications: true,
        inAppNotifications: true
      };
    }
  }

  async getUserInfo(userId) {
    try {
      // This would typically fetch from user service
      // For now, return mock data
      return {
        email: `user${userId}@example.com`,
        phone: '+1234567890'
      };
    } catch (error) {
      logger.error('Error getting user info:', error);
      return {
        email: null,
        phone: null
      };
    }
  }

  generateEmailHtml(title, message, data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #007bff; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${title}</h1>
          </div>
          <div class="content">
            <p>${message}</p>
            ${data ? `<pre>${JSON.stringify(data, null, 2)}</pre>` : ''}
          </div>
          <div class="footer">
            <p>This is an automated message from E-commerce Marketplace</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new NotificationService();
