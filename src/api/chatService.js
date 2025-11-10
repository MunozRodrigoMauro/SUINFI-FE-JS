// src/api/chatService.js
import axiosUser from "../api/axiosUser";
const API = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// CHANGES: nuevo helper para indicar "escribiendo..."
export async function setTyping(chatId, isTyping) {
  try {
    await axiosUser.post(`${API}/chats/${chatId}/typing`, { isTyping: !!isTyping });
  } catch {
    // silencioso (no crítico)
  }
}

export async function fetchMyChats(limit = 4) {
  try {
    const { data } = await axiosUser.get(`${API}/chats`);
    const arr = Array.isArray(data) ? data : [];
    return arr.slice(0, limit);
  } catch {
    return [];
  }
}

export async function getOrCreateWith(otherUserId) {
  const { data } = await axiosUser.get(`${API}/chats/with/${otherUserId}`);
  return data; // { chat, messages, otherUser }
}

export async function sendText(chatId, text) {
  const { data } = await axiosUser.post(`${API}/chats/${chatId}/messages`, { text });
  return data?.message;
}

export async function listMessages(chatId, params = {}) {
  const { data } = await axiosUser.get(`${API}/chats/${chatId}/messages`, { params });
  return Array.isArray(data) ? data : [];
}

// [ADD-READ] marcar como leído todos los mensajes entrantes del chat
export async function markRead(chatId) {
  if (!chatId) return;
  try {
    await axiosUser.post(`${API}/chats/${chatId}/read`);
  } catch {
    // silencioso; si falla no rompemos el flujo
  }
}
