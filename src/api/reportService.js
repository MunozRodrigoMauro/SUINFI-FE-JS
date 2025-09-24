import axiosUser from "./axiosUser";
const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";


export const createReport = async (payload) => {
const { data } = await axiosUser.post(`${API}/reports`, payload);
return data;
};


export const getMyReports = async () => {
const { data } = await axiosUser.get(`${API}/reports/mine`);
return data;
};


// Admin (opcional)
export const listReports = async () => {
const { data } = await axiosUser.get(`${API}/reports`);
return data;
};


export const updateReportStatus = async (id, payload) => {
const { data } = await axiosUser.patch(`${API}/reports/${id}`, payload);
return data;
};