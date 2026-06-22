import apiInstance from '../config/apiInstance';

export const getPatients = async (search = '') => {
  const res = await apiInstance.get('/patient', {
    params: search ? { search } : {},
  });
  return res.data;
};

export const getPatientHistory = async (id) => {
  const res = await apiInstance.get(`/patient/${id}/history`);
  return res.data;
};