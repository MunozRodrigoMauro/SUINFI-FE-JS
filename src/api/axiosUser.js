// src/api/axiosUser.js
import axios from "axios";

// Instancia base
const axiosUser = axios.create({
  baseURL: "http://localhost:3000/api",
  headers: { "Content-Type": "application/json" },
});

// Interceptor: agrega JWT excepto en /auth/verify-email/*
axiosUser.interceptors.request.use((config) => {
  try {
    const url = `${config.baseURL?.replace(/\/$/, "") || ""}${config.url || ""}`;
    const isVerifyEmail =
      /\/api\/auth\/verify-email\/[A-Za-z0-9]+$/.test(url);

    if (!isVerifyEmail) {
      const token = localStorage.getItem("token");
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } else {
      // aseguramos no mandar Authorization si el global quedó seteado
      if (config.headers?.Authorization) {
        delete config.headers.Authorization;
      }
    }
  } catch (_) {
    // noop
  }
  return config;
});

// (opcional) Interceptor de respuesta para log simple
axiosUser.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    const data = err?.response?.data;
    const url = err?.config?.baseURL
      ? `${err.config.baseURL}${err.config.url}`
      : err?.config?.url;
    return Promise.reject(err);
  }
);

export default axiosUser;