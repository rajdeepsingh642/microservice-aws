const { Product } = require('../../../shared/models');
const reviewService = require('../services/reviewService');
const logger = require('../../../shared/utils/logger');

class RatingController {
  async getProductRating(req, res) {
    try {
      const { productId } = req.params;

      const product = await Product.findById(productId)
        .select('name ratings')
        .exec();

      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      // Get detailed rating distribution
      const ratingDistribution = await require('../../../shared/models').Review.aggregate([
        { $match: { productId: productId, status: 'approved' } },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: -1 } }
      ]);

      res.json({
        productId,
        productName: product.name,
        averageRating: product.ratings.average,
        totalReviews: product.ratings.count,
        ratingDistribution
      });
    } catch (error) {
      logger.error('Error fetching product rating:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch product rating'
      });
    }
  }

  async getSellerRating(req, res) {
    try {
      const { sellerId } = req.params;

      // Get all products for this seller
      const products = await Product.find({ sellerId })
        .select('name ratings')
        .exec();

      if (products.length === 0) {
        return res.json({
          sellerId,
          averageRating: 0,
          totalReviews: 0,
          totalProducts: 0,
          products: []
        });
      }

      // Calculate seller's overall rating
      let totalReviews = 0;
      let weightedSum = 0;

      products.forEach(product => {
        if (product.ratings.count > 0) {
          weightedSum += product.ratings.average * product.ratings.count;
          totalReviews += product.ratings.count;
        }
      });

      const averageRating = totalReviews > 0 ? weightedSum / totalReviews : 0;

      res.json({
        sellerId,
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews,
        totalProducts: products.length,
        products: products.map(p => ({
          id: p._id,
          name: p.name,
          averageRating: p.ratings.average,
          totalReviews: p.ratings.count
        }))
      });
    } catch (error) {
      logger.error('Error fetching seller rating:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch seller rating'
      });
    }
  }

  async getRatingSummary(req, res) {
    try {
      // Get overall platform rating statistics
      const { Review } = require('../../../shared/models');

      const overallStats = await Review.aggregate([
        { $match: { status: 'approved' } },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingDistribution: {
              $push: '$rating'
            }
          }
        }
      ]);

      const stats = overallStats[0] || { totalReviews: 0, averageRating: 0, ratingDistribution: [] };

      // Calculate distribution
      const distribution = [1, 2, 3, 4, 5].map(rating => ({
        rating,
        count: stats.ratingDistribution.filter(r => r === rating).length
      }));

      // Get top rated products
      const topRatedProducts = await reviewService.getTopRatedProducts(5);

      // Get recent reviews
      const recentReviews = await reviewService.getRecentReviews(5);

      res.json({
        overall: {
          totalReviews: stats.totalReviews,
          averageRating: Math.round(stats.averageRating * 10) / 10,
          ratingDistribution: distribution
        },
        topRatedProducts,
        recentReviews
      });
    } catch (error) {
      logger.error('Error fetching rating summary:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch rating summary'
      });
    }
  }
}

module.exports = new RatingController();
