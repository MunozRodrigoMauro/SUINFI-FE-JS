import axiosUser from "./axiosUser";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const loginUser = async ({ email, password }) => {
  const { data } = await axiosUser.post(`${API}/auth/login`, { email, password })
  return data
}

// ✅ NUEVO: verificar token
export const verifyToken = async (token) => {
  const { data } = await axiosUser.get(`${API}/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  return data
}

export const registerUser = async ({ name, email, password, role }) => {
  const { data } = await axiosUser.post(`${API}/users`, {
    name,
    email,
    password,
    role
  });
  return data;
};

export const getMyProfile = async () => {
  const { data } = await axiosUser.get(`${API}/users/me`);
  return data; // { ...userSinPassword }
};

export const updateMyProfile = async (payload) => {
  // payload: { name?, password? }
  const { data } = await axiosUser.put(`${API}/users/me`, payload);
  return data; // { user: { ...actualizado } }
};