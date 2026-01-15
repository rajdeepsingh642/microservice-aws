const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { authenticateToken, authorizeRoles } = require('/app/shared/middleware/auth');
const { validateMongoId } = require('/app/shared/middleware/validation');

// All inventory routes require authentication
router.use(authenticateToken);

// Seller routes
router.get('/my-products', 
  authorizeRoles('seller'),
  inventoryController.getMyInventory
);

router.patch('/:productId/reserve',
  authorizeRoles('seller'),
  validateMongoId('productId'),
  inventoryController.reserveInventory
);

router.patch('/:productId/release',
  authorizeRoles('seller'),
  validateMongoId('productId'),
  inventoryController.releaseInventory
);

router.patch('/:productId/update',
  authorizeRoles('seller'),
  validateMongoId('productId'),
  inventoryController.updateInventory
);

// Admin routes
router.get('/all',
  authorizeRoles('admin'),
  inventoryController.getAllInventory
);

router.get('/low-stock',
  authorizeRoles('admin'),
  inventoryController.getLowStockProducts
);

module.exports = router;
