const axios = require('axios');
const amqp = require('amqplib');
const { Review, Product } = require('../../../shared/models');
const logger = require('../../../shared/utils/logger');

class ReviewService {
  constructor() {
    this.rabbitmqConnection = null;
    this.rabbitmqChannel = null;
    this.initializeConnections();
  }

  async initializeConnections() {
    try {
      // Initialize RabbitMQ
      if (process.env.RABBITMQ_URL) {
        this.rabbitmqConnection = await amqp.connect(process.env.RABBITMQ_URL);
        this.rabbitmqChannel = await this.rabbitmqConnection.createChannel();
        await this.setupQueues();
      }
    } catch (error) {
      logger.error('Error initializing review service connections:', error);
    }
  }

  async setupQueues() {
    try {
      await this.rabbitmqChannel.assertQueue('review_events', { durable: true });
      await this.rabbitmqChannel.assertQueue('notification_requests', { durable: true });
      logger.info('RabbitMQ queues setup completed for review service');
    } catch (error) {
      logger.error('Error setting up RabbitMQ queues:', error);
    }
  }

  async verifyOrderOwnership(orderId, userId, productId) {
    try {
      const orderServiceUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3002';
      
      const response = await axios.get(`${orderServiceUrl}/api/order-items/order/${orderId}`, {
        headers: {
          'X-User-ID': userId,
          'X-User-Role': 'buyer'
        }
      });

      const orderItems = response.data.items;
      
      // Check if the product is in the order and order belongs to user
      const hasProduct = orderItems.some(item => 
        item.product_id === productId && item.current_product_status === 'active'
      );

      return hasProduct;
    } catch (error) {
      logger.error('Error verifying order ownership:', error);
      return false;
    }
  }

