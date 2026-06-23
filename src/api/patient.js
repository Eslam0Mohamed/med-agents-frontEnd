import apiInstance from '../config/apiInstance';

export const getPatients = async (search = '') => {
  let params = '';
  if (search) params = `?search=${search}`;
  const res = await apiInstance.get(`/patients/doctor${params}`);
  return res.data;
};

export const getPatientHistory = async (id) => {
  const res = await apiInstance.get(`/patients/${id}/history`);
  return res.data;
};
import {createAsyncThunk } from '@reduxjs/toolkit';
export const fetchPatients = createAsyncThunk(
  'patients/fetchPatients',
  async ({ search = '', page = 1, limit = 10 } = {}) => {
    let params = `?page=${page}&limit=${limit}`;
    if (search) params += `&search=${search}`;
    const res = await apiInstance.get(`/patients/doctor${params}`);
    return res.data;
  }
);

export const fetchPatientById = createAsyncThunk(
  'patients/fetchPatientById',
  async (id) => {
    const res = await apiInstance.get(`/patients/${id}`);
    return res.data.data;
  }
);

export const fetchPatientHistory = createAsyncThunk(
  'patients/fetchPatientHistory',
  async (id) => {
    const res = await apiInstance.get(`/patients/${id}/history`);
    return res.data.data;
  }
);

export const createPatient = createAsyncThunk(
  'patients/createPatient',
  async (patientData) => {
    const res = await apiInstance.post('/patients', patientData);
    return res.data.data;
  }
);

export const updatePatient = createAsyncThunk(
  'patients/updatePatient',
  async ({ id, patientData }) => {
    const res = await apiInstance.patch(`/patients/${id}`, patientData);
    return res.data.data;
  }
);

export const deletePatient = createAsyncThunk(
  'patients/deletePatient',
  async (id) => {
    await apiInstance.delete(`/patients/${id}`);
    return id;
  }
);
