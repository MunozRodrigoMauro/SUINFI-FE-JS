// src/api/userService.js
import axiosUser from "./axiosUser";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// --------- Auth base (con interceptor) ---------
export const loginUser = async ({ email, password }) => {
  const { data } = await axiosUser.post(`${API}/auth/login`, { email, password });
  return data;
};

export const verifyToken = async (token) => {
  const { data } = await axiosUser.get(`${API}/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
};

export const registerUser = async ({ name, email, password, role }) => {
  const { data } = await axiosUser.post(`${API}/users`, {
    name, email, password, role,
  });
  return data;
};

export const resendVerification = async (email) => {
  const { data } = await axiosUser.post(`${API}/auth/resend-verification`, { email });
  return data;
};

export const getMyProfile = async () => {
  const { data } = await axiosUser.get(`${API}/users/me`);
  return data;
};

export const updateMyProfile = async (payload) => {
  const { data } = await axiosUser.put(`${API}/users/me`, payload);
  return data;
};

// --------- 🔒 Verificación de email SIN interceptor (fetch limpio) ---------
function withTimeout(ms = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

/**
 * Llama GET /auth/verify-email/:token SIN Authorization
 * El token debe ser el HEX que viene por mail (no JWT).
 */
export async function verifyEmailByToken(token) {
  if (!token) {
    const err = new Error("Token faltante");
    err.status = 400;
    throw err;
  }

  const url = `${API}/auth/verify-email/${token}`;

  const t = withTimeout(12000);
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      signal: t.signal,
      // 👇 Nada de Authorization ni cookies
      headers: { "Accept": "application/json" },
    });

    const isJson = (res.headers.get("content-type") || "").includes("application/json");
    const body = isJson ? await res.json() : null;

    if (!res.ok) {
      const err = new Error(body?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = body;
      throw err;
    }

    return body || { message: "Email verified successfully" };
  } finally {
    t.cancel();
  }
}