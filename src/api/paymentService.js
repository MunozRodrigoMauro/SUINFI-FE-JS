// frontend/src/api/paymentService.js

// Normaliza BASE: acepta con o sin /api al final
const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const BASE = RAW_BASE.replace(/\/+$/, "").match(/\/api$/i)
  ? RAW_BASE.replace(/\/+$/, "")
  : `${RAW_BASE.replace(/\/+$/, "")}/api`;

function getToken() {
  return (
    localStorage.getItem("auth_token") ||
    sessionStorage.getItem("auth_token") ||
    localStorage.getItem("token") ||
    ""
  );
}

function authHeaders(explicitToken) {
  const t = explicitToken || getToken();
  const h = { "Content-Type": "application/json" };
  if (t) h.Authorization = `Bearer ${t}`;
  return h;
}

/** ===== FLUJO NUEVO (PreBooking + MP intent) ===== */
export async function createMpDepositIntent(input, tokenMaybe) {
  const {
    professionalId,
    serviceId,
    date,
    time,
    note = "",
    address = "",
    isImmediate = false,
    token,
  } = typeof input === "object" ? input : {};

  const tok = token || tokenMaybe || getToken();

  const res = await fetch(`${BASE}/payments/mp/intent`, {
    method: "POST",
    headers: authHeaders(tok),
    body: JSON.stringify({ professionalId, serviceId, date, time, note, address, isImmediate }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "No se pudo crear la preferencia (intent)");
  return data; // { preBookingId, preferenceId, init_point, sandbox_init_point, amount }
}

/** Reconciliar PreBooking (plan B) */
export async function reconcileMpPre({ preBookingId, token }) {
  const res = await fetch(`${BASE}/payments/mp/reconcile-pre`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ preBookingId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "No se pudo reconciliar prebooking");
  return data;
}

/** ===== FLUJO ANTERIOR (compat Booking ya creado) ===== */
export async function createMpDepositPreference({ bookingId, token }) {
  const res = await fetch(`${BASE}/payments/mp/deposit`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ bookingId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "No se pudo crear la preferencia");
  return data; // { preferenceId, init_point, ... }
}

export async function reconcileMp({ bookingId, token }) {
  const res = await fetch(`${BASE}/payments/mp/reconcile`, {
    method: "POST",
    headers: authHeaders(token),
    body: JSON.stringify({ bookingId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "No se pudo reconciliar");
  return data;
}
