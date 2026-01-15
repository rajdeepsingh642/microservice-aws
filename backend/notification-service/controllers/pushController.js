const notificationService = require('../services/notificationService');
const logger = require('/app/shared/utils/logger');

class PushController {
  async registerFcmToken(req, res) {
    try {
      const { token } = req.body;
      const userId = req.user.userId;

      await notificationService.registerFcmToken(userId, token);

      res.json({
        message: 'FCM token registered successfully'
      });
    } catch (error) {
      logger.error('Error registering FCM token:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to register FCM token'
      });
    }
  }

  async sendPushNotification(req, res) {
    try {
      const { userId, title, message, data } = req.body;

      // Validate service key for internal use
      const serviceKey = req.headers['x-service-key'];
      if (serviceKey !== process.env.SERVICE_API_KEY) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid service key'
        });
      }

      await notificationService.sendPushNotification({
        userId,
        title,
        message,
        data
      });

      res.json({
        message: 'Push notification sent successfully'
      });
    } catch (error) {
      logger.error('Error sending push notification:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send push notification'
      });
    }
  }
}

module.exports = new PushController();
