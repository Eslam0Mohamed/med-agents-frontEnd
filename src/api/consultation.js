import apiInstance from "../config/apiInstance";

// بنشتق دومين السيرفر (من غير /api في الآخر) عشان نبني رابط كامل لملف
// متخزن على السيرفر (اللي بيرجع كمسار نسبي زي /uploads/lab-files/xxx.jpg)
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "").replace(
  /\/api\/?$/,
  "",
);

export const resolveLabFileUrl = (relativeUrl) => {
  if (!relativeUrl) return "";
  if (/^https?:\/\//i.test(relativeUrl)) return relativeUrl;
  return `${API_ORIGIN}${relativeUrl}`;
};

/**
 * بترفع واحد أو أكتر من ملفات التحاليل المعملية/تقارير الأشعة (صور أو
 * PDF). بترجع ميتاداتا كل ملف (رابط + اسم + نوع + حجم) - مش الملف نفسه.
 */
export const uploadLabFiles = async (files) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  // من غير ما نحدد Content-Type يدويًا - axios بيتعرف على FormData
  // ويضيف الـ boundary الصح لوحده
  const { data } = await apiInstance.post("/consultations/lab-files", formData);
  return data;
};

export const getConsultations = async () => {
  const res = await apiInstance.get("/consultations/doctor");
  return res.data;
};

export const getAIRecommendation = async (AiData) => {
  const { data } = await apiInstance.post(
    "/consultations/ai-recommendation",
    AiData,
  );
  return data;
};

export const getMedicationSuggestions = async (payload) => {
  const { data } = await apiInstance.post(
    "/consultations/medication-suggestions",
    payload,
  );
  return data;
};

export const getConsultationById = async (id) => {
  const res = await apiInstance.get(`/consultations/${id}`);
  return res.data;
};

export const createConsultation = async (data) => {
  const res = await apiInstance.post("/consultations", data);
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
