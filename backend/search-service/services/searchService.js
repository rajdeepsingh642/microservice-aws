const { Client } = require('@elastic/elasticsearch');
const axios = require('axios');
const amqp = require('amqplib');
const logger = require('/app/shared/utils/logger');

class SearchService {
  constructor() {
    this.elasticsearchClient = null;
    this.rabbitmqConnection = null;
    this.rabbitmqChannel = null;
  }

  async initializeElasticsearch() {
    try {
      if (process.env.ELASTICSEARCH_URL) {
        this.elasticsearchClient = new Client({
          node: process.env.ELASTICSEARCH_URL
        });
        
        await this.createIndexes();
        logger.info('Elasticsearch initialized successfully');
      }

      // Initialize RabbitMQ
      if (process.env.RABBITMQ_URL) {
        this.rabbitmqConnection = await amqp.connect(process.env.RABBITMQ_URL);
        this.rabbitmqChannel = await this.rabbitmqConnection.createChannel();
        await this.setupQueues();
        await this.startConsumer();
      }
    } catch (error) {
      logger.error('Error initializing search service:', error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      // Products index
      const productsIndex = 'products';
      const productsExists = await this.elasticsearchClient.indices.exists({
        index: productsIndex
      });

      if (!productsExists) {
        await this.elasticsearchClient.indices.create({
          index: productsIndex,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                name: { 
                  type: 'text',
                  analyzer: 'standard',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: {
                      type: 'completion',
                      analyzer: 'simple'
                    }
                  }
                },
                description: { 
                  type: 'text',
                  analyzer: 'standard'
                },
                category: { type: 'keyword' },
                subcategory: { type: 'keyword' },
                brand: { type: 'keyword' },
                price: { type: 'float' },
                sellerId: { type: 'keyword' },
                sellerName: { type: 'text' },
                status: { type: 'keyword' },
                tags: { type: 'keyword' },
                attributes: {
                  type: 'object',
                  dynamic: true
                },
                'ratings.average': { type: 'float' },
                'ratings.count': { type: 'integer' },
                inventory: {
                  type: 'object',
                  properties: {
                    quantity: { type: 'integer' },
                    available: { type: 'integer' }
                  }
                },
                images: {
                  type: 'object',
                  properties: {
                    url: { type: 'keyword' },
                    alt: { type: 'text' }
                  }
                },
                createdAt: { type: 'date' },
                updatedAt: { type: 'date' }
              }
            },
            settings: {
              analysis: {
                analyzer: {
                  product_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'snowball']
                  }
                }
              }
            }
          }
        });
      }

      // Search analytics index
      const analyticsIndex = 'search_analytics';
      const analyticsExists = await this.elasticsearchClient.indices.exists({
        index: analyticsIndex
      });

      if (!analyticsExists) {
        await this.elasticsearchClient.indices.create({
          index: analyticsIndex,
          body: {
            mappings: {
              properties: {
                query: { type: 'text' },
                userId: { type: 'keyword' },
                ip: { type: 'ip' },
                resultsCount: { type: 'integer' },
                timestamp: { type: 'date' },
                userAgent: { type: 'text' }
              }
            }
          }
        });
      }

      logger.info('Elasticsearch indexes created successfully');
    } catch (error) {
      logger.error('Error creating Elasticsearch indexes:', error);
      throw error;
    }
  }

  async setupQueues() {
    try {
      await this.rabbitmqChannel.assertQueue('search_indexing', { durable: true });
      logger.info('RabbitMQ queues setup completed for search service');
    } catch (error) {
      logger.error('Error setting up RabbitMQ queues:', error);
    }
  }

  async startConsumer() {
    try {
      await this.rabbitmqChannel.consume('search_indexing', async (msg) => {
        if (msg) {
          try {
            const event = JSON.parse(msg.content.toString());
            await this.handleIndexingEvent(event);
            this.rabbitmqChannel.ack(msg);
          } catch (error) {
            logger.error('Error processing indexing event:', error);
            this.rabbitmqChannel.nack(msg, false, false);
          }
        }
      });
      logger.info('Search indexing consumer started');
    } catch (error) {
      logger.error('Error starting consumer:', error);
    }
  }

  async handleIndexingEvent(event) {
    try {
      switch (event.type) {
        case 'product_created':
        case 'product_updated':
          await this.indexProduct(event.data);
          break;
        case 'product_deleted':
          await this.removeProduct(event.data.productId);
          break;
        default:
          logger.info(`Unknown event type: ${event.type}`);
      }
    } catch (error) {
      logger.error('Error handling indexing event:', error);
    }
  }

  async indexProduct(product) {
    try {
      if (!this.elasticsearchClient) return;

      const productData = {
        id: product._id?.toString() || product.id,
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        brand: product.brand,
        price: product.price,
        sellerId: product.sellerId?.toString(),
        sellerName: product.sellerId?.firstName || 'Unknown',
        status: product.status,
        tags: product.tags || [],
        attributes: product.attributes || {},
        'ratings.average': product.ratings?.average || 0,
        'ratings.count': product.ratings?.count || 0,
        inventory: product.inventory || {},
        images: product.images || [],
        createdAt: product.createdAt,
        updatedAt: product.updatedAt
      };

      await this.elasticsearchClient.index({
        index: 'products',
        id: productData.id,
        body: productData
      });

      logger.info(`Product ${productData.id} indexed successfully`);
    } catch (error) {
      logger.error('Error indexing product:', error);
    }
  }

  async removeProduct(productId) {
    try {
      if (!this.elasticsearchClient) return;

      await this.elasticsearchClient.delete({
        index: 'products',
        id: productId.toString()
      });

      logger.info(`Product ${productId} removed from index`);
    } catch (error) {
      logger.error('Error removing product from index:', error);
    }
  }

  async searchProducts(searchQuery) {
    try {
      if (!this.elasticsearchClient) {
        throw new Error('Elasticsearch not available');
      }

      const { query, page, limit, filters, sort } = searchQuery;
      const from = (page - 1) * limit;

      const searchBody = {
        query: this.buildQuery(query, filters),
        highlight: {
          fields: {
            name: {},
            description: {}
          },
          fragment_size: 150
        },
        from,
        size: limit,
        sort: this.buildSort(sort)
      };

      // Add aggregations for filters
      if (!query || query.length < 2) {
        searchBody.aggs = {
          categories: {
            terms: { field: 'category', size: 20 }
          },
          brands: {
            terms: { field: 'brand', size: 20 }
          },
          price_ranges: {
            range: {
              field: 'price',
              ranges: [
                { key: '0-25', to: 25 },
                { key: '25-50', from: 25, to: 50 },
                { key: '50-100', from: 50, to: 100 },
                { key: '100-200', from: 100, to: 200 },
                { key: '200+', from: 200 }
              ]
            }
          },
          ratings: {
            range: {
              field: 'ratings.average',
              ranges: [
                { key: '4+', from: 4 },
                { key: '3+', from: 3 },
                { key: '2+', from: 2 },
                { key: '1+', from: 1 }
              ]
            }
          }
        };
      }

      const response = await this.elasticsearchClient.search({
        index: 'products',
        body: searchBody
      });

      const products = response.body.hits.hits.map(hit => ({
        id: hit._id,
        ...hit._source,
        highlight: hit.highlight,
        score: hit._score
      }));

      const total = response.body.hits.total.value;
      const aggregations = response.body.aggregations || {};

      return {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        aggregations,
        searchTime: response.body.took
      };
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }

  buildQuery(query, filters) {
    const must = [];
    const filter = [];

    // Add text search
    if (query && query.length >= 2) {
      must.push({
        multi_match: {
          query: query,
          fields: [
            'name^3',
            'description^2',
            'category^2',
            'brand^2',
            'tags'
          ],
          fuzziness: 'AUTO',
          operator: 'and'
        }
      });
    } else {
      must.push({ match_all: {} });
    }

    // Add filters
    filter.push({ term: { status: 'active' } });

    if (filters.category) {
      filter.push({ term: { category: filters.category } });
    }

    if (filters.subcategory) {
      filter.push({ term: { subcategory: filters.subcategory } });
    }

    if (filters.brand) {
      filter.push({ term: { brand: filters.brand } });
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceRange = {};
      if (filters.minPrice !== undefined) priceRange.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) priceRange.lte = filters.maxPrice;
      filter.push({ range: { price: priceRange } });
    }

    if (filters.rating !== undefined) {
      filter.push({ range: { 'ratings.average': { gte: filters.rating } } });
    }

    if (filters.inStock) {
      filter.push({ range: { 'inventory.available': { gt: 0 } } });
    }

    return {
      bool: {
        must,
        filter
      }
    };
  }

  buildSort(sort) {
    const { field, order } = sort;
    
    switch (field) {
      case 'relevance':
        return ['_score'];
      case 'price':
        return [{ price: { order: order === 'desc' ? 'desc' : 'asc' } }];
      case 'rating':
        return [{ 'ratings.average': { order: 'desc' } }, { 'ratings.count': { order: 'desc' } }];
      case 'newest':
        return [{ createdAt: { order: 'desc' } }];
      case 'name':
        return [{ name: { order: order === 'desc' ? 'desc' : 'asc' } }];
      default:
        return ['_score'];
    }
  }

  async getSearchSuggestions(query, limit) {
    try {
      if (!this.elasticsearchClient) {
        return [];
      }

      const response = await this.elasticsearchClient.search({
        index: 'products',
        body: {
          suggest: {
            product_suggest: {
              prefix: query,
              completion: {
                field: 'name.suggest',
                size: limit,
                skip_duplicates: true
              }
            }
          }
        }
      });

      const suggestions = response.body.suggest.product_suggest[0].options.map(option => ({
        text: option.text,
        source: option._source
      }));

      return suggestions;
    } catch (error) {
      logger.error('Error getting search suggestions:', error);
      return [];
    }
  }

  async getTrendingSearches(limit) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (redis) {
        const trending = await redis.zrevrange('trending_searches', 0, limit - 1, 'WITHSCORES');
        return trending.map(([query, score]) => ({
          query,
          count: parseInt(score)
        }));
      }

      return [];
    } catch (error) {
      logger.error('Error getting trending searches:', error);
      return [];
    }
  }

  async getCategories() {
    try {
      if (!this.elasticsearchClient) {
        return [];
      }

      const response = await this.elasticsearchClient.search({
        index: 'products',
        body: {
          size: 0,
          aggs: {
            categories: {
              terms: {
                field: 'category',
                size: 50
              }
            }
          }
        }
      });

      const categories = response.body.aggregations.categories.buckets.map(bucket => ({
        name: bucket.key,
        count: bucket.doc_count
      }));

      return categories;
    } catch (error) {
      logger.error('Error getting categories:', error);
      return [];
    }
  }

  async getFilterOptions(category) {
    try {
      if (!this.elasticsearchClient) {
        return {};
      }

      const query = category ? { term: { category } } : { match_all: {} };

      const response = await this.elasticsearchClient.search({
        index: 'products',
        body: {
          size: 0,
          query,
          aggs: {
            brands: {
              terms: { field: 'brand', size: 20 }
            },
            subcategories: {
              terms: { field: 'subcategory', size: 20 }
            },
            price_ranges: {
              range: {
                field: 'price',
                ranges: [
                  { key: '0-25', to: 25 },
                  { key: '25-50', from: 25, to: 50 },
                  { key: '50-100', from: 50, to: 100 },
                  { key: '100-200', from: 100, to: 200 },
                  { key: '200+', from: 200 }
                ]
              }
            }
          }
        }
      });

      const aggregations = response.body.aggregations;

      return {
        brands: aggregations.brands.buckets.map(bucket => ({
          name: bucket.key,
          count: bucket.doc_count
        })),
        subcategories: aggregations.subcategories.buckets.map(bucket => ({
          name: bucket.key,
          count: bucket.doc_count
        })),
        priceRanges: aggregations.price_ranges.buckets.map(bucket => ({
          key: bucket.key,
          count: bucket.doc_count,
          from: bucket.from,
          to: bucket.to
        }))
      };
    } catch (error) {
      logger.error('Error getting filter options:', error);
      return {};
    }
  }

  async advancedSearch(searchQuery) {
    // Similar to searchProducts but with more complex query building
    return this.searchProducts(searchQuery);
  }

  async logSearch(ip, query, resultsCount, userId) {
    try {
      if (!this.elasticsearchClient || !query) return;

      await this.elasticsearchClient.index({
        index: 'search_analytics',
        body: {
          query,
          userId,
          ip,
          resultsCount,
          timestamp: new Date().toISOString(),
          userAgent: 'web' // Could be extracted from headers
        }
      });

      // Update trending searches in Redis
      const redis = require('/app/shared/utils/database').getRedisClient();
      if (redis && query) {
        await redis.zincrby('trending_searches', 1, query.toLowerCase());
        // Keep only top 100 trending searches
        await redis.zremrangebyrank('trending_searches', 0, -101);
      }
    } catch (error) {
      logger.error('Error logging search:', error);
    }
  }

  async reindexAllProducts() {
    try {
      const productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001';
      
      const response = await axios.get(`${productServiceUrl}/api/products`, {
        params: { limit: 1000 } // Get all products
      });

      const products = response.data.products;
      
      for (const product of products) {
        await this.indexProduct(product);
      }

      logger.info(`Reindexed ${products.length} products`);
    } catch (error) {
      logger.error('Error reindexing all products:', error);
      throw error;
    }
  }
}

module.exports = new SearchService();
