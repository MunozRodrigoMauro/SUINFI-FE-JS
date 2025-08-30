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
  const { data } = await axiosUser.post(`${API}/users`, { name, email, password, role });
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
  const { data } = await axiosUser.patch(`${API}/users/me`, payload);
  return data;
};

// --------- Verificación de email SIN interceptor ---------
function withTimeout(ms = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

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
      headers: { Accept: "application/json" },
    });
    const body = (res.headers.get("content-type") || "").includes("application/json")
      ? await res.json()
      : null;
    if (!res.ok) {
      const err = new Error(body?.message || `HTTP ${res.status}`);
      err.status = res.status;
      err.data = body;
      throw err;
    }
    return body || { message: "Email verified successfully" };
  } finally { t.cancel(); }
}

/* ========= 🔐 Reset password público SIN interceptor ========= */
export async function requestPasswordReset(email) {
  const t = withTimeout(12000);
  try {
    const res = await fetch(`${API}/auth/password-reset/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ email }),
      signal: t.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message || "Error");
    return body;
  } finally { t.cancel(); }
}

export async function resetPasswordByToken(token, newPassword) {
  const t = withTimeout(12000);
  try {
    const res = await fetch(`${API}/auth/password-reset/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ token, newPassword }),
      signal: t.signal,
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body?.message || "Error");
    return body;
  } finally { t.cancel(); }
}

export const uploadMyAvatar = async (formData) => {
  const { data } = await axiosUser.patch(
    `${API}/users/me/avatar`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );
  return data; // { url, user }
};

// 🆕 eliminar avatar (match con DELETE /api/users/me/avatar del BE)
export const deleteMyAvatar = async () => {
  const { data } = await axiosUser.delete(`${API}/users/me/avatar`);
  return data; // { message, user }
};
