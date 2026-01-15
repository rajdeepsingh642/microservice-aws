const { Product } = require('/app/shared/models');
const productService = require('../services/productService');
const logger = require('/app/shared/utils/logger');

class InventoryController {
  async getMyInventory(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const sellerId = req.user.userId;

      const filters = { sellerId };
      if (status) filters.status = status;

      const products = await Product.find(filters)
        .select('name sku category price inventory status createdAt updatedAt')
        .sort({ updatedAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Product.countDocuments(filters);

      // Calculate inventory statistics
      const stats = await productService.getProductStats(sellerId);

      res.json({
        products,
        stats,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching seller inventory:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch inventory'
      });
    }
  }

  async reserveInventory(req, res) {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Valid quantity is required'
        });
      }

      // Verify product ownership
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      if (product.sellerId.toString() !== req.user.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only manage your own products'
        });
      }

      const updatedInventory = await productService.updateInventory(
        productId, 
        quantity, 
        'reserve'
      );

      res.json({
        message: 'Inventory reserved successfully',
        inventory: updatedInventory
      });
    } catch (error) {
      logger.error('Error reserving inventory:', error);
      
      if (error.message === 'Insufficient inventory') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Insufficient inventory available'
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to reserve inventory'
      });
    }
  }

  async releaseInventory(req, res) {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;

      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Valid quantity is required'
        });
      }

      // Verify product ownership
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      if (product.sellerId.toString() !== req.user.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only manage your own products'
        });
      }

      const updatedInventory = await productService.updateInventory(
        productId, 
        quantity, 
        'release'
      );

      res.json({
        message: 'Inventory released successfully',
        inventory: updatedInventory
      });
    } catch (error) {
      logger.error('Error releasing inventory:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to release inventory'
      });
    }
  }

  async updateInventory(req, res) {
    try {
      const { productId } = req.params;
      const { quantity } = req.body;

      if (quantity < 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Quantity cannot be negative'
        });
      }

      // Verify product ownership
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      if (product.sellerId.toString() !== req.user.userId) {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only manage your own products'
        });
      }

      // Update inventory directly
      product.inventory.quantity = quantity;
      product.inventory.available = quantity - product.inventory.reserved;
      
      if (product.inventory.available < 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Available inventory cannot be negative'
        });
      }

      await product.save();

      res.json({
        message: 'Inventory updated successfully',
        inventory: product.inventory
      });
    } catch (error) {
      logger.error('Error updating inventory:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update inventory'
      });
    }
  }

  async getAllInventory(req, res) {
    try {
      const { page = 1, limit = 50, sellerId, category, lowStock } = req.query;

      const filters = {};
      if (sellerId) filters.sellerId = sellerId;
      if (category) filters.category = category;
      if (lowStock === 'true') {
        filters.$expr = { $lte: ['$inventory.available', 10] };
      }

      const products = await Product.find(filters)
        .populate('sellerId', 'firstName lastName email')
        .select('name sku category price inventory sellerId status')
        .sort({ 'inventory.available': 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Product.countDocuments(filters);

      // Calculate overall inventory statistics
      const stats = await Product.aggregate([
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            totalInventory: { $sum: '$inventory.quantity' },
            totalAvailable: { $sum: '$inventory.available' },
            totalReserved: { $sum: '$inventory.reserved' },
            lowStockCount: {
              $sum: { $cond: [{ $lte: ['$inventory.available', 10] }, 1, 0] }
            }
          }
        }
      ]);

      res.json({
        products,
        stats: stats[0] || {},
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching all inventory:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch inventory'
      });
    }
  }

  async getLowStockProducts(req, res) {
    try {
      const { page = 1, limit = 50, threshold = 10 } = req.query;

      const products = await Product.find({
        'inventory.available': { $lte: parseInt(threshold) },
        status: 'active'
      })
        .populate('sellerId', 'firstName lastName email')
        .select('name sku category price inventory sellerId')
        .sort({ 'inventory.available': 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Product.countDocuments({
        'inventory.available': { $lte: parseInt(threshold) },
        status: 'active'
      });

      res.json({
        products,
        threshold: parseInt(threshold),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching low stock products:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch low stock products'
      });
    }
  }
}

module.exports = new InventoryController();
