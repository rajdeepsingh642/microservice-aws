const express = require('express');
const router = express.Router();
const webhookController = require('../controllers/webhookController');

// Stripe webhook
router.post('/stripe', webhookController.handleStripeWebhook);

// PayPal webhook
router.post('/paypal', webhookController.handlePayPalWebhook);

module.exports = router;
