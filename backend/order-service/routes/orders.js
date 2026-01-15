const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRoles } = require('/app/shared/middleware/auth');
const {
  validateOrderCreation,
  validateMongoId
} = require('/app/shared/middleware/validation');

// All order routes require authentication
router.use(authenticateToken);

// Buyer routes
router.get('/my-orders', orderController.getMyOrders);
router.get('/my-orders/:id', validateMongoId('id'), orderController.getMyOrderById);
router.post('/', validateOrderCreation, orderController.createOrder);
router.patch('/:id/cancel', validateMongoId('id'), orderController.cancelOrder);

// Seller routes
router.get('/seller-orders', authorizeRoles('seller'), orderController.getSellerOrders);
router.get('/seller-orders/:id', 
  authorizeRoles('seller'), 
  validateMongoId('id'), 
  orderController.getSellerOrderById
);
router.patch('/:id/fulfill', 
  authorizeRoles('seller'), 
  validateMongoId('id'), 
  orderController.fulfillOrder
);
router.patch('/:id/ship', 
  authorizeRoles('seller'), 
  validateMongoId('id'), 
  orderController.shipOrder
);

// Admin routes
router.get('/admin/all', authorizeRoles('admin'), orderController.getAllOrdersAdmin);
router.get('/admin/:id', 
  authorizeRoles('admin'), 
  validateMongoId('id'), 
  orderController.getOrderByIdAdmin
);
router.patch('/:id/status', 
  authorizeRoles('admin'), 
  validateMongoId('id'), 
  orderController.updateOrderStatus
);

module.exports = router;
