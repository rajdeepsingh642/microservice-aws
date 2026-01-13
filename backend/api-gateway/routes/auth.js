const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const {
  validateUserRegistration,
  validateUserLogin
} = require('../../../shared/middleware/validation');

// Public auth routes
router.post('/register', validateUserRegistration, authController.register);
router.post('/login', validateUserLogin, authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email/:token', authController.verifyEmail);

// Protected auth routes
router.post('/change-password', authController.changePassword);
router.get('/profile', authController.getProfile);
router.put('/profile', authController.updateProfile);

module.exports = router;
