import apiInstance from '../config/apiInstance';

export const getConsultations = async () => {
  const res = await apiInstance.get('/consultations');
  return res.data;
};

export const getAIRecommendation = async (AiData) => {
  const { data } = await apiInstance.post("/consultations/ai-recommendation", AiData);
  return data;
};

export const getConsultationById = async (id) => {
  const res = await apiInstance.get(`/consultations/${id}`);
  return res.data;
};

export const createConsultation = async (data) => {
  const res = await apiInstance.post('/consultations', data);
  return res.data;
};

export const updateConsultation = async (id, data) => {
  const res = await apiInstance.put(`/consultations/${id}`, data);
  return res.data;
};

export const deleteConsultation = async (id) => {
  const res = await apiInstance.delete(`/consultations/${id}`);
  return res.data;
};