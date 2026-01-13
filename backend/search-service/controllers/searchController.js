const searchService = require('../services/searchService');
const logger = require('../../../shared/utils/logger');

class SearchController {
  async searchProducts(req, res) {
    try {
      const {
        q,
        page = 1,
        limit = 20,
        category,
        subcategory,
        brand,
        minPrice,
        maxPrice,
        rating,
        sortBy = 'relevance',
        sortOrder = 'desc',
        filters = {}
      } = req.query;

      // Build search query
      const searchQuery = {
        query: q || '',
        page: parseInt(page),
        limit: parseInt(limit),
        filters: {
          category,
          subcategory,
          brand,
          minPrice: minPrice ? parseFloat(minPrice) : undefined,
          maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
          rating: rating ? parseInt(rating) : undefined,
          ...filters
        },
        sort: {
          field: sortBy,
          order: sortOrder
        }
      };

      const results = await searchService.searchProducts(searchQuery);

      // Log search for analytics
      await searchService.logSearch(req.ip, q, results.total, req.user?.userId);

      res.json(results);
    } catch (error) {
      logger.error('Error searching products:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to search products'
      });
    }
  }

  async getSearchSuggestions(req, res) {
    try {
      const { q, limit = 10 } = req.query;

      if (!q || q.length < 2) {
        return res.json({ suggestions: [] });
      }

      const suggestions = await searchService.getSearchSuggestions(q, parseInt(limit));

      res.json({ suggestions });
    } catch (error) {
      logger.error('Error getting search suggestions:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get search suggestions'
      });
    }
  }

  async getTrendingSearches(req, res) {
    try {
      const { limit = 10 } = req.query;

      const trending = await searchService.getTrendingSearches(parseInt(limit));

      res.json({ trending });
    } catch (error) {
      logger.error('Error getting trending searches:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get trending searches'
      });
    }
  }

  async getCategories(req, res) {
    try {
      const categories = await searchService.getCategories();

      res.json({ categories });
    } catch (error) {
      logger.error('Error getting categories:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get categories'
      });
    }
  }

  async getFilterOptions(req, res) {
    try {
      const { category } = req.query;

      const filterOptions = await searchService.getFilterOptions(category);

      res.json(filterOptions);
    } catch (error) {
      logger.error('Error getting filter options:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get filter options'
      });
    }
  }

  async advancedSearch(req, res) {
    try {
      const {
        query,
        filters = {},
        page = 1,
        limit = 20,
        sortBy = 'relevance',
        sortOrder = 'desc'
      } = req.body;

      const searchQuery = {
        query,
        page: parseInt(page),
        limit: parseInt(limit),
        filters,
        sort: {
          field: sortBy,
          order: sortOrder
        }
      };

      const results = await searchService.advancedSearch(searchQuery);

      // Log search for analytics
      await searchService.logSearch(req.ip, query, results.total, req.user?.userId);

      res.json(results);
    } catch (error) {
      logger.error('Error performing advanced search:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to perform advanced search'
      });
    }
  }
}

module.exports = new SearchController();
