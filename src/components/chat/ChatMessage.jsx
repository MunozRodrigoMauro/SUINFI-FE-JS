import React from "react";

export default function ChatMessage({ isMe, text, at }) {
  const time = at ? new Date(at).toLocaleTimeString() : "";
  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow
        ${isMe ? "bg-amber-500 text-white" : "bg-white border"}`}>
        <div>{text}</div>
        <div className={`text-[10px] mt-1 ${isMe ? "text-amber-100" : "text-gray-500"}`}>{time}</div>
      </div>
    </div>
  );
}