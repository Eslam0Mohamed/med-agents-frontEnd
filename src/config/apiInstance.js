import axios from 'axios';
const apiInstance = axios.create({
  baseURL: 'http://localhost:5000/api',
});


apiInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    if (error.response?.data?.error === 'SUBSCRIPTION_EXPIRED') {
      if (window.location.pathname !== '/subscriptions') {
        window.location.href = '/subscriptions?expired=1';
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiInstance;