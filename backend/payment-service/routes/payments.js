const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRoles } = require('../../../shared/middleware/auth');

// All payment routes require authentication
router.use(authenticateToken);

// Create payment
router.post('/', paymentController.createPayment);

// Get payment by ID
router.get('/:id', paymentController.getPaymentById);

// Get user's payments
router.get('/my-payments', paymentController.getUserPayments);

// Get payments by order ID
router.get('/order/:orderId', paymentController.getPaymentsByOrderId);

// Confirm payment (for cash on delivery, etc.)
router.post('/:id/confirm', paymentController.confirmPayment);

// Admin routes
router.get('/admin/all', authorizeRoles('admin'), paymentController.getAllPaymentsAdmin);
router.get('/admin/:id', authorizeRoles('admin'), paymentController.getPaymentByIdAdmin);

module.exports = router;
