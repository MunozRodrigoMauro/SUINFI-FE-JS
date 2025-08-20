// src/components/chat/ChatPreviewCard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

function ChatPreviewCard({ name, lastMessage, time, peerUserId, peerProfessionalId, peerId }) {
  const navigate = useNavigate();

  const open = () => {
    const id = peerUserId || peerProfessionalId || peerId; // 👈 aceptar alias peerId
    if (id) {
      navigate(`/chats/${id}`);
    }
  };

  return (
    <button
      onClick={open}
      className="w-full text-left bg-white text-black p-4 rounded shadow hover:shadow-md transition cursor-pointer"
      title="Abrir chat"
    >
      <h3 className="font-bold text-lg">{name}</h3>
      <p className="text-sm text-gray-700 truncate">{lastMessage}</p>
      <p className="text-xs text-gray-500 mt-2">{time}</p>
    </button>
  );
}

export default ChatPreviewCard;
