// frontend/src/api/axiosUser.js
import axios from "axios";

// Base normalizada: acepta VITE_API_URL con o sin /api al final
const RAW = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const BASE = RAW.replace(/\/+$/, "").match(/\/api$/i) ? RAW.replace(/\/+$/, "") : `${RAW.replace(/\/+$/, "")}/api`;

const axiosUser = axios.create({
  baseURL: BASE, // <- ahora usa env y queda consistente con ngrok
  headers: { "Content-Type": "application/json" },
});

function getToken() {
  return (
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

axiosUser.interceptors.request.use((config) => {
  try {
    const full = `${config.baseURL || ""}${config.url || ""}`;
    const isVerifyEmail = /\/auth\/verify-email\//i.test(full);
    if (!isVerifyEmail) {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
  } catch (_) {}
  return config;
});

axiosUser.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default axiosUser;
