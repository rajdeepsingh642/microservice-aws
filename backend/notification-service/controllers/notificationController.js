const { v4: uuidv4 } = require('uuid');
const notificationService = require('../services/notificationService');
const logger = require('/app/shared/utils/logger');

class NotificationController {
  async getMyNotifications(req, res) {
    try {
      const { page = 1, limit = 20, type, status } = req.query;
      const userId = req.user.userId;

      const notifications = await notificationService.getUserNotifications(
        userId,
        {
          page: parseInt(page),
          limit: parseInt(limit),
          type,
          status
        }
      );

      res.json(notifications);
    } catch (error) {
      logger.error('Error fetching user notifications:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch notifications'
      });
    }
  }

  async getUnreadCount(req, res) {
    try {
      const userId = req.user.userId;

      const count = await notificationService.getUnreadCount(userId);

      res.json({ unreadCount: count });
    } catch (error) {
      logger.error('Error getting unread count:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get unread count'
      });
    }
  }

  async markAsRead(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await notificationService.markAsRead(id, userId);

      res.json({
        message: 'Notification marked as read'
      });
    } catch (error) {
      logger.error('Error marking notification as read:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to mark notification as read'
      });
    }
  }

  async markAllAsRead(req, res) {
    try {
      const userId = req.user.userId;

      await notificationService.markAllAsRead(userId);

      res.json({
        message: 'All notifications marked as read'
      });
    } catch (error) {
      logger.error('Error marking all notifications as read:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to mark all notifications as read'
      });
    }
  }

  async deleteNotification(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      await notificationService.deleteNotification(id, userId);

      res.json({
        message: 'Notification deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete notification'
      });
    }
  }

  async sendNotification(req, res) {
    try {
      const { userId, type, title, message, data, channels = ['in_app'] } = req.body;

      // This endpoint is for internal services, so we need to validate the request
      const serviceKey = req.headers['x-service-key'];
      if (serviceKey !== process.env.SERVICE_API_KEY) {
        return res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid service key'
        });
      }

      const notification = await notificationService.sendNotification({
        userId,
        type,
        title,
        message,
        data,
        channels
      });

      res.status(201).json({
        message: 'Notification sent successfully',
        notification
      });
    } catch (error) {
      logger.error('Error sending notification:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to send notification'
      });
    }
  }

  async getAllNotificationsAdmin(req, res) {
    try {
      const { page = 1, limit = 50, type, status, userId, dateFrom, dateTo } = req.query;

      const notifications = await notificationService.getAllNotifications({
        page: parseInt(page),
        limit: parseInt(limit),
        type,
        status,
        userId,
        dateFrom,
        dateTo
      });

      res.json(notifications);
    } catch (error) {
      logger.error('Error fetching all notifications for admin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch notifications'
      });
    }
  }

  async getNotificationStats(req, res) {
    try {
      const { period = '7d' } = req.query;

      const stats = await notificationService.getNotificationStats(period);

      res.json(stats);
    } catch (error) {
      logger.error('Error getting notification stats:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get notification stats'
      });
    }
  }
}

module.exports = new NotificationController();
