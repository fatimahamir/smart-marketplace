import api from './api';

export const productService = {
  getAll: (params) => api.get('/products', { params }),
  getOne: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  remove: (id) => api.delete(`/products/${id}`),
  uploadImages: (id, formData) => api.put(`/products/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMy: () => api.get('/products/my/listings'),
};
