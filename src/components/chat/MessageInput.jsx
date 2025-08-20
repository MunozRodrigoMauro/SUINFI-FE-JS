import React, { useState } from "react";

export default function MessageInput({ onSend, disabled, onTypingChange }) {
  const [value, setValue] = useState("");

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!value.trim()) return;
      onSend?.(value.trim());
      setValue("");
      onTypingChange?.(false);
    }
  };

  return (
    <div className="border-t p-3 bg-white">
      <textarea
        rows={1}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          onTypingChange?.(!!e.target.value);
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Escribí un mensaje…"
        className="w-full resize-none border rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
      />
      <div className="flex justify-end mt-2">
        <button
          onClick={() => {
            if (!value.trim()) return;
            onSend?.(value.trim());
            setValue("");
            onTypingChange?.(false);
          }}
          disabled={disabled}
          className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black disabled:opacity-60"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
