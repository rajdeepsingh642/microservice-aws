const express = require('express');
const router = express.Router();
const orderItemController = require('../controllers/orderItemController');
const { authenticateToken, authorizeRoles } = require('/app/shared/middleware/auth');
const { validateMongoId } = require('/app/shared/middleware/validation');

// All order item routes require authentication
router.use(authenticateToken);

// Get order items by order ID
router.get('/order/:orderId', 
  validateMongoId('orderId'), 
  orderItemController.getOrderItemsByOrderId
);

// Get specific order item
router.get('/:id', 
  validateMongoId('id'), 
  orderItemController.getOrderItemById
);

// Admin routes
router.get('/admin/all', 
  authorizeRoles('admin'), 
  orderItemController.getAllOrderItemsAdmin
);

module.exports = router;
