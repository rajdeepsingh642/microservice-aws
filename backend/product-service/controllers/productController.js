const { Product } = require('../../../shared/models');
const productService = require('../services/productService');
const logger = require('../../../shared/utils/logger');

class ProductController {
  async getProducts(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        category,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        search
      } = req.query;

      const filters = {
        status: 'active'
      };

      if (category) {
        filters.category = category;
      }

      if (minPrice || maxPrice) {
        filters.price = {};
        if (minPrice) filters.price.$gte = parseFloat(minPrice);
        if (maxPrice) filters.price.$lte = parseFloat(maxPrice);
      }

      if (search) {
        filters.$text = { $search: search };
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const products = await Product.find(filters)
        .populate('sellerId', 'firstName lastName email')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Product.countDocuments(filters);

      res.json({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching products:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch products'
      });
    }
  }

  async getProductById(req, res) {
    try {
      const { id } = req.params;
      
      const product = await Product.findById(id)
        .populate('sellerId', 'firstName lastName email')
        .exec();

      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      if (product.status !== 'active' && req.user?.role !== 'admin' && product.sellerId._id.toString() !== req.user?.userId) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not available'
        });
      }

      res.json(product);
    } catch (error) {
      logger.error('Error fetching product:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch product'
      });
    }
  }

  async createProduct(req, res) {
    try {
      const productData = {
        ...req.body,
        sellerId: req.user.userId,
        sku: await productService.generateUniqueSKU(req.body.name, req.body.category)
      };

      // Calculate available inventory
      productData.inventory.available = productData.inventory.quantity;

      const product = new Product(productData);
      await product.save();

      // Index in Elasticsearch
      await productService.indexProductInElasticsearch(product);

      // Send notification to admin
      await productService.notifyNewProduct(product);

      res.status(201).json({
        message: 'Product created successfully',
        product
      });
    } catch (error) {
      logger.error('Error creating product:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Product with this SKU already exists'
        });
      }

      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to create product'
      });
    }
  }

  async updateProduct(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      // Check ownership
      if (product.sellerId.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own products'
        });
      }

      // Update inventory available quantity if quantity changed
      if (updateData.inventory?.quantity !== undefined) {
        updateData.inventory.available = updateData.inventory.quantity - product.inventory.reserved;
      }

      Object.assign(product, updateData);
      await product.save();

      // Update Elasticsearch index
      await productService.updateProductInElasticsearch(product);

      res.json({
        message: 'Product updated successfully',
        product
      });
    } catch (error) {
      logger.error('Error updating product:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update product'
      });
    }
  }

  async deleteProduct(req, res) {
    try {
      const { id } = req.params;

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      // Check ownership
      if (product.sellerId.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only delete your own products'
        });
      }

      // Check if product has active orders
      const hasActiveOrders = await productService.checkActiveOrders(id);
      if (hasActiveOrders) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Cannot delete product with active orders'
        });
      }

      await Product.findByIdAndDelete(id);

      // Remove from Elasticsearch
      await productService.removeProductFromElasticsearch(id);

      res.json({
        message: 'Product deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting product:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to delete product'
      });
    }
  }

  async updateProductStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['active', 'inactive', 'archived'].includes(status)) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Invalid status value'
        });
      }

      const product = await Product.findById(id);
      
      if (!product) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Product not found'
        });
      }

      // Check ownership
      if (product.sellerId.toString() !== req.user.userId && req.user.role !== 'admin') {
        return res.status(403).json({
          error: 'Forbidden',
          message: 'You can only update your own products'
        });
      }

      product.status = status;
      await product.save();

      // Update Elasticsearch index
      if (status === 'active') {
        await productService.indexProductInElasticsearch(product);
      } else {
        await productService.removeProductFromElasticsearch(id);
      }

      res.json({
        message: 'Product status updated successfully',
        product
      });
    } catch (error) {
      logger.error('Error updating product status:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to update product status'
      });
    }
  }

  async getFeaturedProducts(req, res) {
    try {
      const { limit = 10 } = req.query;

      const products = await Product.find({ 
        status: 'active',
        'ratings.average': { $gte: 4.0 }
      })
      .populate('sellerId', 'firstName lastName')
      .sort({ 'ratings.average': -1, 'ratings.count': -1 })
      .limit(parseInt(limit))
      .exec();

      res.json({ products });
    } catch (error) {
      logger.error('Error fetching featured products:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch featured products'
      });
    }
  }

  async getProductsByCategory(req, res) {
    try {
      const { category } = req.params;
      const { page = 1, limit = 20, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

      const filters = {
        category,
        status: 'active'
      };

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

  async searchProducts(req, res) {
    try {
      const { q, page = 1, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Search query is required'
        });
      }

      const results = await productService.searchInElasticsearch(q, {
        page: parseInt(page),
        limit: parseInt(limit)
      });

      res.json(results);
    } catch (error) {
      logger.error('Error searching products:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to search products'
      });
    }
  }

  async getAllProductsAdmin(req, res) {
    try {
      const { page = 1, limit = 50, status, sellerId } = req.query;

      const filters = {};
      if (status) filters.status = status;
      if (sellerId) filters.sellerId = sellerId;

      const products = await Product.find(filters)
        .populate('sellerId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Product.countDocuments(filters);

      res.json({
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error('Error fetching all products for admin:', error);
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Failed to fetch products'
      });
    }
  }
}

module.exports = new ProductController();
