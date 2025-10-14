import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    return Promise.reject({ message, status: error.response?.status });
  }
);

export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getFeatured: () => api.get('/categories/featured'),
  getTrending: () => api.get('/categories/trending'),
  getById: (id) => api.get(`/categories/${id}`),
  getBySlug: (slug) => api.get(`/categories/slug/${slug}`),
};

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getFeatured: () => api.get('/products/featured'),
  getTrending: () => api.get('/products/trending'),
  getById: (id) => api.get(`/products/${id}`),
  getByCategory: (categoryId, params) => api.get(`/products/category/${categoryId}`, { params }),
  search: (query) => api.get('/products/search', { params: { query } }),
};

export const matchAPI = {
  uploadAndMatch: (formData) => api.post('/match/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  refineSearch: (sessionId, filters) => api.post(`/match/refine/${sessionId}`, filters),
  trackClick: (data) => api.post('/match/track-click', data),
  getSimilar: (productId) => api.get(`/match/similar/${productId}`),
  getHistory: (sessionId) => api.get(`/match/history/${sessionId}`),
  updateFeedback: (sessionId, feedback) => api.patch(`/match/feedback/${sessionId}`, feedback),
};

export default api;
