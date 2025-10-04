import React from "react";

export default function RedeemModal({ open, reward, missing = 0, onConfirm, onClose, loading }) {
  if (!open) return null;
  const canRedeem = missing <= 0;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-gradient-to-r from-[#0a0e17] to-[#111827] text-white p-5">
          <h3 className="text-lg font-bold">Confirmar canje</h3>
          <p className="text-sm mt-1 opacity-80">
            {reward?.title} · {reward?.pointsCost} pts
            {reward?.partnerId?.name ? ` — ${reward.partnerId.name}` : ""}
          </p>
        </div>
        <div className="bg-base-100 p-5">
          {canRedeem ? (
            <p className="text-sm">Se descontarán <b>{reward.pointsCost} pts</b> de tu saldo.</p>
          ) : (
            <p className="text-sm">Te faltan <b>{missing}</b> pts para canjear este beneficio.</p>
          )}
          <div className="mt-5 flex gap-3">
            <button className="flex-1 border rounded px-4 py-2 hover:bg-base-200 transition" onClick={onClose}>
              Cancelar
            </button>
            <button
              className={`flex-1 rounded px-4 py-2 font-semibold transition ${
                canRedeem ? "bg-[#0a0e17] text-white hover:bg-gray-800" : "bg-gray-200 text-gray-500"
              }`}
              disabled={!canRedeem || loading}
              onClick={onConfirm}
            >
              {loading ? "Canjeando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
