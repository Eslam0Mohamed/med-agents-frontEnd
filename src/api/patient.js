import apiInstance from "../config/apiInstance";

export const getPatients = async (search = "") => {
  let params = "";
  if (search) params = `?search=${search}`;
  const res = await apiInstance.get(`/patients/doctor${params}`);
  return res.data;
};

// بترجع مرضى الدكتور اللي عمل login بس (اللي هو أنشأهم أو عمّلهم كونسلتيشن
// قبل كده)، مش كل مرضى النظام - عن طريق /patients/doctor بحد أقصى كبير
// (زي نفس الباترن المستخدم في PatientsList.jsx) عشان نضمن إن كل المرضى
// بتوع الدكتور يترجعوا مرة واحدة من غير ما نعتمد على limit=10 الافتراضي.
// دي كانت بتنده على /patients (كل مرضى النظام، من غير فلترة) - اتغيّرت
// لـ /patients/doctor لأن /patients بقت مخصّصة للأدمن داشبورد بس
export const getAllPatients = async ({ search = "" } = {}) => {
  let params = "?page=1&limit=1000";
  if (search) params += `&search=${search}`;
  const res = await apiInstance.get(`/patients/doctor${params}`);
  return res.data;
};

export const getPatientHistory = async (id) => {
  const res = await apiInstance.get(`/patients/${id}/history`);
  return res.data;
};

export const discontinueMedication = async (
  patientId,
  { prescriptionId, medicationId, reason },
) => {
  const res = await apiInstance.post(
    `/patients/${patientId}/discontinue-medication`,
    { prescriptionId, medicationId, reason },
  );
  return res.data;
};

export const reactivateMedication = async (patientId, medicationId) => {
  const res = await apiInstance.post(
    `/patients/${patientId}/reactivate-medication`,
    { medicationId },
  );
  return res.data;
};

import { createAsyncThunk } from "@reduxjs/toolkit";
export const fetchPatients = createAsyncThunk(
  "patients/fetchPatients",
  async ({ search = "", page = 1, limit = 10 } = {}) => {
    let params = `?page=${page}&limit=${limit}`;
    if (search) params += `&search=${search}`;
    const res = await apiInstance.get(`/patients/doctor${params}`);
    return res.data;
  },
);

export const fetchPatientById = createAsyncThunk(
  "patients/fetchPatientById",
  async (id) => {
    const res = await apiInstance.get(`/patients/${id}`);
    return res.data.data;
  },
);

export const fetchPatientHistory = createAsyncThunk(
  "patients/fetchPatientHistory",
  async (id) => {
    const res = await apiInstance.get(`/patients/${id}/history`);
    return res.data.data;
  },
);

export const createPatient = createAsyncThunk(
  "patients/createPatient",
  async (patientData) => {
    const res = await apiInstance.post("/patients", patientData);
    return res.data.data;
  },
);

export const updatePatient = createAsyncThunk(
  "patients/updatePatient",
  async ({ id, patientData }) => {
    const res = await apiInstance.patch(`/patients/${id}`, patientData);
    return res.data.data;
  },
);

export const deletePatient = createAsyncThunk(
  "patients/deletePatient",
  async (id) => {
    await apiInstance.delete(`/patients/${id}`);
    return id;
  },
);
