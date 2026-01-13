const searchService = require('../services/searchService');
const logger = require('../../../shared/utils/logger');

class AnalyticsController {
  async getSearchTrends(req, res) {
    try {
      const { period = '7d' } = req.query;

      const trends = await searchService.getSearchTrends(period);

      res.json({ trends });
    } catch (error) {
      logger.error('Error getting search trends:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get search trends'
      });
    }
  }

  async getPopularSearches(req, res) {
    try {
      const { limit = 20, period = '30d' } = req.query;

      const popular = await searchService.getPopularSearches(parseInt(limit), period);

      res.json({ popular });
    } catch (error) {
      logger.error('Error getting popular searches:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get popular searches'
      });
    }
  }

  async getSearchPerformance(req, res) {
    try {
      const { period = '7d' } = req.query;

      const performance = await searchService.getSearchPerformance(period);

      res.json({ performance });
    } catch (error) {
      logger.error('Error getting search performance:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get search performance'
      });
    }
  }

  async getAdminDashboard(req, res) {
    try {
      const dashboard = await searchService.getAdminDashboard();

      res.json(dashboard);
    } catch (error) {
      logger.error('Error getting admin dashboard:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get admin dashboard'
      });
    }
  }

  async getAnalyticsReports(req, res) {
    try {
      const { reportType, period = '30d' } = req.query;

      let report;
      switch (reportType) {
        case 'search_queries':
          report = await searchService.getSearchQueriesReport(period);
          break;
        case 'zero_results':
          report = await searchService.getZeroResultsReport(period);
          break;
        case 'click_through':
          report = await searchService.getClickThroughReport(period);
          break;
        default:
          return res.status(400).json({
            error: 'Bad Request',
            message: 'Invalid report type'
          });
      }

      res.json(report);
    } catch (error) {
      logger.error('Error getting analytics reports:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to get analytics reports'
      });
    }
  }
}

module.exports = new AnalyticsController();
