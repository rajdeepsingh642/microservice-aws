const notificationService = require('../services/notificationService');
const logger = require('/app/shared/utils/logger');

class SmsController {
  async sendSms(req, res) {
    try {
      const { to, message } = req.body;

      // Validate service key for internal use
      const serviceKey = req.headers['x-service-key'];
      if (serviceKey !== process.env.SERVICE_API_KEY) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid service key'
        });
      }

      await notificationService.sendSmsNotification({
        to,
        message
      });

      res.json({
        message: 'SMS sent successfully'
      });
    } catch (error) {
      logger.error('Error sending SMS:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send SMS'
      });
    }
  }
}

module.exports = new SmsController();
