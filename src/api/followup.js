import api from '../config/apiInstance';

export const getFollowUps = async () => {
  const response = await api.get('/followups');
  return response.data;
};

export const deleteFollowUp = async (id) => {
  const response = await api.delete(`/followups/${id}`);
  return response.data;
};