import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if ([401, 403].includes(error.response?.status) && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data.tokens;
          localStorage.setItem('token', accessToken);

          // Retry the original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  register: (userData) => api.post('/api/auth/register', userData),
  logout: (refreshToken) => api.post('/api/auth/logout', { refreshToken }),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  getProfile: () => api.get('/api/auth/profile'),
  updateProfile: (userData) => api.put('/api/auth/profile', userData),
  changePassword: (passwordData) => api.post('/api/auth/change-password', passwordData),
  forgotPassword: (email) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/api/auth/reset-password', { token, password }),
};

// Products API
export const productsAPI = {
  getProducts: (params) => api.get('/api/products', { params }),
  getProduct: (id) => api.get(`/api/products/${id}`),
  getCategories: () => api.get('/api/categories'),
  searchProducts: (params) => api.get('/search/products', { params }),
  getSearchSuggestions: (query) => api.get('/search/suggestions', { params: { q: query } }),
  getTrendingSearches: () => api.get('/search/trending'),
};

// Cart API
export const cartAPI = {
  getCart: () => api.get('/api/cart'),
  addToCart: (item) => api.post('/api/cart', item),
  updateCartItem: (itemId, quantity) => api.put(`/api/cart/${itemId}`, { quantity }),
  removeFromCart: (itemId) => api.delete(`/api/cart/${itemId}`),
  clearCart: () => api.delete('/api/cart'),
};

// Orders API
export const ordersAPI = {
  getOrders: (params) => api.get('/api/orders/my-orders', { params }),
  getOrder: (id) => api.get(`/api/orders/my-orders/${id}`),
  createOrder: (orderData) => api.post('/api/orders', orderData),
  cancelOrder: (id, reason) => api.patch(`/api/orders/my-orders/${id}/cancel`, { reason }),
};

// Payments API
export const paymentsAPI = {
  getPayments: (params) => api.get('/api/payments/my-payments', { params }),
  getPayment: (id) => api.get(`/api/payments/${id}`),
  createPayment: (paymentData) => api.post('/api/payments', paymentData),
};

// Reviews API
export const reviewsAPI = {
  getProductReviews: (productId, params) => api.get(`/reviews/product/${productId}`, { params }),
  createReview: (reviewData) => api.post('/reviews', reviewData),
  updateReview: (id, reviewData) => api.put(`/reviews/${id}`, reviewData),
  deleteReview: (id) => api.delete(`/reviews/${id}`),
  markReviewHelpful: (id) => api.post(`/reviews/${id}/helpful`),
};

// Wishlist API
export const wishlistAPI = {
  getWishlist: () => api.get('/wishlist'),
  addToWishlist: (item) => api.post('/wishlist', item),
  removeFromWishlist: (productId) => api.delete(`/wishlist/${productId}`),
  clearWishlist: () => api.delete('/wishlist'),
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) => api.get('/notifications/my-notifications', { params }),
  markAsRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  getUnreadCount: () => api.get('/notifications/unread-count'),
};

export default api;