  async updateProductRating(productId) {
    try {
      const ratingStats = await Review.aggregate([
        {
          $match: {
            productId: productId,
            status: 'approved'
          }
        },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 }
          }
        }
      ]);

      const stats = ratingStats[0] || { averageRating: 0, totalReviews: 0 };

      await Product.findByIdAndUpdate(productId, {
        'ratings.average': Math.round(stats.averageRating * 10) / 10, // Round to 1 decimal
        'ratings.count': stats.totalReviews
      });

      logger.info(`Updated rating for product ${productId}: ${stats.averageRating} (${stats.totalReviews} reviews)`);
    } catch (error) {
      logger.error('Error updating product rating:', error);
      throw error;
    }
  }

  async sendNewReviewNotification(review) {
    try {
      if (!this.rabbitmqChannel) return;

      // Get product details to find seller
      const product = await Product.findById(review.productId).populate('sellerId', 'firstName lastName email');
      
      if (!product) return;

      // Send review event
      const reviewEvent = {
        type: 'review_created',
        reviewId: review._id,
        productId: review.productId,
        sellerId: product.sellerId._id,
        rating: review.rating,
        timestamp: new Date().toISOString()
      };

      await this.rabbitmqChannel.sendToQueue(
        'review_events',
        Buffer.from(JSON.stringify(reviewEvent)),
        { persistent: true }
      );

      // Send notification to seller
      const notificationRequest = {
        type: 'new_review',
        userId: product.sellerId._id,
        data: {
          reviewId: review._id,
          productName: product.name,
          rating: review.rating,
          comment: review.comment.substring(0, 100) + '...',
          reviewerName: review.userId.firstName || 'Anonymous'
        },
        timestamp: new Date().toISOString()
      };

      await this.rabbitmqChannel.sendToQueue(
        'notification_requests',
        Buffer.from(JSON.stringify(notificationRequest)),
        { persistent: true }
      );

      logger.info(`New review notification sent for review ${review._id}`);
    } catch (error) {
      logger.error('Error sending new review notification:', error);
    }
  }

  async sendReviewApprovalNotification(review, approved, reason = '') {
    try {
      if (!this.rabbitmqChannel) return;

      const notificationType = approved ? 'review_approved' : 'review_rejected';
      
      const notificationRequest = {
        type: notificationType,
        userId: review.userId,
        data: {
          reviewId: review._id,
          rating: review.rating,
          title: review.title,
          reason: reason
        },
        timestamp: new Date().toISOString()
      };

      await this.rabbitmqChannel.sendToQueue(
        'notification_requests',
        Buffer.from(JSON.stringify(notificationRequest)),
        { persistent: true }
      );

      logger.info(`Review ${notificationType} notification sent for review ${review._id}`);
    } catch (error) {
      logger.error('Error sending review approval notification:', error);
    }
  }

  async getReviewStats(userId, role = 'buyer') {
    try {
      let matchStage;
      
      if (role === 'buyer') {
        matchStage = { userId: userId };
      } else {
        // For sellers, get reviews for their products
        const products = await Product.find({ sellerId: userId }).select('_id');
        const productIds = products.map(p => p._id);
        matchStage = { productId: { $in: productIds } };
      }

      const stats = await Review.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalReviews: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            fiveStarReviews: {
              $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
            },
            fourStarReviews: {
              $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
            },
            threeStarReviews: {
              $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
            },
            twoStarReviews: {
              $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
            },
            oneStarReviews: {
              $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
            },
            pendingReviews: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats[0] || {
        totalReviews: 0,
        averageRating: 0,
        fiveStarReviews: 0,
        fourStarReviews: 0,
        threeStarReviews: 0,
        twoStarReviews: 0,
        oneStarReviews: 0,
        pendingReviews: 0
      };
    } catch (error) {
      logger.error('Error getting review stats:', error);
      throw error;
    }
  }

  async getTopRatedProducts(limit = 10) {
    try {
      const products = await Product.find({ 
        status: 'active',
        'ratings.count': { $gte: 5 } // At least 5 reviews
      })
      .sort({ 'ratings.average': -1, 'ratings.count': -1 })
      .limit(limit)
      .select('name images ratings averagePrice sellerId')
      .populate('sellerId', 'firstName lastName')
      .exec();

      return products;
    } catch (error) {
      logger.error('Error getting top rated products:', error);
      throw error;
    }
  }

  async getRecentReviews(limit = 20) {
    try {
      const reviews = await Review.find({ status: 'approved' })
        .populate('userId', 'firstName lastName')
        .populate('productId', 'name images')
        .sort({ createdAt: -1 })
        .limit(limit)
        .exec();

      return reviews;
    } catch (error) {
      logger.error('Error getting recent reviews:', error);
      throw error;
    }
  }

  async getReviewAnalytics(sellerId, period = '30d') {
    try {
      const products = await Product.find({ sellerId: sellerId }).select('_id');
      const productIds = products.map(p => p._id);

      let dateFilter;
      switch (period) {
        case '7d':
          dateFilter = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
          break;
        case '30d':
          dateFilter = { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) };
          break;
        case '90d':
          dateFilter = { $gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) };
          break;
        case '1y':
          dateFilter = { $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) };
          break;
        default:
          dateFilter = { $gte: new Date(0) };
      }

      const analytics = await Review.aggregate([
        {
          $match: {
            productId: { $in: productIds },
            createdAt: dateFilter,
            status: 'approved'
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            reviewCount: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            fiveStarReviews: {
              $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] }
            },
            fourStarReviews: {
              $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] }
            },
            threeStarReviews: {
              $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] }
            },
            twoStarReviews: {
              $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] }
            },
            oneStarReviews: {
              $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1 } }
      ]);

      return analytics;
    } catch (error) {
      logger.error('Error getting review analytics:', error);
      throw error;
    }
  }

  async flagSuspiciousReviews() {
    try {
      // Find potentially fake reviews based on various criteria
      const suspiciousReviews = await Review.find({
        status: 'approved',
        $or: [
          { comment: { $regex: /^.{1,10}$/ } }, // Very short comments
          { comment: { $regex: /^[A-Z\s]+$/ } }, // All caps
          { helpful: { $eq: { yes: 0, no: 0 } } }, // No helpful votes
          { rating: 5, comment: { $regex: /good|great|excellent|amazing|perfect/i } } // Generic positive
        ]
      })
      .populate('userId', 'firstName lastName email')
      .populate('productId', 'name')
      .limit(50)
      .exec();

      // Send notification to admin about suspicious reviews
      if (suspiciousReviews.length > 0 && this.rabbitmqChannel) {
        const notificationRequest = {
          type: 'suspicious_reviews',
          userId: 'admin',
          data: {
            reviewCount: suspiciousReviews.length,
            reviews: suspiciousReviews.map(r => ({
              id: r._id,
              rating: r.rating,
              comment: r.comment.substring(0, 100),
              user: r.userId.email,
              product: r.productId.name
            }))
          },
          timestamp: new Date().toISOString()
        };

        await this.rabbitmqChannel.sendToQueue(
          'notification_requests',
          Buffer.from(JSON.stringify(notificationRequest)),
          { persistent: true }
        );
      }

      return suspiciousReviews;
    } catch (error) {
      logger.error('Error flagging suspicious reviews:', error);
      throw error;
    }
  }
}

module.exports = new ReviewService();
