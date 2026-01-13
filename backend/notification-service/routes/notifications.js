const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const { authenticateToken, authorizeRoles } = require('../../../shared/middleware/auth');

// All notification routes require authentication
router.use(authenticateToken);

// User routes
router.get('/my-notifications', notificationController.getMyNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/:id/read', notificationController.markAsRead);
router.patch('/read-all', notificationController.markAllAsRead);
router.delete('/:id', notificationController.deleteNotification);

// Send notification (for internal services)
router.post('/send', notificationController.sendNotification);

// Admin routes
router.get('/admin/all', authorizeRoles('admin'), notificationController.getAllNotificationsAdmin);
router.get('/admin/stats', authorizeRoles('admin'), notificationController.getNotificationStats);

module.exports = router;
