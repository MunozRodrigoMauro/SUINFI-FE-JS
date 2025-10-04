import React from "react";

export default function VoucherCard({ code, status }) {
  const copy = async () => {
    try { await navigator.clipboard.writeText(code); } catch {}
  };

  return (
    <div className="rounded-2xl p-6 bg-gradient-to-r from-[#0a0e17] to-[#111827] text-white">
      <div className="text-sm opacity-80">Código de canje</div>
      <div className="mt-1 text-3xl md:text-4xl font-mono font-extrabold tracking-widest">{code}</div>
      <div className="mt-2 inline-flex px-2.5 py-1 rounded bg-white/10 text-xs">{status}</div>
      <div className="mt-4 flex gap-2">
        <button onClick={copy} className="px-4 py-2 rounded bg-white text-[#0a0e17] font-semibold hover:bg-gray-100">
          Copiar
        </button>
        <div className="text-xs opacity-70 self-center">Presentalo en el comercio adherido.</div>
      </div>
    </div>
  );
}
