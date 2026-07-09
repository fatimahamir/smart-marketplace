import api from './api';

export const bookingService = {
  create: (data) => api.post('/bookings', data),
  getMy: (params) => api.get('/bookings/my', { params }),
  getOne: (id) => api.get(`/bookings/${id}`),
  accept: (id) => api.put(`/bookings/${id}/accept`),
  reject: (id, reason) => api.put(`/bookings/${id}/reject`, { reason }),
  complete: (id) => api.put(`/bookings/${id}/complete`),
  cancel: (id, reason) => api.put(`/bookings/${id}/cancel`, { reason }),
};
