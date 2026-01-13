const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');
const { validateSearchQuery } = require('../../../shared/middleware/validation');

// Public routes
router.get('/products', validateSearchQuery, searchController.searchProducts);
router.get('/suggestions', searchController.getSearchSuggestions);
router.get('/trending', searchController.getTrendingSearches);
router.get('/categories', searchController.getCategories);
router.get('/filters', searchController.getFilterOptions);

// Advanced search
router.post('/advanced', searchController.advancedSearch);

module.exports = router;
