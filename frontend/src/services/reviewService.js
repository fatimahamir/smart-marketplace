import api from './api';

export const reviewService = {
  create: (data) => api.post('/reviews', data),
  getForTarget: (targetType, targetId) => api.get(`/reviews/${targetType}/${targetId}`),
  getForUser: (userId) => api.get(`/reviews/user/${userId}`),
  report: (id, reason) => api.put(`/reviews/${id}/report`, { reason }),
  remove: (id) => api.delete(`/reviews/${id}`),
};
