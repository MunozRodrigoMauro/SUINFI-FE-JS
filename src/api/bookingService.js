import axiosUser from "./axiosUser";
const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// helper local: arma ISO con zona local del usuario
const dateTimeToISO = (date, time) => {
  // date: "YYYY-MM-DD", time: "HH:mm"
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm]  = time.split(":").map(Number);
  const local = new Date(y, (m - 1), d, hh, mm, 0);
  return new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
};

export const createBooking = async (payload) => {
  // payload recibido del FE: { professionalId, serviceId, date, time, note }
  const { date, time, ...rest } = payload;
  const body = {
    ...rest,
    scheduledAt: dateTimeToISO(date, time),
  };
  const { data } = await axiosUser.post(`${API}/bookings`, body);
  return data;
};

export const getMyBookings = async (params = {}) => {
  const { data } = await axiosUser.get(`${API}/bookings/mine`, { params });
  return data;
};

export const getBookingsForMe = async (params = {}) => {
  const { data } = await axiosUser.get(`${API}/bookings/for-me`, { params });
  return data;
};

export const updateBookingStatus = async (id, status) => {
  const { data } = await axiosUser.patch(`${API}/bookings/${id}`, { status });
  return data;
};
