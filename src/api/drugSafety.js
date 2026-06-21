import apiInstance from '../config/apiInstance';

export const checkDrugSafety = async (medications, language = 'en') => {
  const res = await apiInstance.post('/drug-safety/check', { medications, language });
  return res.data;
};

export const checkDrugSafetyForPatient = async (patientId, medications, language = 'en') => {
  const res = await apiInstance.post(`/drug-safety/check/${patientId}`, { medications, language });
  return res.data;
};
