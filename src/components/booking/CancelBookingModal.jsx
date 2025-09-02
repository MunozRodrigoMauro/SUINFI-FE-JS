// CancelBookingModal.jsx
import React, { useEffect, useRef, useState } from "react";

export default function CancelBookingModal({ open, onClose, onConfirm }) {
  const MAX = 140;
  const [reason, setReason] = useState("");
  const [sending, setSending] = useState(false);
  const panelRef = useRef(null);
  const textareaRef = useRef(null);

  // Esc para cerrar
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // Foco inicial en el textarea
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 0);
    }
  }, [open]);

  if (!open) return null;

  const onChangeReason = (e) => {
    const v = (e.target.value || "").slice(0, MAX);
    setReason(v);
  };

  const confirm = async () => {
    if (sending) return;
    setSending(true);
    try {
      await onConfirm?.(reason.trim());
      setReason("");
    } finally {
      setSending(false);
    }
  };

  const remaining = MAX - reason.length;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop: solo este cierra al click */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel: bloquea burbujeo de click y mousedown (para que no cierre) */}
      <div
        ref={panelRef}
        className="relative z-[71] w-[min(92vw,560px)] rounded-2xl bg-white shadow-xl border p-5 select-none"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="text-lg font-semibold">Anular reserva</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-sm text-gray-500 hover:text-gray-700 cursor-pointer select-none"
            title="Cerrar"
            aria-label="Cerrar"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 mb-3">
          ¿Querés cancelar esta reserva? Podés indicar un motivo (opcional) para
          que el profesional esté al tanto.
        </p>

        <label className="block text-sm text-gray-700 mb-1 select-none">
          Motivo (opcional)
        </label>

        <textarea
          ref={textareaRef}
          value={reason}
          onChange={onChangeReason}
          onKeyDown={(e) => {
            // Evita que hotkeys globales (chat, etc.) capturen las teclas
            e.stopPropagation();
          }}
          rows={3}
          className="w-full border rounded-lg px-3 py-2 mb-1 outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 select-text"
          placeholder="Ej.: No voy a estar en casa en ese horario…"
        />

        <div className="text-xs text-gray-400 mb-4">{remaining}/140</div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:opacity-60 cursor-pointer select-none"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={sending}
            className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60 cursor-pointer select-none"
          >
            {sending ? "Anulando…" : "Anular reserva"}
          </button>
        </div>
      </div>
    </div>
  );
}
