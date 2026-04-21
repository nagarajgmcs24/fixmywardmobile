// src/services/api.js
import axios from 'axios';

const API_URL = 'http://localhost:5000/api'; // Change to your backend URL if needed

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to requests
export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Auth
export const login = (data) => api.post('/auth/login', data);
export const register = (data) => api.post('/auth/register', data);
export const otpSend = (data) => api.post('/auth/send-otp', data);
export const otpVerify = (data) => api.post('/auth/verify-otp', data);
export const socialLogin = (data) => api.post('/auth/social-login', data);
export const deleteAccount = () => api.delete('/auth/delete');

// Profile
export const updateProfile = (data) => api.put('/auth/profile', data);

// Complaints
export const createComplaint = (data) => api.post('/complaints', data);
export const getComplaints = (params) => api.get('/complaints', { params });
export const updateComplaintStatus = (id, data) => api.put(`/complaints/${id}/status`, data);

// Notifications
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);

// Wards
export const assignWard = (data) => api.post('/wards/assign', data);
export const getCurrentAssignment = (user_id) => api.get(`/wards/current/${user_id}`);
export const getAssignmentHistory = (user_id) => api.get(`/wards/history/${user_id}`);

// Admin
export const getStats = () => api.get('/admin/stats');
export const listUsers = () => api.get('/admin/users');
export const updateUserRole = (user_id, data) => api.put(`/admin/users/${user_id}/role`, data);
