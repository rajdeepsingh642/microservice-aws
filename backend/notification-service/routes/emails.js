const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

// Send email (for internal services)
router.post('/send', emailController.sendEmail);

// Email templates
router.get('/templates', emailController.getEmailTemplates);
router.get('/templates/:id', emailController.getEmailTemplate);

module.exports = router;
