import api from './api';

export const serviceListingService = {
  getAll: (params) => api.get('/services', { params }),
  getOne: (id) => api.get(`/services/${id}`),
  create: (data) => api.post('/services', data),
  update: (id, data) => api.put(`/services/${id}`, data),
  remove: (id) => api.delete(`/services/${id}`),
  uploadImages: (id, formData) => api.put(`/services/${id}/images`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getMy: () => api.get('/services/my/listings'),
};
