import React, { useState } from "react";

export default function ChatComposer({ onSend, onTyping }) {
  const [val, setVal] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const v = val.trim();
    if (!v) return;
    onSend?.(v);
    setVal("");
  };

  return (
    <form onSubmit={submit} className="flex items-center gap-2 px-3 py-2">
      <input
        value={val}
        onChange={(e) => {
          setVal(e.target.value);
          onTyping?.();
        }}
        className="flex-1 border rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-amber-400"
        placeholder="Escribí un mensaje…"
      />
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black"
      >
        Enviar
      </button>
    </form>
  );
}