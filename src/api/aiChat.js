import apiInstance from "../config/apiInstance";

export const sendMedicalChat = async (
  messages,
  language = "en",
  image = null,
) => {
  const res = await apiInstance.post("/medical-agent/chat", {
    messages,
    language,
    ...(image ? { image } : {}),
  });
  return res.data;
};
