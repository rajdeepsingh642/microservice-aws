const { Product } = require('/app/shared/models');
const logger = require('/app/shared/utils/logger');

class CategoryController {
  async getCategories(req, res) {
    try {
      const categories = await Product.distinct('category', { status: 'active' });
      
      const categoryStats = await Promise.all(
        categories.map(async (category) => {
          const count = await Product.countDocuments({ 
            category, 
            status: 'active' 
          });
          const avgPrice = await Product.aggregate([
            { $match: { category, status: 'active' } },
            { $group: { _id: null, avgPrice: { $avg: '$price' } } }
          ]);
          
          return {
            name: category,
            productCount: count,
            averagePrice: avgPrice[0]?.avgPrice || 0
          };
        })
      );

      res.json({
        categories: categoryStats.sort((a, b) => b.productCount - a.productCount)
      });
    } catch (error) {
      logger.error('Error fetching categories:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch categories'
      });
    }
  }

  async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 20, minPrice, maxPrice, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const filters = {
        category,
        status: 'active'
      };

      if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price.$gte = parseFloat(minPrice);
        if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const products = await Product.find(filters)
        .populate('sellerId', 'firstName lastName')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Product.countDocuments(filters);

      res.json({
        category,
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching products by category:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch products by category'
      });
    }
  }

  async createCategory(req, res) {
    try {
      // This is a simple implementation
      // In a real system, you'd have a separate categories collection
      res.status(201).json({
        message: 'Category management would be implemented with a separate categories collection',
        category: req.body
      });
    } catch (error) {
      logger.error('Error creating category:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create category'
      });
    }
  }

  async updateCategory(req, res) {
    try {
      res.json({
        message: 'Category update would be implemented with a separate categories collection',
        category: req.body
      });
    } catch (error) {
      logger.error('Error updating category:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update category'
      });
    }
  }

  async deleteCategory(req, res) {
    try {
      res.json({
        message: 'Category deletion would be implemented with a separate categories collection'
      });
    } catch (error) {
      logger.error('Error deleting category:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete category'
      });
    }
  }
}

module.exports = new CategoryController();
