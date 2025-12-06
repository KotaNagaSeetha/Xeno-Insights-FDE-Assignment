import axios from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name, tenantId) =>
    api.post('/auth/register', { email, password, name, tenantId }),
  getMe: () => api.get('/auth/me'),
};

// Tenant API
export const tenantAPI = {
  getCurrent: () => api.get('/tenants/me'),
  create: (data) => api.post('/tenants', data),
  update: (data) => api.put('/tenants/me', data),
};

// Ingestion API
export const ingestionAPI = {
  syncAll: () => api.post('/ingestion/sync/all'),
  syncCustomers: () => api.post('/ingestion/sync/customers'),
  syncOrders: (createdAfter) => api.post('/ingestion/sync/orders', { createdAfter }),
  syncProducts: () => api.post('/ingestion/sync/products'),
  getStatus: () => api.get('/ingestion/status'),
};

// Insights API
export const insightsAPI = {
  getOverview: () => api.get('/insights/overview'),
  getOrdersByDate: (startDate, endDate) =>
    api.get('/insights/orders/by-date', { params: { startDate, endDate } }),
  getTopCustomers: (limit = 5) =>
    api.get('/insights/customers/top', { params: { limit } }),
  getRevenueTrends: (period = 'daily', startDate, endDate) =>
    api.get('/insights/revenue/trends', { params: { period, startDate, endDate } }),
  getProductPerformance: (limit = 10) =>
    api.get('/insights/products/performance', { params: { limit } }),
  getOrderStatus: () => api.get('/insights/orders/status'),
  getCustomerAcquisition: (period = 'monthly') =>
    api.get('/insights/customers/acquisition', { params: { period } }),
};

// ADDED FOR REPORTS FEATURE - Product Performance API
export const productPerformanceAPI = {
  getProductPerformance: (tenantId, from, to, limit = 10) =>
    api.get('/metrics/product-performance', { params: { tenantId, from, to, limit } }),
};

// ADDED FOR REPORTS FEATURE - Export API
export const exportAPI = {
  exportOrders: (tenantId, from, to) =>
    api.get('/export/orders', { params: { tenantId, from, to }, responseType: 'blob' }),
  exportCustomers: (tenantId) =>
    api.get('/export/customers', { params: { tenantId }, responseType: 'blob' }),
  exportProducts: (tenantId) =>
    api.get('/export/products', { params: { tenantId }, responseType: 'blob' }),
};

export default api;

