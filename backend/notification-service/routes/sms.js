const express = require('express');
const router = express.Router();
const smsController = require('../controllers/smsController');

// Send SMS (for internal services)
router.post('/send', smsController.sendSms);

module.exports = router;
