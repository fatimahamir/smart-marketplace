import api from './api';

export const messageService = {
  getInbox: () => api.get('/messages'),
  getConversation: (userId) => api.get(`/messages/${userId}`),
  send: (data) => api.post('/messages', data),
  markAsRead: (userId) => api.put(`/messages/${userId}/read`),
};
