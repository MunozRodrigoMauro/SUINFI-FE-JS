import React from "react";

export default function MessageBubble({ mine, text, at }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"} my-1`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow
        ${mine ? "bg-[#111827] text-white" : "bg-gray-100 text-gray-900"}`}>
        <div className="whitespace-pre-wrap break-words">{text}</div>
        {at && (
          <div className={`text-[10px] mt-1 ${mine ? "text-gray-300" : "text-gray-500"}`}>
            {new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          </div>
        )}
      </div>
    </div>
  );
}
