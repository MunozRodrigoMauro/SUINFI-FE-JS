import axiosUser from "./axiosUser";
const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const adminListDeposits = async () => {
  const { data } = await axiosUser.get(`${API}/payments/admin/deposits`);
  return data;
};

export const adminRefundManual = async ({ paymentId, amount, reason }) => {
  const { data } = await axiosUser.post(`${API}/payments/admin/refund`, { paymentId, amount, reason });
  return data;
};

export const adminCreatePayout = async ({ paymentId, amount, notes }) => {
  const { data } = await axiosUser.post(`${API}/payments/admin/payouts`, { paymentId, amount, notes });
  return data;
};

export const adminListPayouts = async () => {
  const { data } = await axiosUser.get(`${API}/payments/admin/payouts`);
  return data;
};