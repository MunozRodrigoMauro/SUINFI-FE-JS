// src/components/chat/ChatPreviewCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const ASSET_BASE = API_BASE.replace(/\/api\/?$/, "");
const absUrl = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : u.startsWith("/") ? `${ASSET_BASE}${u}` : `${ASSET_BASE}/${u}`);

function ChatPreviewCard({ name, lastMessage, time, peerUserId, peerProfessionalId, peerId, avatarUrl }) {
  const navigate = useNavigate();
  const open = () => {
    const id = peerUserId || peerProfessionalId || peerId; // 👈 aceptar alias peerId
    if (id) {
      navigate(`/chats/${id}`);
    }
  };

  const initial = (name?.[0] || "U").toUpperCase();
  const photo = avatarUrl ? absUrl(avatarUrl) : "";

  return (
    <button
      onClick={open}
      className="w-full text-left bg-white text-black p-4 rounded shadow hover:shadow-md transition cursor-pointer"
      title="Abrir chat"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 grid place-items-center font-semibold">
          {photo ? <img src={photo} alt="avatar" className="h-full w-full object-cover" /> : initial}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-lg truncate">{name}</h3>
          <p className="text-sm text-gray-700 truncate">{lastMessage}</p>
          <p className="text-xs text-gray-500 mt-2">{time}</p>
        </div>
      </div>
    </button>
  );
}
export default ChatPreviewCard;
