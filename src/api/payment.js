import apiInstance from "../config/apiInstance";

export const initiatePayment = async (plan, months) => {
  const res = await apiInstance.post("/payment/initiate", { plan, months });
  return res.data;
};

export const getPaymentStatus = async (merchantOrderId) => {
  const res = await apiInstance.get(`/payment/status/${merchantOrderId}`);
  return res.data;
};
