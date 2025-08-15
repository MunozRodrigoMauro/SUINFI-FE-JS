// src/api/axiosUser.js
import axios from "axios";

// Creamos una instancia de axios con configuración global
const axiosUser = axios.create({
  baseURL: "http://localhost:3000/api", // URL base de tu backend
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar token JWT si existe
axiosUser.interceptors.request.use((config) => {
  const token = localStorage.getItem("token"); // Lo guardás al hacer login
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default axiosUser;
