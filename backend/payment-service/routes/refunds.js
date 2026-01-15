const express = require('express');
const router = express.Router();
const refundController = require('../controllers/refundController');
const { authenticateToken, authorizeRoles } = require('/app/shared/middleware/auth');

// All refund routes require authentication
router.use(authenticateToken);

// Create refund
router.post('/', refundController.createRefund);

// Get refund by ID
router.get('/:id', refundController.getRefundById);

// Get user's refunds
router.get('/my-refunds', refundController.getUserRefunds);

// Get refunds by payment ID
router.get('/payment/:paymentId', refundController.getRefundsByPaymentId);

// Admin routes
router.get('/admin/all', authorizeRoles('admin'), refundController.getAllRefundsAdmin);
router.get('/admin/:id', authorizeRoles('admin'), refundController.getRefundByIdAdmin);

module.exports = router;
