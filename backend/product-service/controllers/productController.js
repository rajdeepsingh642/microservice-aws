const { Product } = require('/app/shared/models');
const productService = require('../services/productService');
const logger = require('/app/shared/utils/logger');

class ProductController {
  constructor() {
    this.getProducts = this.getProducts.bind(this);
    this.getFeaturedProducts = this.getFeaturedProducts.bind(this);
    this.getProductsByCategory = this.getProductsByCategory.bind(this);
    this.searchProducts = this.searchProducts.bind(this);
    this.getProductById = this.getProductById.bind(this);
    this.createProduct = this.createProduct.bind(this);
    this.updateProduct = this.updateProduct.bind(this);
    this.deleteProduct = this.deleteProduct.bind(this);
    this.updateProductStatus = this.updateProductStatus.bind(this);
    this.getAllProductsAdmin = this.getAllProductsAdmin.bind(this);
  }

  getMockProducts() {
    return [
      {
        _id: 'mock1',
        name: 'Wireless Bluetooth Headphones',
        description: 'Premium noise-cancelling wireless headphones with 30-hour battery life',
        price: 199.99,
        category: 'Electronics',
        stock: 100,
        sku: 'MOCK-HEADPHONES',
        images: [{ url: 'https://picsum.photos/seed/headphones/300/200.jpg' }],
        sellerId: { firstName: 'Electronics', lastName: 'Seller', email: 'electronics@sellers.com' },
        status: 'active',
        ratings: { average: 4.5, count: 128 },
        createdAt: new Date()
      },
      {
        _id: 'mock2',
        name: 'Smart Watch Pro',
        description: 'Advanced fitness tracking smartwatch with heart rate monitor',
        price: 299.99,
        category: 'Electronics',
        stock: 75,
        sku: 'MOCK-SMARTWATCH',
        images: [{ url: 'https://picsum.photos/seed/smartwatch/300/200.jpg' }],
        sellerId: { firstName: 'Electronics', lastName: 'Seller', email: 'electronics@sellers.com' },
        status: 'active',
        ratings: { average: 4.2, count: 89 },
        createdAt: new Date()
      },
      {
        _id: 'mock3',
        name: 'Organic Cotton T-Shirt',
        description: 'Comfortable and sustainable organic cotton t-shirt',
        price: 29.99,
        category: 'Clothing',
        stock: 200,
        sku: 'MOCK-TSHIRT',
        images: [{ url: 'https://picsum.photos/seed/tshirt/300/200.jpg' }],
        sellerId: { firstName: 'Mike', lastName: 'Johnson', email: 'mike@example.com' },
        status: 'active',
        ratings: { average: 4.0, count: 45 },
        createdAt: new Date()
      },
      {
        _id: 'mock4',
        name: 'Yoga Mat Premium',
        description: 'Non-slip eco-friendly yoga mat with carrying strap',
        price: 49.99,
        category: 'Sports',
        stock: 150,
        sku: 'MOCK-YOGAMAT',
        images: [{ url: 'https://picsum.photos/seed/yogamat/300/200.jpg' }],
        sellerId: { firstName: 'Sports', lastName: 'Seller', email: 'sports@sellers.com' },
        status: 'active',
        ratings: { average: 4.7, count: 203 },
        createdAt: new Date()
      },
      {
        _id: 'mock5',
        name: 'Coffee Maker Deluxe',
        description: 'Programmable coffee maker with thermal carafe',
        price: 89.99,
        category: 'Home',
        stock: 60,
        sku: 'MOCK-COFFEEMAKER',
        images: [{ url: 'https://picsum.photos/seed/coffee/300/200.jpg' }],
        sellerId: { firstName: 'Crockery', lastName: 'Seller', email: 'crockery@sellers.com' },
        status: 'active',
        ratings: { average: 4.3, count: 156 },
        createdAt: new Date()
      },
      {
        _id: 'mock6',
        name: 'Running Shoes',
        description: 'Lightweight breathable running shoes for all terrains',
        price: 129.99,
        oldPrice: 159.99,
        category: 'Sports',
        stock: 80,
        sku: 'MOCK-SHOES',
        images: [{ url: 'https://picsum.photos/seed/shoes/300/200.jpg' }],
        sellerId: { firstName: 'Sports', lastName: 'Seller', email: 'sports@sellers.com' },
        status: 'active',
        ratings: { average: 4.6, count: 92 },
        createdAt: new Date()
      },
      {
        _id: 'mock7',
        name: 'Laptop Backpack',
        description: 'Water-resistant backpack with laptop compartment and USB charging',
        price: 59.99,
        category: 'Accessories',
        stock: 120,
        sku: 'MOCK-BACKPACK',
        images: [{ url: 'https://picsum.photos/seed/backpack/300/200.jpg' }],
        sellerId: { firstName: 'Accessories', lastName: 'Seller', email: 'accessories@sellers.com' },
        status: 'active',
        ratings: { average: 4.4, count: 67 },
        createdAt: new Date()
      },
      {
        _id: 'mock8',
        name: 'Wireless Mouse',
        description: 'Ergonomic wireless mouse with precision tracking',
        price: 34.99,
        category: 'Electronics',
        stock: 180,
        sku: 'MOCK-MOUSE',
        images: [{ url: 'https://picsum.photos/seed/mouse/300/200.jpg' }],
        sellerId: { firstName: 'Electronics', lastName: 'Seller', email: 'electronics@sellers.com' },
        status: 'active',
        ratings: { average: 4.1, count: 134 },
        createdAt: new Date()
      }
    ];
  }

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

      // If no products in database, return mock data for demonstration
      if (products.length === 0 && total === 0) {
        const mockProducts = [
          {
            _id: 'mock1',
            name: "Wireless Bluetooth Headphones",
            description: "Premium noise-cancelling wireless headphones with 30-hour battery life",
            price: 199.99,
            category: "Electronics",
            stock: 100,
            images: [{ url: "https://picsum.photos/seed/headphones/300/200.jpg" }],
            sellerId: { firstName: "Electronics", lastName: "Seller", email: "electronics@sellers.com" },
            status: "active",
            ratings: { average: 4.5, count: 128 },
            createdAt: new Date()
          },
          {
            _id: 'mock2',
            name: "Smart Watch Pro",
            description: "Advanced fitness tracking smartwatch with heart rate monitor",
            price: 299.99,
            category: "Electronics",
            stock: 75,
            images: [{ url: "https://picsum.photos/seed/smartwatch/300/200.jpg" }],
            sellerId: { firstName: "Electronics", lastName: "Seller", email: "electronics@sellers.com" },
            status: "active",
            ratings: { average: 4.2, count: 89 },
            createdAt: new Date()
          },
          {
            _id: 'mock3',
            name: "Organic Cotton T-Shirt",
            description: "Comfortable and sustainable organic cotton t-shirt",
            price: 29.99,
            category: "Clothing",
            stock: 200,
            images: [{ url: "https://picsum.photos/seed/tshirt/300/200.jpg" }],
            sellerId: { firstName: "Mike", lastName: "Johnson", email: "mike@example.com" },
            status: "active",
            ratings: { average: 4.0, count: 45 },
            createdAt: new Date()
          },
          {
            _id: 'mock4',
            name: "Yoga Mat Premium",
            description: "Non-slip eco-friendly yoga mat with carrying strap",
            price: 49.99,
            category: "Sports",
            stock: 150,
            images: [{ url: "https://picsum.photos/seed/yogamat/300/200.jpg" }],
            sellerId: { firstName: "Sports", lastName: "Seller", email: "sports@sellers.com" },
            status: "active",
            ratings: { average: 4.7, count: 203 },
            createdAt: new Date()
          },
          {
            _id: 'mock5',
            name: "Coffee Maker Deluxe",
            description: "Programmable coffee maker with thermal carafe",
            price: 89.99,
            category: "Home",
            stock: 60,
            images: [{ url: "https://picsum.photos/seed/coffee/300/200.jpg" }],
            sellerId: { firstName: "Crockery", lastName: "Seller", email: "crockery@sellers.com" },
            status: "active",
            ratings: { average: 4.3, count: 156 },
            createdAt: new Date()
          },
          {
            _id: 'mock6',
            name: "Running Shoes",
            description: "Lightweight breathable running shoes for all terrains",
            price: 129.99,
            oldPrice: 159.99,
            category: "Sports",
            stock: 80,
            images: [{ url: "https://picsum.photos/seed/shoes/300/200.jpg" }],
            sellerId: { firstName: "Sports", lastName: "Seller", email: "sports@sellers.com" },
            status: "active",
            ratings: { average: 4.6, count: 92 },
            createdAt: new Date()
          },
          {
            _id: 'mock7',
            name: "Laptop Backpack",
            description: "Water-resistant backpack with laptop compartment and USB charging",
            price: 59.99,
            category: "Accessories",
            stock: 120,
            images: [{ url: "https://picsum.photos/seed/backpack/300/200.jpg" }],
            sellerId: { firstName: "Accessories", lastName: "Seller", email: "accessories@sellers.com" },
            status: "active",
            ratings: { average: 4.4, count: 67 },
            createdAt: new Date()
          },
          {
            _id: 'mock8',
            name: "Wireless Mouse",
            description: "Ergonomic wireless mouse with precision tracking",
            price: 34.99,
            category: "Electronics",
            stock: 180,
            images: [{ url: "https://picsum.photos/seed/mouse/300/200.jpg" }],
            sellerId: { firstName: "Emma", lastName: "Wilson", email: "emma@example.com" },
            status: "active",
            ratings: { average: 4.1, count: 134 },
            createdAt: new Date()
          }
        ];

        return res.json({
          products: mockProducts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: mockProducts.length,
            pages: Math.ceil(mockProducts.length / limit)
          }
        });
      }

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

      if (id && id.startsWith('mock')) {
        const mockProduct = this.getMockProducts().find((p) => p._id === id);
        if (!mockProduct) {
          return res.status(404).json({
            error: 'Not Found',
            message: 'Product not found'
          });
        }

        return res.json({
          ...mockProduct,
          inventory: {
            available: mockProduct.stock,
            quantity: mockProduct.stock
          }
        });
      }
      
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
