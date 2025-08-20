// /src/lib/socket.js
import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const WS_BASE = (API_BASE || "").replace(/\/api$/, ""); // -> http://localhost:3000

export const socket = io(WS_BASE, {
  transports: ["websocket", "polling"],
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
});

// Helpers para rooms por usuario
export function joinUserRoom(userId) {
  if (!userId) return;
  // evento esperado por el BE: "socket:join" { userId }
  socket.emit("socket:join", { userId });
}

export function leaveUserRoom(userId) {
  if (!userId) return;
  // si implementaste leave en el BE:
  socket.emit("socket:leave", { userId });
}

// logs opcionales en dev
socket.on("connect", () => console.log("✅ socket connected", socket.id));
socket.on("disconnect", (reason) => console.log("🔌 socket disconnected:", reason));