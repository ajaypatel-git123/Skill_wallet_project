import axios from 'axios';

// Create Axios client with backend base URL
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000'
});

// API helper functions for all platform features
export const analyzeSafety = (formData) => API.post('/api/safety', formData);
export const analyzeCrack = (formData) => API.post('/api/crack', formData);
export const getValuation = (formData) => API.post('/api/valuation', formData);
export const createPlan = (data) => API.post('/api/planning', data);
export const getDailyAssistant = (data) => API.post('/api/assistant/daily', data);
export const askKnowledge = (data) => API.post('/api/knowledge', data);
export const getHistory = (type) => API.get(`/api/history?type=${type}`);
export const healthCheck = () => API.get('/api/health');

export default API;
