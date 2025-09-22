// src/lib/socket.js
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const WS_BASE = (API_BASE || "").replace(/\/api$/, "");

export const socket = io(WS_BASE, {
  transports: ["websocket", "polling"],
  withCredentials: true,
  autoConnect: false,          // << no autoconectar
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
});

export function connectSocket() {
  if (!socket.connected) socket.connect();
}
export function disconnectSocket() {
  stopActivityTracking();
  if (socket.connected) socket.disconnect();
}

export function joinUserRoom(userId, token) {
  if (!userId) return;
  connectSocket();
  socket.emit("joinUser", { userId, token }); // el BE valida token/userId
}

// -------- Heartbeat basado en actividad (no intervalo) --------
let bound = false;
let lastBeat = 0;

export function beat(now = Date.now()) {
  if (!socket.connected) return;
  if (now - lastBeat < 5000) return; // throttle 5s
  lastBeat = now;
  socket.emit("heartbeat");
}

// listeners de actividad
function onAnyActivity() {
  beat();
}
function onVisibility() {
  if (document.visibilityState === "visible") beat();
}
function onFocus() {
  beat();
}

export function startActivityTracking() {
  if (bound) return;
  bound = true;
  window.addEventListener("click", onAnyActivity, { passive: true });
  window.addEventListener("keydown", onAnyActivity, { passive: true });
  window.addEventListener("mousemove", onAnyActivity, { passive: true });
  window.addEventListener("scroll", onAnyActivity, { passive: true });
  window.addEventListener("focus", onFocus, { passive: true });
  document.addEventListener("visibilitychange", onVisibility);
  // primer beat al iniciar
  beat();
}

export function stopActivityTracking() {
  if (!bound) return;
  bound = false;
  window.removeEventListener("click", onAnyActivity);
  window.removeEventListener("keydown", onAnyActivity);
  window.removeEventListener("mousemove", onAnyActivity);
  window.removeEventListener("scroll", onAnyActivity);
  window.removeEventListener("focus", onFocus);
  document.removeEventListener("visibilitychange", onVisibility);
}

// logs dev
socket.on("connect", () => console.log("✅ socket connected", socket.id));
socket.on("disconnect", (r) => console.log("🔌 socket disconnected:", r));
