import axios from 'axios';
const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
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

    // الاشتراك انتهى - بنوديه لصفحة الاشتراك فورًا مهما كان بيحاول يعمل إيه
    // بدل ما يشوف صفحة فاضية أو error مش مفهوم
    if (error.response?.data?.error === 'SUBSCRIPTION_EXPIRED') {
      if (window.location.pathname !== '/subscriptions') {
        window.location.href = '/subscriptions?expired=1';
      }
      return Promise.reject(error);
    }

    // الفيتشر ده متاح لـ Pro بس - بنوديه لصفحة الاشتراك مع رسالة توضيحية
    if (error.response?.data?.error === 'PRO_PLAN_REQUIRED') {
      if (window.location.pathname !== '/subscriptions') {
        window.location.href = '/subscriptions?upgrade=1';
      }
      return Promise.reject(error);
    }

    return Promise.reject(error);
  }
);

export default apiInstance;