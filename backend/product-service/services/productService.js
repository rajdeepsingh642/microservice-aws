const { Client } = require('@elastic/elasticsearch');
const amqp = require('amqplib');
const logger = require('../../../shared/utils/logger');
const { Product } = require('../../../shared/models');

class ProductService {
  constructor() {
    this.elasticsearchClient = null;
    this.rabbitmqConnection = null;
    this.rabbitmqChannel = null;
    this.initializeConnections();
  }

  async initializeConnections() {
    try {
      // Initialize Elasticsearch
      if (process.env.ELASTICSEARCH_URL) {
        this.elasticsearchClient = new Client({
          node: process.env.ELASTICSEARCH_URL
        });
        await this.createElasticsearchIndex();
      }

      // Initialize RabbitMQ
      if (process.env.RABBITMQ_URL) {
        this.rabbitmqConnection = await amqp.connect(process.env.RABBITMQ_URL);
        this.rabbitmqChannel = await this.rabbitmqConnection.createChannel();
        await this.setupQueues();
      }
    } catch (error) {
      logger.error('Error initializing service connections:', error);
    }
  }

  async createElasticsearchIndex() {
    try {
      const indexName = 'products';
      
      const indexExists = await this.elasticsearchClient.indices.exists({
        index: indexName
      });

      if (!indexExists) {
        await this.elasticsearchClient.indices.create({
          index: indexName,
          body: {
            mappings: {
              properties: {
                name: { type: 'text', analyzer: 'standard' },
                description: { type: 'text', analyzer: 'standard' },
                category: { type: 'keyword' },
                subcategory: { type: 'keyword' },
                brand: { type: 'keyword' },
                price: { type: 'float' },
                sellerId: { type: 'keyword' },
                status: { type: 'keyword' },
                tags: { type: 'keyword' },
                'ratings.average': { type: 'float' },
                'ratings.count': { type: 'integer' },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' }
              }
            }
          }
        });
        logger.info('Elasticsearch index created successfully');
      }
    } catch (error) {
      logger.error('Error creating Elasticsearch index:', error);
    }
  }

  async setupQueues() {
    try {
      await this.rabbitmqChannel.assertQueue('product_events', { durable: true });
      await this.rabbitmqChannel.assertQueue('inventory_updates', { durable: true });
      await this.rabbitmqChannel.assertQueue('search_indexing', { durable: true });
      logger.info('RabbitMQ queues setup completed');
    } catch (error) {
      logger.error('Error setting up RabbitMQ queues:', error);
    }
  }

  async generateUniqueSKU(name, category) {
    const prefix = category ? category.substring(0, 3).toUpperCase() : 'PRD';
    const namePart = name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6).toUpperCase();
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    let sku = `${prefix}-${namePart}-${timestamp}-${random}`;
    
