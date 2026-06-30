import apiInstance from "../config/apiInstance";

export const getMySubscription = async () => {
  const res = await apiInstance.get("/subscription/me");
  return res.data;
};