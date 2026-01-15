const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

// Dashboard routes
router.get('/dashboard', searchController.getSearchDashboard);
router.get('/analytics', searchController.getSearchAnalytics);

module.exports = router;
