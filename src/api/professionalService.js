import axiosUser from "./axiosUser";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const createProfessionalProfile = async (payload) => {
  const { data } = await axiosUser.post(`${API}/professionals`, payload);
  return data;
};

export const setAvailableNow = async (isAvailableNow) => {
  const { data } = await axiosUser.patch(`${API}/professionals/availability`, { isAvailableNow });
  return { isAvailableNow: !!data.isAvailableNow, mode: data.availabilityStrategy };
};

export const updateAvailabilitySchedule = async (availabilitySchedule) => {
  const { data } = await axiosUser.put(`${API}/professionals/availability-schedule`, { availabilitySchedule });
  return data;
};

export const getProfessionals = async (params = {}) => {
  const { data } = await axiosUser.get(`${API}/professionals`, { params });
  return data;
};

export const getAvailableNowProfessionals = async (params = {}) => {
  const { data } = await axiosUser.get(`${API}/professionals/available-now`, { params });
  return data;
};

export async function getMyProfessional() {
  const API2 = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
  const { data, status } = await axiosUser.get(`${API2}/professionals/me`, {
    validateStatus: (s) => (s >= 200 && s < 300) || s === 404,
  });
  if (status === 404) return null;
  if (data && data.exists === false) return null;
  return data;
}

export const updateMyProfessional = async (payload) => {
  const { data } = await axiosUser.patch(`${API}/professionals/me`, payload);
  return data;
};

export const getProfessionalById = async (id) => {
  const { data } = await axiosUser.get(`${API}/professionals/${id}`);
  return data;
};

export const getNearbyProfessionals = async (lat, lng, maxDistance = 5000, extra = {}) => {
  const { data } = await axiosUser.get(`${API}/professionals/nearby`, { params: { lat, lng, maxDistance, ...extra } });
  return data;
};

export const updateMyLocation = async (lat, lng) => {
  return axiosUser.patch(`${API}/professionals/me/location`, { lat, lng });
};

export const setAvailabilityMode = async (mode) => {
  const { data } = await axiosUser.patch(`${API}/professionals/availability-mode`, { mode });
  return data;
};

export const uploadProfessionalDoc = async (type, formData) => {
  const { data } = await axiosUser.post(`/professionals/me/docs/${type}`, formData);
  return data;
};


export const deleteProfessionalDoc = async (type) => {
  const { data } = await axiosUser.delete(`${API}/professionals/me/docs/${type}`);
  return data;
};

export const getProfessionalDocsMeta = async (id) => {
  const { data } = await axiosUser.get(`${API}/professionals/${id}/docs/meta`);
  return data;
};

// NUEVO: payout
export const getMyPayout = async () => {
  const { data } = await axiosUser.get(`${API}/professionals/me/payout`);
  return data;
};

export const updateMyPayout = async (payout) => {
  const { data } = await axiosUser.patch(`${API}/professionals/me/payout`, { payout });
  return data;
};