    // Ensure uniqueness
    let attempts = 0;
    while (await Product.findOne({ sku }) && attempts < 10) {
      sku = `${prefix}-${namePart}-${timestamp}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      attempts++;
    }
    
    return sku;
  }

  async indexProductInElasticsearch(product) {
    try {
      if (!this.elasticsearchClient) return;

      const productData = {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        price: product.price,
        sellerId: product.sellerId.toString(),
        status: product.status,
        tags: product.tags,
        'ratings.average': product.ratings.average,
        'ratings.count': product.ratings.count,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };

      await this.elasticsearchClient.index({
        index: 'products',
        id: product._id.toString(),
        body: productData
      });

      logger.info(`Product ${product._id} indexed in Elasticsearch`);
    } catch (error) {
      logger.error('Error indexing product in Elasticsearch:', error);
    }
  }

  async updateProductInElasticsearch(product) {
    try {
      if (!this.elasticsearchClient) return;

      const productData = {
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        price: product.price,
        status: product.status,
        tags: product.tags,
        'ratings.average': product.ratings.average,
        'ratings.count': product.ratings.count,
        updatedAt: product.updatedAt
      };

      await this.elasticsearchClient.update({
        index: 'products',
        id: product._id.toString(),
        body: { doc: productData }
      });

      logger.info(`Product ${product._id} updated in Elasticsearch`);
    } catch (error) {
      logger.error('Error updating product in Elasticsearch:', error);
    }
  }

  async removeProductFromElasticsearch(productId) {
    try {
      if (!this.elasticsearchClient) return;

      await this.elasticsearchClient.delete({
        index: 'products',
        id: productId.toString()
      });

      logger.info(`Product ${productId} removed from Elasticsearch`);
    } catch (error) {
      logger.error('Error removing product from Elasticsearch:', error);
    }
  }

  async searchInElasticsearch(query, options = {}) {
    try {
      if (!this.elasticsearchClient) {
        // Fallback to MongoDB search
        return this.searchInMongoDB(query, options);
      }

      const { page = 1, limit = 20 } = options;
      const from = (page - 1) * limit;

      const searchBody = {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: query,
                  fields: ['name^3', 'description^2', 'category', 'brand', 'tags'],
                  fuzziness: 'AUTO'
                }
              }
            ],
            filter: [
              { term: { status: 'active' } }
            ]
          }
        },
        highlight: {
          fields: {
            name: {},
            description: {}
          }
        },
        from,
        size: limit
      };

      const response = await this.elasticsearchClient.search({
        index: 'products',
        body: searchBody
      });

      const products = response.body.hits.hits.map(hit => ({
        _id: hit._id,
        ...hit._source,
        highlight: hit.highlight
      }));

      const total = response.body.hits.total.value;

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching in Elasticsearch:', error);
      // Fallback to MongoDB search
      return this.searchInMongoDB(query, options);
    }
  }

  async searchInMongoDB(query, options = {}) {
    try {
      const { page = 1, limit = 20 } = options;

      const searchRegex = new RegExp(query, 'i');
      const filters = {
        $or: [
          { name: searchRegex },
          { description: searchRegex },
          { category: searchRegex },
          { brand: searchRegex },
          { tags: { $in: [searchRegex] } }
        ],
        status: 'active'
      };

      const products = await Product.find(filters)
        .populate('sellerId', 'firstName lastName')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Product.countDocuments(filters);

      return {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error searching in MongoDB:', error);
      throw error;
    }
  }

  async notifyNewProduct(product) {
    try {
      if (!this.rabbitmqChannel) return;

      const message = {
        type: 'product_created',
        productId: product._id.toString(),
        sellerId: product.sellerId.toString(),
        productName: product.name,
        category: product.category,
        timestamp: new Date().toISOString()
      };

      await this.rabbitmqChannel.sendToQueue(
        'product_events',
        Buffer.from(JSON.stringify(message)),
        { persistent: true }
      );

      logger.info(`New product notification sent: ${product._id}`);
    } catch (error) {
      logger.error('Error sending new product notification:', error);
    }
  }

  async updateInventory(productId, quantityChange, operation = 'reserve') {
    try {
      const product = await Product.findById(productId);
      if (!product) {
        throw new Error('Product not found');
      }

      if (operation === 'reserve') {
        if (product.inventory.available < quantityChange) {
          throw new Error('Insufficient inventory');
        }
        product.inventory.reserved += quantityChange;
        product.inventory.available -= quantityChange;
      } else if (operation === 'release') {
        product.inventory.reserved -= quantityChange;
        product.inventory.available += quantityChange;
      } else if (operation === 'consume') {
        product.inventory.reserved -= quantityChange;
        product.inventory.quantity -= quantityChange;
        product.inventory.available = product.inventory.quantity - product.inventory.reserved;
      }

      await product.save();

      // Send inventory update notification
      if (this.rabbitmqChannel) {
        const message = {
          type: 'inventory_updated',
          productId: productId.toString(),
          quantity: product.inventory.quantity,
          available: product.inventory.available,
          reserved: product.inventory.reserved,
          operation,
          timestamp: new Date().toISOString()
        };

        await this.rabbitmqChannel.sendToQueue(
          'inventory_updates',
          Buffer.from(JSON.stringify(message)),
          { persistent: true }
        );
      }

      return product.inventory;
    } catch (error) {
      logger.error('Error updating inventory:', error);
      throw error;
    }
  }

  async checkActiveOrders(productId) {
    try {
      // This would typically check the order service
      // For now, we'll return false to allow deletion
      // In a real implementation, you'd make an API call to the order service
      return false;
    } catch (error) {
      logger.error('Error checking active orders:', error);
      return false;
    }
  }

  async getProductStats(sellerId) {
    try {
      const stats = await Product.aggregate([
        { $match: { sellerId: sellerId } },
        {
          $group: {
            _id: null,
            totalProducts: { $sum: 1 },
            activeProducts: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            totalInventory: { $sum: '$inventory.quantity' },
            totalReserved: { $sum: '$inventory.reserved' },
            averageRating: { $avg: '$ratings.average' },
            totalReviews: { $sum: '$ratings.count' }
          }
        }
      ]);

      return stats[0] || {
        totalProducts: 0,
        activeProducts: 0,
        totalInventory: 0,
        totalReserved: 0,
        averageRating: 0,
        totalReviews: 0
      };
    } catch (error) {
      logger.error('Error getting product stats:', error);
      throw error;
    }
  }
}

module.exports = new ProductService();
