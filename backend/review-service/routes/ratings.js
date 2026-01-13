const express = require('express');
const router = express.Router();
const ratingController = require('../controllers/ratingController');

// Public routes
router.get('/product/:productId', ratingController.getProductRating);
router.get('/seller/:sellerId', ratingController.getSellerRating);

// Admin routes
router.get('/admin/summary', ratingController.getRatingSummary);

module.exports = router;
