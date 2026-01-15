const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticateToken, authorizeRoles } = require('/app/shared/middleware/auth');
const {
  validateProductCreation,
  validateProductUpdate,
  validateMongoId
} = require('/app/shared/middleware/validation');

// Public routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/category/:category', productController.getProductsByCategory);
router.get('/search', productController.searchProducts);
router.get('/:id', validateMongoId('id'), productController.getProductById);

// Protected routes - require authentication
router.use(authenticateToken);

// Seller routes
router.post('/', 
  authorizeRoles('seller', 'admin'),
  validateProductCreation,
  productController.createProduct
);

router.put('/:id',
  authorizeRoles('seller', 'admin'),
  validateMongoId('id'),
  validateProductUpdate,
  productController.updateProduct
);

router.delete('/:id',
  authorizeRoles('seller', 'admin'),
  validateMongoId('id'),
  productController.deleteProduct
);

router.patch('/:id/status',
  authorizeRoles('seller', 'admin'),
  validateMongoId('id'),
  productController.updateProductStatus
);

// Admin routes
router.get('/admin/all',
  authorizeRoles('admin'),
  productController.getAllProductsAdmin
);

module.exports = router;
