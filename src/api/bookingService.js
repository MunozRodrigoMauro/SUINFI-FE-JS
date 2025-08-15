// src/api/bookingService.js
import axiosUser from "./axiosUser";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Crear una reserva
export const createBooking = async (payload) => {
  // payload: { professionalId, serviceId, date, time, note }
  const { data } = await axiosUser.post(`${API}/bookings`, payload);
  return data; // { booking: {...} }
};

// Mis reservas (cliente)
export const getMyBookings = async (page = 1, limit = 10) => {
  const { data } = await axiosUser.get(`${API}/bookings/mine`, { params: { page, limit } });
  return data;
};

// Reservas que me hicieron (profesional)
export const getBookingsForMe = async (page = 1, limit = 10) => {
  const { data } = await axiosUser.get(`${API}/bookings/for-me`, { params: { page, limit } });
  return data;
};

// Cambiar estado de una reserva (profesional): accept / reject / cancel
export const respondBooking = async (bookingId, action) => {
  const { data } = await axiosUser.patch(`${API}/bookings/${bookingId}`, { action });
  return data;
};