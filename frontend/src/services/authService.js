import api from './api';

export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.get('/auth/logout'),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (resetToken, password) => api.put(`/auth/reset-password/${resetToken}`, { password }),
  updatePassword: (currentPassword, newPassword) => api.put('/auth/update-password', { currentPassword, newPassword }),
};
