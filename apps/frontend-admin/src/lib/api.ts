import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(`${API_URL}/api/v1/auth/refresh`, {
          refreshToken,
        });
        
        const { accessToken } = response.data.data.tokens;
        localStorage.setItem('accessToken', accessToken);
        
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// API helper functions
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
};

export const propertyApi = {
  getAll: (params?: Record<string, string>) =>
    api.get('/properties', { params }),
  getById: (id: string) => api.get(`/properties/${id}`),
  create: (data: unknown) => api.post('/properties', data),
  update: (id: string, data: unknown) =>
    api.put(`/properties/${id}`, data),
  delete: (id: string) => api.delete(`/properties/${id}`),
  getFeatured: () => api.get('/properties/featured/list'),
  getTypes: () => api.get('/properties/meta/types'),
  getCities: () => api.get('/properties/meta/cities'),
};

export const serviceApi = {
  getCategories: () => api.get('/services/categories'),
  getAll: (params?: Record<string, string>) =>
    api.get('/services', { params }),
  getById: (id: string) => api.get(`/services/${id}`),
  getProviders: (params?: Record<string, string>) =>
    api.get('/services/providers', { params }),
  book: (data: unknown) => api.post('/services/bookings', data),
  getMyBookings: () => api.get('/services/bookings/my'),
};

export const marketplaceApi = {
  getCategories: () => api.get('/marketplace/categories'),
  getAll: (params?: Record<string, string>) =>
    api.get('/marketplace', { params }),
  getById: (id: string) => api.get(`/marketplace/${id}`),
  create: (data: unknown) => api.post('/marketplace', data),
  getMyListings: () => api.get('/marketplace/my/listings'),
};

export const bookingApi = {
  create: (data: unknown) => api.post('/bookings', data),
  getMy: () => api.get('/bookings/my'),
  getHost: () => api.get('/bookings/host'),
  getById: (id: string) => api.get(`/bookings/${id}`),
  confirm: (id: string) => api.patch(`/bookings/${id}/confirm`),
  cancel: (id: string, reason?: string) =>
    api.patch(`/bookings/${id}/cancel`, { reason }),
};

export const searchApi = {
  properties: (params: Record<string, string>) =>
    api.get('/search/properties', { params }),
  marketplace: (params: Record<string, string>) =>
    api.get('/search/marketplace', { params }),
  suggestions: (q: string) =>
    api.get('/search/suggestions', { params: { q } }),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: unknown) => api.patch('/users/profile', data),
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post('/users/change-password', data),
  getFavorites: () => api.get('/users/favorites'),
  addFavorite: (propertyId: string) =>
    api.post(`/users/favorites/${propertyId}`),
  removeFavorite: (propertyId: string) =>
    api.delete(`/users/favorites/${propertyId}`),
};

export const reviewApi = {
  create: (data: unknown) => api.post('/reviews', data),
  getByProperty: (propertyId: string) =>
    api.get(`/reviews/property/${propertyId}`),
};

export const uploadApi = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file, i) => formData.append(`file${i}`, file));
    return api.post('/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;