import { io } from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const WS_BASE = (API_BASE || "").replace(/\/api$/, "");

export const socket = io(WS_BASE, {
  transports: ["websocket", "polling"],
  withCredentials: true,
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 500,
});

export function joinUserRoom(userId) {
  if (!userId) return;
  // ✅ nombre que espera el BE
  socket.emit("joinUser", userId);
}

// logs dev
socket.on("connect", () => console.log("✅ socket connected", socket.id));
socket.on("disconnect", (reason) =>
  console.log("🔌 socket disconnected:", reason)
);