// src/components/reports/ReportModal.jsx
import React, { useMemo, useState } from "react";
import { createReport } from "../../api/reportService";

const SUPPORT_WA = import.meta.env.VITE_SUPPORT_WA || "5491112345678";

const reasonOptions = [
  ["fraud", "Fraude / estafa"],
  ["abuse", "Maltrato / abuso"],
  ["unsafe", "Inseguridad"],
  ["no_show", "No se presentó"],
  ["payment_issue", "Problema de pago"],
  ["other", "Otro"],
];

const digitsOnly = (v = "") => String(v).replace(/[^\d]/g, "");

export default function ReportModal({ open, onClose, booking, targetUser, onSaved }) {
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const reasonLabel = useMemo(
    () => (reasonOptions.find(([val]) => val === reason)?.[1] || ""),
    [reason]
  );

  if (!open) return null;

  const bookingIdFull = String(booking?._id || "");
  const shortId = bookingIdFull.slice(-6);  

  const buildWhatsappUrl = () => {
    const phone = digitsOnly(SUPPORT_WA);
    const who = targetUser?.name || "usuario";
    const lines = [
        `Hola, quiero reportar una cuenta en CuyIT:`,
        `• Booking: #${shortId}`,
        `• Booking ID: ${bookingIdFull}`,
        `• Denunciado: ${who}`,
        `• Motivo: ${reasonLabel || "(sin seleccionar)"}`,
        details?.trim() ? `• Detalles: ${details.trim()}` : null,
      ].filter(Boolean);      
    const text = encodeURIComponent(lines.join("\n"));
    return `https://wa.me/${phone}?text=${text}`;
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!booking?._id) return setMsg("Falta bookingId.");
    if (!reason) return setMsg("Elegí un motivo.");
    try {
      setSaving(true);
      await createReport({
        bookingId: booking._id,
        targetUserId: targetUser?._id || "", // si falta por populate, el BE valida igualmente
        reason,
        details: details.trim(),
      });
      onSaved?.();
      const url = buildWhatsappUrl();
      window.open(url, "_blank", "noopener,noreferrer");
      onClose?.();
    } catch (e) {
      const err = e?.response?.data?.message || "No se pudo enviar la denuncia";
      setMsg(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal>
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reportar cuenta</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <form onSubmit={submit} className="p-5 space-y-4">
          {msg && (
            <div className="text-sm bg-rose-50 border border-rose-200 text-rose-700 px-3 py-2 rounded-lg">
              {msg}
            </div>
          )}

          <div className="text-sm text-gray-600">
            Estás denunciando a <span className="font-medium">{targetUser?.name || "este usuario"}</span> por un problema en
            la reserva <span className="font-mono">#{shortId}</span>.
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Motivo</label>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {reasonOptions.map(([val, label]) => (
                <label
                  key={val}
                  className={`border rounded-lg px-3 py-2 cursor-pointer ${
                    reason === val ? "ring-2 ring-black" : "hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="reason"
                    value={val}
                    className="mr-2"
                    checked={reason === val}
                    onChange={() => setReason(val)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Detalles (opcional)</label>
            <textarea
              rows={4}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 resize-none"
              placeholder="Contanos qué pasó…"
              maxLength={800}
            />
            <div className="text-xs text-gray-500 text-right">{details.length}/800</div>
          </div>

          <div className="flex items-center justify-between">
            <a
              href={buildWhatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm underline"
              onClick={(e) => e.stopPropagation()}
            >
              Chatear con soporte por WhatsApp
            </a>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border hover:bg-gray-50">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving || !reason}
                className={`px-4 py-2 rounded-lg text-white ${
                  saving || !reason ? "bg-gray-400 cursor-not-allowed" : "bg-[#0a0e17] hover:bg-black/80"
                }`}
              >
                {saving ? "Enviando…" : "Enviar"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
