// src/api/professionalService.js
import axiosUser from "./axiosUser";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Crear perfil profesional (una sola vez).
 * payload: { services: [ids], yearsOfExperience, bio, location, isAvailableNow, availabilitySchedule, phone, showPhone }
 */
export const createProfessionalProfile = async (payload) => {
  const { data } = await axiosUser.post(`${API}/professionals`, payload);
  return data;
};

// Cambiar estado “Disponible ahora”
export const setAvailableNow = async (isAvailableNow) => {
  const { data } = await axiosUser.patch(
    `${API}/professionals/availability`,
    { isAvailableNow }
  );
  return data; // { message, isAvailableNow }
};

// Actualizar agenda de disponibilidad (bloques por día)
export const updateAvailabilitySchedule = async (availabilitySchedule) => {
  const { data } = await axiosUser.put(
    `${API}/professionals/availability-schedule`,
    { availabilitySchedule }
  );
  return data; // { message, availabilitySchedule }
};

// (Opcional) listar profesionales con filtros
export const getProfessionals = async (params = {}) => {
  const { data } = await axiosUser.get(`${API}/professionals`, { params });
  return data;
};

// Profesionales disponibles ahora (para card de “online”)
export const getAvailableNowProfessionals = async () => {
  const { data } = await axiosUser.get(`${API}/professionals/available-now`);
  return data; // array de profesionales disponibles
};

export const getMyProfessional = async () => {
  const { data } = await axiosUser.get(`${API}/professionals/me`);
  return data;
};

export const updateMyProfessional = async (payload) => {
  const { data } = await axiosUser.patch(`${API}/professionals/me`, payload);
  return data; // { message, professional }
};

// (dejá el resto tal cual: setAvailableNow, updateAvailabilitySchedule, etc.)