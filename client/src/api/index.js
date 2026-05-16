import axios from 'axios';

// baseURL is '' so all requests use the Vite proxy:
// /auth → http://localhost:5001
// /donations → http://localhost:5001
// /admin → http://localhost:5001
const api = axios.create({ baseURL: '' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
