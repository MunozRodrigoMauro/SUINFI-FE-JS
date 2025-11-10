// frontend/src/api/axiosUser.js
import axios from "axios";

function computeBaseURL() {
  const raw = import.meta.env?.VITE_API_URL || "";
  if (raw) {
    const trimmed = raw.replace(/\/+$/, "");
    return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
  }
  if (typeof window !== "undefined") {
    const host = window.location.hostname || "";
    if (host.endsWith("cuyit.com")) return "https://api.cuyit.com/api";
  }
  return "http://localhost:3000/api";
}

const axiosUser = axios.create({
  baseURL: computeBaseURL(),
  // 👇 NO fijamos Content-Type por defecto; dejamos sólo Accept
  headers: { Accept: "application/json" },
  withCredentials: true,
  // [CHANGE-TIMEOUT] evitar requests colgados
  timeout: 20000,
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
    // ⛔️ Si es FormData: no tocar Content-Type ni transformar el body
    if (config.data instanceof FormData) {
      if (config.headers) {
        delete config.headers["Content-Type"];
        delete config.headers["content-type"];
      }
      config.transformRequest = [(d) => d];
    }

    const full = `${config.baseURL || ""}${config.url || ""}`;
    const isVerifyEmail = /\/auth\/verify-email\//i.test(full);
    if (!isVerifyEmail) {
      const token = getToken();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
    }
  } catch {}
  return config;
});

axiosUser.interceptors.response.use(
  (res) => res,
  (err) => {
    // [CHANGE-401] saneo de tokens inválidos y aviso global
    const status = err?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem("auth_token");
        sessionStorage.removeItem("auth_token");
        localStorage.removeItem("token");
      } catch {}
      try {
        window.dispatchEvent(new CustomEvent("cuyit:unauthorized"));
      } catch {}
    }
    return Promise.reject(err);
  }
);

export default axiosUser;
