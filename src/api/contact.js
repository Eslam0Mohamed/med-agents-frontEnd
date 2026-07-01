import apiInstance from "../config/apiInstance";



export const sendContactMessage = async ({ name, email, message }) => {
  const res = await apiInstance.post(`${API_BASE_URL}/contact`, {
    name,
    email,
    message,
  });
  return res.data;
};