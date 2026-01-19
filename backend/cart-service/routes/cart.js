const express = require('express');
const router = express.Router();

const { authenticateToken } = require('/app/shared/middleware/auth');
const cartController = require('../controllers/cartController');

router.use(authenticateToken);

router.get('/', cartController.getCart);
router.post('/', cartController.addToCart);
router.put('/:itemId', cartController.updateCartItem);
router.delete('/:itemId', cartController.removeCartItem);
router.delete('/', cartController.clearCart);

module.exports = router;
