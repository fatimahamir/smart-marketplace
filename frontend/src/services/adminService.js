import api from './api';

export const adminService = {
  getStats: () => api.get('/admin/stats'),
  getActivity: () => api.get('/admin/activity'),
  getUsers: (params) => api.get('/admin/users', { params }),
  suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
  unsuspendUser: (id) => api.put(`/admin/users/${id}/unsuspend`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getPendingListings: () => api.get('/admin/listings/pending'),
  approveListing: (type, id) => api.put(`/admin/listings/${type}/${id}/approve`),
  removeListing: (type, id) => api.put(`/admin/listings/${type}/${id}/remove`),
  getReportedReviews: () => api.get('/admin/reports/reviews'),
  dismissReport: (id) => api.put(`/admin/reports/reviews/${id}/dismiss`),
  removeReportedReview: (id) => api.delete(`/admin/reports/reviews/${id}`),
};
