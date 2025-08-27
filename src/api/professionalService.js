import axiosUser from "./axiosUser";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const createProfessionalProfile = async (payload) => {
  const { data } = await axiosUser.post(`${API}/professionals`, payload);
  return data;
};

export const setAvailableNow = async (isAvailableNow) => {
  const { data } = await axiosUser.patch(
    `${API}/professionals/availability`,
    { isAvailableNow }
  );
  // el BE ya retorna { isAvailableNow, availabilityStrategy }
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

export const getAvailableNowProfessionals = async () => {
  const { data } = await axiosUser.get(`${API}/professionals/available-now`);
  return data;
};

export const getMyProfessional = async () => {
  const { data } = await axiosUser.get(`${API}/professionals/me`);
  return data;
};

export const updateMyProfessional = async (payload) => {
  const { data } = await axiosUser.patch(`${API}/professionals/me`, payload);
  return data;
};

export const getProfessionalById = async (id) => {
  const { data } = await axiosUser.get(`${API}/professionals/${id}`);
  return data;
};

export const getNearbyProfessionals = async (lat, lng, maxDistance = 5000, extra = {}) => {
  const { data } = await axiosUser.get(`${API}/professionals/nearby`, {
    params: { lat, lng, maxDistance, ...extra },
  });
  return data;
};

export const updateMyLocation = async (lat, lng) => {
  return axiosUser.patch(`${API}/professionals/me/location`, { lat, lng });
};

export const setAvailabilityMode = async (mode) => {
  const { data } = await axiosUser.patch(`${API}/professionals/availability-mode`, { mode });
  return data; // { message, availabilityStrategy }
};
