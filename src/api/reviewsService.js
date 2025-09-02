import axiosUser from "./axiosUser";
const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export async function createReview({ bookingId, professionalId, rating, comment, photos = [] }) {
  const fd = new FormData();
  fd.append("bookingId", bookingId);
  if (professionalId) fd.append("professionalId", professionalId);
  fd.append("rating", String(rating));
  if (comment) fd.append("comment", comment);
  (photos || []).forEach((f) => fd.append("photos", f));
  const { data } = await axiosUser.post(`${API}/reviews`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function getProfessionalReviews(professionalId, { page = 1, limit = 10 } = {}) {
  const { data } = await axiosUser.get(`${API}/reviews/professional/${professionalId}`, {
    params: { page, limit },
  });
  return data;
}

export async function getReviewForBooking(bookingId) {
  const { data } = await axiosUser.get(`${API}/reviews/booking/${bookingId}`);
  return data; // { exists, review }
}

export async function getMyPendingReviews({ professionalId } = {}) {
  const { data } = await axiosUser.get(`${API}/reviews/my-pending`, { params: { professionalId } });
  return data; // { pending: [bookingId], count }
}
