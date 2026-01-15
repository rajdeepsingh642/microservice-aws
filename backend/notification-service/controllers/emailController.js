const notificationService = require('../services/notificationService');
const logger = require('/app/shared/utils/logger');

class EmailController {
  async sendEmail(req, res) {
    try {
      const { to, cc, bcc, subject, text, html, template, templateData } = req.body;

      // Validate service key for internal use
      const serviceKey = req.headers['x-service-key'];
      if (serviceKey !== process.env.SERVICE_API_KEY) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid service key'
        });
      }

      let emailContent;
      if (template) {
        emailContent = await notificationService.generateEmailFromTemplate(template, templateData);
      } else {
        emailContent = { subject, text, html };
      }

      await notificationService.sendEmailNotification({
        to,
        cc,
        bcc,
        ...emailContent
      });

      res.json({
        message: 'Email sent successfully'
      });
    } catch (error) {
      logger.error('Error sending email:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send email'
      });
    }
  }

  async getEmailTemplates(req, res) {
    try {
      const templates = await notificationService.getEmailTemplates();

      res.json({ templates });
    } catch (error) {
      logger.error('Error getting email templates:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get email templates'
      });
    }
  }

  async getEmailTemplate(req, res) {
    try {
      const { id } = req.params;

      const template = await notificationService.getEmailTemplate(id);

      if (!template) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Email template not found'
        });
      }

      res.json(template);
    } catch (error) {
      logger.error('Error getting email template:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get email template'
      });
    }
  }
}

module.exports = new EmailController();
