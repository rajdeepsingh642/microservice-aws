const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const { authenticateToken } = require('/app/shared/middleware/auth');

// Register FCM token
router.post('/register-token', authenticateToken, pushController.registerFcmToken);

// Send push notification (for internal services)
router.post('/send', pushController.sendPushNotification);

module.exports = router;
