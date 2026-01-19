import axios from 'axios';

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if ([401, 403].includes(error.response?.status) && !originalRequest?._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken
          });

          const { accessToken } = response.data.tokens;
          localStorage.setItem('token', accessToken);

          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (credentials) => api.post('/api/auth/login', credentials),
  refreshToken: (refreshToken) => api.post('/api/auth/refresh', { refreshToken }),
  logout: (refreshToken) => api.post('/api/auth/logout', { refreshToken }),
  getProfile: () => api.get('/api/auth/profile')
};

export const ordersAPI = {
  getAllOrders: (params) => api.get('/api/orders/admin/all', { params }),
  getOrderById: (id) => api.get(`/api/orders/admin/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/api/orders/${id}/status`, { status })
};

export const productsAPI = {
  getAllProducts: (params) => api.get('/api/products/admin/all', { params }),
  createProduct: (payload) => api.post('/api/products', payload)
};

export const adminUsersAPI = {
  listUsers: (params) => api.get('/api/admin/users', { params }),
  createUser: (payload) => api.post('/api/admin/users', payload),
  updateUser: (id, payload) => api.patch(`/api/admin/users/${id}`, payload)
};

export default api;
