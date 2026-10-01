import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zarro_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('zarro_token');
      localStorage.removeItem('zarro_user');
    }
    return Promise.reject(error);
  }
);

export const API_ORIGIN = 'http://localhost:5000';

export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith('http')) return path; // already a full URL (e.g. placeholder.com)
  return `${API_ORIGIN}${path}`;
}

export default api;