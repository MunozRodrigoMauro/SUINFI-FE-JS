// src/components/Shared/ChatPreviewCard.jsx
import React from "react"

function ChatPreviewCard({ name, lastMessage, time }) {
  return (
    <div className="bg-white text-black p-4 rounded shadow hover:shadow-md transition">
      <h3 className="font-bold text-lg">{name}</h3>
      <p className="text-sm text-gray-700 truncate">{lastMessage}</p>
      <p className="text-xs text-gray-500 mt-2">{time}</p>
    </div>
  )
}

export default ChatPreviewCard
