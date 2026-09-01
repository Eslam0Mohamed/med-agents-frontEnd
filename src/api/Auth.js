import apiInstance from '../config/apiInstance';

export const loginRequest = async (email, password) => {
  const res = await apiInstance.post('/auth/login', { email, password });
  return res.data;
};

export const registerRequest = async (data) => {
  // لازم multipart/form-data عشان فيها ملف (صورة/PDF إثبات إنه دكتور)
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('email', data.email);
  formData.append('password', data.password);
  if (data.specialty) formData.append('specialty', data.specialty);
  if (data.language) formData.append('language', data.language);
  formData.append('credentialProof', data.credentialProof);

  const res = await apiInstance.post('/auth/register', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data;
};

export const verifyEmailOtpRequest = async (email, otp) => {
  const res = await apiInstance.post('/auth/verify-email-otp', { email, otp });
  return res.data;
};

export const resendEmailOtpRequest = async (email) => {
  const res = await apiInstance.post('/auth/resend-email-otp', { email });
  return res.data;
};

export const forgotPasswordRequest = async (email) => {
  const res = await apiInstance.post('/auth/forgot-password', { email });
  return res.data;
};

export const resetPasswordOtpRequest = async (email, otp, newPassword) => {
  const res = await apiInstance.post('/auth/reset-password-otp', { email, otp, newPassword });
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