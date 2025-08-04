import axiosClient from "./axiosClient";

export const loginUser = async (credentials) => {
  const { data } = await axiosClient.post("/auth/login", credentials);
  return data; // Debería contener { token, user }
};

// export const registerUser = async (userData) => {
//   const { data } = await axiosClient.post("/auth/register", userData);
//   return data; // Debería contener { token, user }
// };

// export const getUserById = async (userId) => {
//   const { data } = await axiosClient.get(`/users/${userId}`);
//   return data;
// };

// export const updateUser = async (userId, userData) => {
//   const { data } = await axiosClient.put(`/users/${userId}`, userData);
//   return data;
// };

// export const deleteUser = async (userId) => {
//   const { data } = await axiosClient.delete(`/users/${userId}`);
//   return data;
// };
