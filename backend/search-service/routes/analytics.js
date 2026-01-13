const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRoles } = require('../../../shared/middleware/auth');

// All analytics routes require authentication
router.use(authenticateToken);

// Search analytics
router.get('/search/trends', analyticsController.getSearchTrends);
router.get('/search/popular', analyticsController.getPopularSearches);
router.get('/search/performance', analyticsController.getSearchPerformance);

// Admin only routes
router.get('/admin/dashboard', authorizeRoles('admin'), analyticsController.getAdminDashboard);
router.get('/admin/reports', authorizeRoles('admin'), analyticsController.getAnalyticsReports);

module.exports = router;
