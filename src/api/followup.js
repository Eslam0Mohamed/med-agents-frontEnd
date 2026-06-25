import api from '../config/apiInstance';

export const getFollowUps = async () => {
  const response = await api.get('/followups');
  return response.data;
};

export const getFollowUpById = async (id) => {
  const response = await api.get(`/followups/${id}`);
  return response.data;
};

export const createFollowUp = async (payload) => {
  const response = await api.post('/followups', payload);
  return response.data;
};

export const updateFollowUp = async (id, payload) => {
  const response = await api.put(`/followups/${id}`, payload);
  return response.data;
};