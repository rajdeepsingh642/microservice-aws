const searchService = require('../services/searchService');
const logger = require('/app/shared/utils/logger');

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

  // Search Dashboard
  async getSearchDashboard(req, res) {
    try {
      // Mock dashboard data
      const dashboardData = {
        summary: {
          totalSearches: 15420,
          todaySearches: 342,
          averageResultsPerSearch: 12.5,
          topQueries: ['laptop', 'phone', 'headphones', 'watch', 'shoes']
        },
        searchTrends: [
          { date: '2024-01-13', searches: 342 },
          { date: '2024-01-12', searches: 298 },
          { date: '2024-01-11', searches: 276 },
          { date: '2024-01-10', searches: 315 },
          { date: '2024-01-09', searches: 289 }
        ],
        categoryBreakdown: [
          { category: 'Electronics', percentage: 45, searches: 6939 },
          { category: 'Clothing', percentage: 22, searches: 3392 },
          { category: 'Home & Garden', percentage: 15, searches: 2313 },
          { category: 'Sports', percentage: 10, searches: 1542 },
          { category: 'Books', percentage: 8, searches: 1234 }
        ],
        topProducts: [
          { name: 'Wireless Headphones', searches: 234, category: 'Electronics' },
          { name: 'Smart Watch', searches: 189, category: 'Electronics' },
          { name: 'Laptop Stand', searches: 156, category: 'Accessories' },
          { name: 'Running Shoes', searches: 143, category: 'Sports' },
          { name: 'Winter Jacket', searches: 128, category: 'Clothing' }
        ]
      };

      res.json({
        success: true,
        data: dashboardData
      });

    } catch (error) {
      logger.error('Error getting search dashboard:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get search dashboard'
      });
    }
  }

  // Search Analytics
  async getSearchAnalytics(req, res) {
    try {
      const { period = '7d' } = req.query;

      // Mock analytics data based on period
      const analyticsData = {
        period,
        searchVolume: {
          total: 15420,
          trend: '+12.5%',
          data: [
            { timestamp: '2024-01-07T00:00:00Z', searches: 198 },
            { timestamp: '2024-01-08T00:00:00Z', searches: 234 },
            { timestamp: '2024-01-09T00:00:00Z', searches: 289 },
            { timestamp: '2024-01-10T00:00:00Z', searches: 315 },
            { timestamp: '2024-01-11T00:00:00Z', searches: 276 },
            { timestamp: '2024-01-12T00:00:00Z', searches: 298 },
            { timestamp: '2024-01-13T00:00:00Z', searches: 342 }
          ]
        },
        topQueries: [
          { query: 'laptop', count: 1234, trend: '+8.2%' },
          { query: 'phone', count: 987, trend: '+12.1%' },
          { query: 'headphones', count: 756, trend: '+5.4%' },
          { query: 'watch', count: 623, trend: '+15.3%' },
          { query: 'shoes', count: 512, trend: '+7.8%' }
        ],
        searchPerformance: {
          averageResultsPerSearch: 12.5,
          averageSearchTime: '0.34s',
          zeroResultsRate: '8.2%',
          clickThroughRate: '23.4%'
        },
        deviceBreakdown: [
          { device: 'Desktop', percentage: 52, searches: 8018 },
          { device: 'Mobile', percentage: 38, searches: 5860 },
          { device: 'Tablet', percentage: 10, searches: 1542 }
        ]
      };

      res.json({
        success: true,
        data: analyticsData
      });

    } catch (error) {
      logger.error('Error getting search analytics:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get search analytics'
      });
    }
  }
}

module.exports = new SearchController();
