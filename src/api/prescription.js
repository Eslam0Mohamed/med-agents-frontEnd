import apiInstance from "../config/apiInstance";

// Search drugs from FDA for the medication-name autocomplete dropdown
export const searchDrugs = async (name) => {
  const res = await apiInstance.get("/prescriptions/drugs/search", {
    params: { name },
  });
  return res.data;
};

// Live safety check (allergies + FDA interactions + ongoing medication conflicts)
// while the doctor is still building the prescription, before saving.
export const checkPrescriptionSafety = async ({
  patientId,
  medications,
  excludePrescriptionId,
}) => {
  const res = await apiInstance.post("/prescriptions/safety-check", {
    patientId,
    medications,
    excludePrescriptionId,
  });
  return res.data;
};

export const createPrescription = async (data) => {
  const res = await apiInstance.post("/prescriptions", data);
  return res.data;
};

export const getPrescriptionByConsultation = async (consultationId) => {
  const res = await apiInstance.get(
    `/prescriptions/consultation/${consultationId}`,
  );
  return res.data;
};

export const getPrescriptionsByPatient = async (patientId) => {
  const res = await apiInstance.get(`/prescriptions/patient/${patientId}`);
  return res.data;
};

export const getPrescriptionById = async (id) => {
  const res = await apiInstance.get(`/prescriptions/${id}`);
  return res.data;
};

export const getAllPrescriptions = async ({
  search = "",
  date = "",
  page = 1,
  limit = 10,
} = {}) => {
  let params = `?page=${page}&limit=${limit}`;
  if (search) params += `&search=${encodeURIComponent(search)}`;
  if (date) params += `&date=${encodeURIComponent(date)}`;
  const res = await apiInstance.get(`/prescriptions${params}`);
  return res.data;
};

// Distinct dates (YYYY-MM-DD) that have at least one prescription, for
// highlighting days on the calendar search.
export const getPrescriptionDates = async () => {
  const res = await apiInstance.get("/prescriptions/dates");
  return res.data;
};

export const updatePrescription = async (id, data) => {
  const res = await apiInstance.patch(`/prescriptions/${id}`, data);
  return res.data;
};

export const deletePrescription = async (id) => {
  const res = await apiInstance.delete(`/prescriptions/${id}`);
  return res.data;
};
