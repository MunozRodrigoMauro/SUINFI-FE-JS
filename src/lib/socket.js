// src/lib/socket.js
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const WS_BASE = (API_BASE || "").replace(/\/api$/, "");

// [CHANGES] util local para leer token en cada reconexión
function getToken() {
  try {
    return (
      localStorage.getItem("auth_token") ||
      sessionStorage.getItem("auth_token") ||
      localStorage.getItem("token") ||
      ""
    );
  } catch {
    return "";
  }
}

export const socket = io(WS_BASE, {
  transports: ["websocket", "polling"],
  withCredentials: true,
  autoConnect: false,          // dejamos manual
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
  reconnectionDelayMax: 4000,  // [CHANGES]
  timeout: 15000,              // [CHANGES]
});

export function connectSocket() {
  if (!socket.connected) socket.connect();
}
export function disconnectSocket() {
  stopActivityTracking();
  if (socket.connected) socket.disconnect();
}

// [CHANGES] guardamos último join para re-suscribir al reconectar
let lastJoin = null;

/**
 * Pedí unirte a la "room" del usuario en el backend.
 * @param {string} userId
 * @param {string} token
 */
export function joinUserRoom(userId, token) {
  if (!userId) return;
  connectSocket();
  lastJoin = { userId, token: token || getToken() }; // [CHANGES]
  socket.emit("joinUser", lastJoin);                  // el BE valida token/userId
}

// -------- Heartbeat basado en actividad + keepalive --------
let bound = false;
let lastBeat = 0;
// [CHANGES] keepalive pasivo (cada 25s) para evitar idle timeouts
let keepAliveId = null;

export function beat(now = Date.now()) {
  if (!socket.connected) return;
  if (now - lastBeat < 1000) return; // throttle 5s
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

  // [CHANGES] keepalive cada 25s aunque no haya interacción
  if (!keepAliveId) {
    keepAliveId = setInterval(() => beat(), 5000);
  }
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
  // [CHANGES] apagar keepalive
  if (keepAliveId) {
    clearInterval(keepAliveId);
    keepAliveId = null;
  }
}

// logs dev
socket.on("connect", () => {
  console.log("✅ socket connected", socket.id);
  // [CHANGES] rejoin automático con credenciales frescas
  if (lastJoin?.userId) {
    const payload = { userId: lastJoin.userId, token: getToken() || lastJoin.token || "" };
    socket.emit("joinUser", payload);
  }
});

socket.on("disconnect", (r) => console.log("🔌 socket disconnected:", r));

// [CHANGES] visibilidad sobre errores para diagnosticar “deja de escuchar”
socket.on("connect_error", (err) => {
  console.warn("⚠️ socket connect_error:", err?.message || err);
});
socket.on("reconnect_attempt", (n) => {
  console.log("🔄 socket reconnect_attempt:", n);
});
socket.on("reconnect", (n) => {
  console.log("🔄 socket reconnected:", n);
});
