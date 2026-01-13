const { v4: uuidv4 } = require('uuid');
const { Review, Product } = require('../../../shared/models');
const reviewService = require('../services/reviewService');
const logger = require('../../../shared/utils/logger');

class ReviewController {
  async getProductReviews(req, res) {
    try {
      const { productId } = req.params;
      const { page = 1, limit = 20, rating, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const filters = {
        productId,
        status: 'approved'
      };

      if (rating) {
        filters.rating = parseInt(rating);
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const reviews = await Review.find(filters)
        .populate('userId', 'firstName lastName')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Review.countDocuments(filters);

      // Calculate rating distribution
      const ratingDistribution = await Review.aggregate([
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
        reviews,
        ratingDistribution,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching product reviews:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch reviews'
      });
    }
  }

  async getFeaturedReviews(req, res) {
    try {
      const { limit = 10 } = req.query;

      const reviews = await Review.find({ status: 'approved' })
        .populate('userId', 'firstName lastName')
        .populate('productId', 'name images')
        .sort({ helpful: -1, rating: -1, createdAt: -1 })
        .limit(parseInt(limit))
        .exec();

      res.json({ reviews });
    } catch (error) {
      logger.error('Error fetching featured reviews:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch featured reviews'
      });
    }
  }

  async getMyReviews(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const userId = req.user.userId;

      const filters = { userId };
      if (status) {
        filters.status = status;
      }

      const reviews = await Review.find(filters)
        .populate('productId', 'name images')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Review.countDocuments(filters);

      res.json({
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching user reviews:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch reviews'
      });
    }
  }

  async createReview(req, res) {
    try {
      const { productId, orderId, rating, title, comment, images } = req.body;
      const userId = req.user.userId;

      // Check if user has already reviewed this product
      const existingReview = await Review.findOne({
        productId,
        userId,
        orderId
      });

      if (existingReview) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'You have already reviewed this product for this order'
        });
      }

      // Verify the order exists and belongs to the user
      const orderValid = await reviewService.verifyOrderOwnership(orderId, userId, productId);
      if (!orderValid) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Invalid order or product'
        });
      }

      // Create review
      const review = new Review({
        _id: uuidv4(),
        productId,
        userId,
        orderId,
        rating,
        title,
        comment,
        images: images || [],
        verified: true,
        status: 'pending'
      });

      await review.save();

      // Update product rating
      await reviewService.updateProductRating(productId);

      // Send notification to seller
      await reviewService.sendNewReviewNotification(review);

      res.status(201).json({
        message: 'Review submitted successfully',
        review
      });
    } catch (error) {
      logger.error('Error creating review:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create review'
      });
    }
  }

  async updateReview(req, res) {
    try {
      const { id } = req.params;
      const { rating, title, comment, images } = req.body;
      const userId = req.user.userId;

      const review = await Review.findById(id);
      
      if (!review) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Review not found'
        });
      }

      // Check ownership
      if (review.userId.toString() !== userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own reviews'
        });
      }

      // Update review
      if (rating) review.rating = rating;
      if (title) review.title = title;
      if (comment) review.comment = comment;
      if (images) review.images = images;
      
      review.updatedAt = new Date();
      await review.save();

      // Update product rating
      await reviewService.updateProductRating(review.productId);

      res.json({
        message: 'Review updated successfully',
        review
      });
    } catch (error) {
      logger.error('Error updating review:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update review'
      });
    }
  }

  async deleteReview(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const review = await Review.findById(id);
      
      if (!review) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Review not found'
        });
      }

      // Check ownership or admin
      if (review.userId.toString() !== userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own reviews'
        });
      }

      const productId = review.productId;
      await Review.findByIdAndDelete(id);

      // Update product rating
      await reviewService.updateProductRating(productId);

      res.json({
        message: 'Review deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting review:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete review'
      });
    }
  }

  async markReviewHelpful(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const review = await Review.findById(id);
      
      if (!review) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Review not found'
        });
      }

      // Check if user has already voted
      const voteKey = `review_vote_${id}_${userId}`;
      const redis = require('../../../shared/utils/database').getRedisClient();
      
      if (redis) {
        const existingVote = await redis.get(voteKey);
        if (existingVote) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'You have already voted on this review'
          });
        }

        // Mark vote
        await redis.setex(voteKey, 86400, 'helpful'); // 24 hours
      }

      review.helpful.yes += 1;
      await review.save();

      res.json({
        message: 'Review marked as helpful',
        helpful: review.helpful
      });
    } catch (error) {
      logger.error('Error marking review helpful:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to mark review as helpful'
      });
    }
  }

  async markReviewNotHelpful(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.userId;

      const review = await Review.findById(id);
      
      if (!review) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Review not found'
        });
      }

      // Check if user has already voted
      const voteKey = `review_vote_${id}_${userId}`;
      const redis = require('../../../shared/utils/database').getRedisClient();
      
      if (redis) {
        const existingVote = await redis.get(voteKey);
        if (existingVote) {
          return res.status(400).json({
            error: 'Bad Request',
            message: 'You have already voted on this review'
          });
        }

        // Mark vote
        await redis.setex(voteKey, 86400, 'not-helpful'); // 24 hours
      }

      review.helpful.no += 1;
      await review.save();

      res.json({
        message: 'Review marked as not helpful',
        helpful: review.helpful
      });
    } catch (error) {
      logger.error('Error marking review not helpful:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to mark review as not helpful'
      });
    }
  }

  async getAllReviewsAdmin(req, res) {
    try {
      const { page = 1, limit = 50, status, userId, productId, rating } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (userId) filters.userId = userId;
      if (productId) filters.productId = productId;
      if (rating) filters.rating = parseInt(rating);

      const reviews = await Review.find(filters)
        .populate('userId', 'firstName lastName email')
        .populate('productId', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Review.countDocuments(filters);

      res.json({
        reviews,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching all reviews for admin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch reviews'
      });
    }
  }

  async getReviewByIdAdmin(req, res) {
    try {
      const { id } = req.params;

      const review = await Review.findById(id)
        .populate('userId', 'firstName lastName email')
        .populate('productId', 'name')
        .populate('orderId', 'orderNumber')
        .exec();

      if (!review) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Review not found'
        });
      }

      res.json(review);
    } catch (error) {
      logger.error('Error fetching review for admin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch review'
      });
    }
  }

  async approveReview(req, res) {
    try {
      const { id } = req.params;

      const review = await Review.findById(id);
      
      if (!review) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Review not found'
        });
      }

      review.status = 'approved';
      review.updatedAt = new Date();
      await review.save();

      // Update product rating
      await reviewService.updateProductRating(review.productId);

      // Send approval notification
      await reviewService.sendReviewApprovalNotification(review, true);

      res.json({
        message: 'Review approved successfully',
        review
      });
    } catch (error) {
      logger.error('Error approving review:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to approve review'
      });
    }
  }

  async rejectReview(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      const review = await Review.findById(id);
      
      if (!review) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Review not found'
        });
      }

      review.status = 'rejected';
      review.updatedAt = new Date();
      await review.save();

      // Update product rating
      await reviewService.updateProductRating(review.productId);

      // Send rejection notification
      await reviewService.sendReviewApprovalNotification(review, false, reason);

      res.json({
        message: 'Review rejected successfully',
        review
      });
    } catch (error) {
      logger.error('Error rejecting review:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reject review'
      });
    }
  }
}

module.exports = new ReviewController();
