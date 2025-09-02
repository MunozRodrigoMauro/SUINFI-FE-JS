import React, { useEffect, useRef, useState } from "react";

export default function CancelBookingModal({ open, onClose, onConfirm }) {
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const confirm = async () => {
    setSending(true);
    try {
      await onConfirm?.(reason.trim());
      setReason("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      aria-modal="true"
      role="dialog"
      onClick={onClose} // clic en backdrop cierra
    >
      <div className="absolute inset-0 bg-black/40" />

      <div
        ref={panelRef}
        className="relative z-[71] w-[min(92vw,520px)] rounded-2xl bg-white shadow-xl border p-5"
        onClick={(e) => {
          // IMPORTANTÍSIMO: no dejar que el click burbujee al card/chat
          e.stopPropagation();
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-semibold">Anular reserva</h3>
          <button
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          ¿Querés cancelar esta reserva? Podés indicar un motivo (opcional) para que el profesional esté al tanto.
        </p>

        <label className="block text-sm text-gray-700 mb-1">Motivo (opcional)</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 mb-4"
          placeholder="Ej.: No voy a estar en casa en ese horario…"
        />

        <div className="flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            Volver
          </button>
          <button
            onClick={confirm}
            disabled={sending}
            className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
          >
            {sending ? "Anulando…" : "Anular reserva"}
          </button>
        </div>
      </div>
    </div>
  );
}
