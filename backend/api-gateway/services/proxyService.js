const axios = require('axios');
const logger = require('/app/shared/utils/logger');

class ProxyService {
  constructor() {
    this.services = {
      product: process.env.PRODUCT_SERVICE_URL || 'http://product-service:3001',
      order: process.env.ORDER_SERVICE_URL || 'http://order-service:3002',
      payment: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3003',
      review: process.env.REVIEW_SERVICE_URL || 'http://review-service:3004',
      search: process.env.SEARCH_SERVICE_URL || 'http://search-service:3005',
      notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3006'
    };
  }

  async checkServiceHealth(serviceName, serviceUrl) {
    try {
      const response = await axios.get(`${serviceUrl}/health`, {
        timeout: 5000
      });

      return {
        name: serviceName,
        url: serviceUrl,
        status: 'healthy',
        responseTime: response.headers['x-response-time'] || 'N/A',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        name: serviceName,
        url: serviceUrl,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  async checkAllServicesHealth() {
    try {
      const healthChecks = Object.entries(this.services).map(([name, url]) =>
        this.checkServiceHealth(name, url)
      );

      const results = await Promise.all(healthChecks);

      const overallStatus = results.every(result => result.status === 'healthy') ? 'healthy' : 'degraded';

      return {
        overall: {
          status: overallStatus,
          timestamp: new Date().toISOString()
        },
        services: results
      };
    } catch (error) {
      logger.error('Error checking services health:', error);
      throw error;
    }
  }

  async forwardRequest(serviceName, path, options = {}) {
    try {
      const serviceUrl = this.services[serviceName];
      if (!serviceUrl) {
        throw new Error(`Unknown service: ${serviceName}`);
      }

      const url = `${serviceUrl}${path}`;
      const response = await axios({
        url,
        method: options.method || 'GET',
        data: options.data,
        headers: {
          ...options.headers,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return response.data;
    } catch (error) {
      logger.error(`Error forwarding request to ${serviceName}:`, error);
      throw error;
    }
  }

  async getServiceMetrics(serviceName) {
    try {
      const serviceUrl = this.services[serviceName];
      if (!serviceUrl) {
        throw new Error(`Unknown service: ${serviceName}`);
      }

      const response = await axios.get(`${serviceUrl}/metrics`, {
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      logger.error(`Error getting metrics for ${serviceName}:`, error);
      return {
        error: error.message,
        service: serviceName
      };
    }
  }

  async getAllServicesMetrics() {
    try {
      const metricsPromises = Object.keys(this.services).map(serviceName =>
        this.getServiceMetrics(serviceName)
      );

      const results = await Promise.all(metricsPromises);

      return Object.fromEntries(
        Object.keys(this.services).map((serviceName, index) => [
          serviceName,
          results[index]
        ])
      );
    } catch (error) {
      logger.error('Error getting all services metrics:', error);
      throw error;
    }
  }

  // Circuit breaker pattern implementation
  createCircuitBreaker(serviceName, options = {}) {
    const {
      timeout = 30000,
      errorThreshold = 5,
      resetTimeout = 60000
    } = options;

    let state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    let failureCount = 0;
    let lastFailureTime = null;
    let successCount = 0;

    return async (path, requestOptions = {}) => {
      const now = Date.now();

      // Check if circuit should be reset
      if (state === 'OPEN' && now - lastFailureTime > resetTimeout) {
        state = 'HALF_OPEN';
        successCount = 0;
      }

      // Reject requests if circuit is open
      if (state === 'OPEN') {
        throw new Error(`Circuit breaker is OPEN for service: ${serviceName}`);
      }

      try {
        const result = await this.forwardRequest(serviceName, path, {
          ...requestOptions,
          timeout
        });

        // Reset on success
        if (state === 'HALF_OPEN') {
          successCount++;
          if (successCount >= 3) {
            state = 'CLOSED';
            failureCount = 0;
          }
        } else {
          failureCount = 0;
        }

        return result;
      } catch (error) {
        failureCount++;
        lastFailureTime = now;

        if (failureCount >= errorThreshold) {
          state = 'OPEN';
        }

        throw error;
      }
    };
  }

  // Request retry mechanism
  async retryRequest(serviceName, path, options = {}) {
    const {
      maxRetries = 3,
      retryDelay = 1000,
      backoffMultiplier = 2
    } = options;

    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await this.forwardRequest(serviceName, path, options);
      } catch (error) {
        lastError = error;

        if (attempt === maxRetries) {
          break;
        }

        const delay = retryDelay * Math.pow(backoffMultiplier, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));

        logger.warn(`Retrying request to ${serviceName} (attempt ${attempt + 1}/${maxRetries + 1})`);
      }
    }

    throw lastError;
  }

  // Request caching
  async cacheRequest(cacheKey, requestFn, ttl = 300) {
    try {
      const redis = require('/app/shared/utils/database').getRedisClient();
      
      if (!redis) {
        return await requestFn();
      }

      // Try to get from cache
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }

      // Execute request and cache result
      const result = await requestFn();
      await redis.setex(cacheKey, ttl, JSON.stringify(result));

      return result;
    } catch (error) {
      logger.error('Error in cache request:', error);
      throw error;
    }
  }

  // Load balancing (round-robin for multiple instances)
  createLoadBalancer(serviceName, instances) {
    let currentIndex = 0;

    return {
      getNextInstance: () => {
        const instance = instances[currentIndex];
        currentIndex = (currentIndex + 1) % instances.length;
        return instance;
      },
      
      forwardRequest: async (path, options = {}) => {
        const instance = this.getNextInstance();
        const url = `${instance}${path}`;
        
        return await axios({
          url,
          method: options.method || 'GET',
          data: options.data,
          headers: options.headers,
          timeout: 30000
        });
      }
    };
  }
}

module.exports = new ProxyService();
