import api from './api';

export const userService = {
  getProfile: (id) => api.get(`/users/${id}`),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadProfilePicture: (formData) => api.put('/users/profile-picture', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  addFavorite: (type, id) => api.post(`/users/favorites/${type}/${id}`),
  removeFavorite: (type, id) => api.delete(`/users/favorites/${type}/${id}`),
  getFavorites: () => api.get('/users/favorites'),
  getDashboard: () => api.get('/users/dashboard'),
};
