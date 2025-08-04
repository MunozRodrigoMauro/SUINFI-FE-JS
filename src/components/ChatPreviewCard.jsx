import React from "react"

function ChatPreviewCard({ name, lastMessage, time }) {
  return (
    <div className="bg-[#111827] p-4 rounded-lg shadow text-white">
      <h3 className="text-lg font-semibold mb-1">{name}</h3>
      <p className="text-sm text-gray-300 italic mb-1">"{lastMessage}"</p>
      <p className="text-xs text-gray-500">{time}</p>
    </div>
  )
}

export default ChatPreviewCard
