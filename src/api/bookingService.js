import axiosUser from "./axiosUser";
const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
import { dateTimeToISO } from "../utils/datetime";

// helper local: arma ISO con zona local del usuario
// const dateTimeToISO = (date, time) => {
//   // date: "YYYY-MM-DD", time: "HH:mm"
//   const [y, m, d] = date.split("-").map(Number);
//   const [hh, mm]  = time.split(":").map(Number);
//   const local = new Date(y, (m - 1), d, hh, mm, 0);
//   return new Date(local.getTime() - local.getTimezoneOffset() * 60000).toISOString();
// };

// Mapea errores del BE a mensajes de UX
function friendlyBookingMessage(status, serverMsg = "", details = {}) {
  const raw = String(serverMsg || "").toLowerCase().trim();

  // 🎯 Distinguimos conflictos 409 por contenido del mensaje
  if (status === 409) {
    // requiere seña → ir al checkout
    if (raw.includes("requiere seña") || raw.includes("checkout")) {
      return "Este profesional requiere seña. Iniciá la reserva desde el checkout.";
    }
    // horario ocupado
    if (raw.includes("horario ya no está disponible") || raw.includes("horario") && raw.includes("disponible")) {
      return "Ese horario ya no está disponible. Probá con otro turno.";
    }
    // reserva ya pendiente con el mismo profesional (guardrail)
    if (raw.includes("ya tenés una reserva pendiente")) {
      return "Tenés una reserva pendiente con este profesional. Cancelala desde “Reservas” y volvé a intentarlo.";
    }
    // fallback 409 (mantener mensaje claro)
    return serverMsg || "No se pudo crear la reserva por un conflicto. Intentá con otro turno.";
  }

  if (status === 404) {
    return "No encontramos el profesional o servicio. Actualizá la página e intentá nuevamente.";
  }
  if (status === 400) {
    return serverMsg || "Los datos de la reserva no son válidos.";
  }
  if (status === 422) {
    const fieldErr =
      typeof details?.errors === "object"
        ? Object.values(details.errors)[0]
        : null;
    return fieldErr || serverMsg || "Revisá los datos ingresados.";
  }
  if (status >= 500) {
    return "Tuvimos un problema en el servidor. Intentá más tarde.";
  }
  return serverMsg || "No se pudo crear la reserva.";
}

// ⬇️ Para flujo “sin seña”: mantiene tu POST directo a /bookings.
//    Compat extra: si llega date+time y no scheduledAt, lo calculo (sin romper el BE).
export async function createBooking(payload) {
  try {
    const body = { ...payload };
    if (!body.scheduledAt && body.date && body.time) {
      body.scheduledAt = dateTimeToISO({ date: body.date, time: body.time });
    }
    const { data } = await axiosUser.post(`${API}/bookings`, body);
    return data;
  } catch (err) {
    const status = err?.response?.status ?? 0;
    const body = err?.response?.data ?? {};
    const serverMsg = body?.error || body?.message || "";
    const userMsg = friendlyBookingMessage(status, serverMsg, body);

    const e = new Error(userMsg);
    e.status = status;
    e.details = body;
    throw e;
  }
}

export const getMyBookings = async (params = {}) => {
  const { data } = await axiosUser.get(`${API}/bookings/mine`, { params });
  return data;
};

export const getBookingsForMe = async (params = {}) => {
  const { data } = await axiosUser.get(`${API}/bookings/for-me`, { params });
  return data;
};

// ⬇️ ahora acepta nota opcional sin romper llamadas existentes
export const updateBookingStatus = async (id, status, extra = {}) => {
  const body = { status };
  if (extra && typeof extra.note === "string" && extra.note.trim()) {
    const t = extra.note.trim();
    body.note = t;          // compat actual
    body.cancelNote = t;    // compat con BE que espera cancelNote
  }
  const { data } = await axiosUser.patch(`${API}/bookings/${id}`, body);
  return data;
};

// Exporto por si lo querés usar en otros lados
export { dateTimeToISO };
