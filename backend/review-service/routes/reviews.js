const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const { authenticateToken, authorizeRoles } = require('/app/shared/middleware/auth');
const {
  validateReviewCreation,
  validateMongoId
} = require('/app/shared/middleware/validation');

// Public routes
router.get('/product/:productId', validateMongoId('productId'), reviewController.getProductReviews);
router.get('/featured', reviewController.getFeaturedReviews);

// All other routes require authentication
router.use(authenticateToken);

// User routes
router.get('/my-reviews', reviewController.getMyReviews);
router.post('/', validateReviewCreation, reviewController.createReview);
router.put('/:id', validateMongoId('id'), reviewController.updateReview);
router.delete('/:id', validateMongoId('id'), reviewController.deleteReview);
router.post('/:id/helpful', validateMongoId('id'), reviewController.markReviewHelpful);
router.post('/:id/not-helpful', validateMongoId('id'), reviewController.markReviewNotHelpful);

// Admin routes
router.get('/admin/all', authorizeRoles('admin'), reviewController.getAllReviewsAdmin);
router.get('/admin/:id', authorizeRoles('admin'), validateMongoId('id'), reviewController.getReviewByIdAdmin);
router.patch('/:id/approve', authorizeRoles('admin'), validateMongoId('id'), reviewController.approveReview);
router.patch('/:id/reject', authorizeRoles('admin'), validateMongoId('id'), reviewController.rejectReview);

module.exports = router;
