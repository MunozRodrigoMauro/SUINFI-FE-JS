// src/utils/datetime.js
import { format as fmt, parseISO, isValid, isBefore } from "date-fns";
import { es } from "date-fns/locale";

// === Estados legibles (UI) ===
export const STATUS_LABEL = {
  pending: "Pendiente",
  accepted: "Aceptada",
  rejected: "Rechazada",
  completed: "Completada",
  canceled: "Cancelada",
};

// === Acciones permitidas (UI) ===
export const canClientCancel = (status) => ["pending", "accepted"].includes(status);
export const canProComplete = (status) => status === "accepted";

// === Formato legible local (usa zona del navegador) ===
export const formatDateTime = (iso) => {
  if (!iso) return "-";
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  if (!isValid(d)) return "-";
  return fmt(d, "dd/MM/yyyy HH:mm", { locale: es });
};

export const formatDateTimeShort = (iso) => {
  if (!iso) return "-";
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  if (!isValid(d)) return "-";
  return fmt(d, "dd/MM HH:mm", { locale: es });
};

export const isPast = (iso) => {
  if (!iso) return false;
  const d = typeof iso === "string" ? parseISO(iso) : iso;
  if (!isValid(d)) return false;
  return isBefore(d, new Date());
};

// === Parseo de form (date + time) a ISO (local → UTC) ===
// date: "YYYY-MM-DD", time: "HH:mm"
export const dateTimeToISO = ({ date, time }) => {
  if (!date || !time) return null;
  // Interpreta la fecha-hora en la zona local del navegador
  const local = new Date(`${date}T${time}:00`);
  if (!isValid(local)) return null;
  // Normaliza a UTC ISO
  return new Date(local.getTime()).toISOString();
};
