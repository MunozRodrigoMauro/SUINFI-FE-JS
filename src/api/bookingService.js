import axiosClient from "./axiosClient";

export const getMyBookings = async () => {
  const { data } = await axiosClient.get("/bookings/my");
  return data;
};

export const createBooking = async (bookingData) => {
  const { data } = await axiosClient.post("/bookings", bookingData);
  return data;
};
