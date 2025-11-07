// src/components/booking/BookingModal.jsx
import React, { useState } from "react";

export default function BookingModal({ open, onClose, professional, services = [], onConfirm }) {
  const [serviceId, setServiceId] = useState("");
  const [date, setDate] = useState("");    // yyyy-mm-dd
  const [time, setTime] = useState("");    // HH:mm
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const disabled = !serviceId || !date || !time || saving;

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const dateISO = new Date(`${date}T${time}:00`).toISOString();
      await onConfirm({
        professionalId: professional?._id,
        serviceId,
        dateISO,
        note: note.trim(),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold">Reservar con {professional?.user?.name || "Profesional"}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-black">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Servicio</label>
            <select
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            >
              <option value="">Seleccioná…</option>
              {(services || []).map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Hora</label>
              <input
                type="time"
                step="60"                // ← permite elegir cualquier minuto
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">Nota (opcional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full border rounded-lg px-3 py-2"
              placeholder="Detalles del trabajo…"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={disabled}
              className={`px-4 py-2 rounded-lg text-white ${disabled ? "bg-gray-400" : "bg-[#0a0e17] hover:bg-black"}`}
            >
              {saving ? "Guardando…" : "Confirmar reserva"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}