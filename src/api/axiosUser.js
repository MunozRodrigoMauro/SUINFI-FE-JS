// frontend/src/api/axiosUser.js
import axios from "axios";

function computeBaseURL() {
  // 1) Si viene del env, lo normalizamos y usamos
  const raw = import.meta.env?.VITE_API_URL || "";
  if (raw) {
    const trimmed = raw.replace(/\/+$/, "");
    return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
  }

  // 2) Fallback seguro en prod: si el sitio corre en *.cuyit.com,
  // pegamos al API público
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "";
    if (host.endsWith("cuyit.com")) {
      return "https://api.cuyit.com/api";
    }
  }

  // 3) Último recurso: dev local
  return "http://localhost:3000/api";
}

const axiosUser = axios.create({
  baseURL: computeBaseURL(),
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
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
  } catch {}
  return config;
});

axiosUser.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err)
);

export default axiosUser;
