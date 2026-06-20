import apiInstance from '../config/apiInstance';

export const sendMedicalChat = async (messages, language = 'en') => {
  const res = await apiInstance.post('/medical-agent/chat', { messages, language });
  return res.data;
};