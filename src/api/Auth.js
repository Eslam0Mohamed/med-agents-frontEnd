import apiInstance from '../config/apiInstance';

export const loginRequest = async (email, password) => {
  const res = await apiInstance.post('/auth/login', { email, password });
  return res.data;
};

export const logoutRequest = async () => {
  const res = await apiInstance.post('/auth/logout');
  return res.data;
};

export const updateProfileRequest = async (data) => {
  const res = await apiInstance.put('/auth/me', data);
  return res.data;
};