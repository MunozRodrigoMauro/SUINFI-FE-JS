// src/components/booking/BookingCard.jsx
import React from "react";
import BookingStatusBadge from "./BookingStatusBadge";
import { formatDateTime } from "../../utils/datetime";

export default function BookingCard({ booking, role, rightSlot, onOpenChat }) {
  const clientName = booking?.client?.name || booking?.client?.email || "Cliente";
  const proName = booking?.professional?.user?.name || booking?.professional?.user?.email || "Profesional";
  const who = role === "pro" ? clientName : proName;
  const serviceName = booking?.service?.name || "Servicio";
  const when = formatDateTime(booking?.scheduledAt);

  // accesibilidad para Enter/Espacio
  const onKey = (e) => {
    if (!onOpenChat) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenChat();
    }
  };

  return (
    <div
      className={`border rounded-xl p-4 bg-white shadow-sm flex flex-col gap-3 ${
        onOpenChat ? "cursor-pointer hover:shadow-md transition" : ""
      }`}
      onClick={onOpenChat || undefined}
      role={onOpenChat ? "button" : undefined}
      tabIndex={onOpenChat ? 0 : undefined}
      onKeyDown={onOpenChat ? onKey : undefined}
      title={onOpenChat ? "Abrir chat" : undefined}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold leading-5">{who}</h3>
          <p className="text-sm text-gray-600">{serviceName}</p>
          <p className="text-sm text-gray-600">{when}</p>
        </div>
        <BookingStatusBadge status={booking?.status} />
      </div>

      {booking?.note && (
        <p className="text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-lg p-2">{booking.note}</p>
      )}

      <div className="flex justify-end">{rightSlot}</div>
    </div>
  );
}