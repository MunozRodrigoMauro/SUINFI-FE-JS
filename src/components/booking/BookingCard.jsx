// src/components/booking/BookingCard.jsx
import React from "react";
import BookingStatusBadge from "./BookingStatusBadge";
import { formatDateTime } from "../../utils/datetime";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const ASSET_BASE = API_BASE.replace(/\/api\/?$/, "");
const absUrl = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : u.startsWith("/") ? `${ASSET_BASE}${u}` : `${ASSET_BASE}/${u}`);

export default function BookingCard({ booking, role, rightSlot, onOpenChat }) {
  const clientUser = booking?.client || booking?.client?.user || null;
  const proUser = booking?.professional?.user || null;

  const clientName = clientUser?.name || clientUser?.email || "Cliente";
  const proName = proUser?.name || proUser?.email || "Profesional";
  const who = role === "pro" ? clientName : proName;

  const whoAvatar = role === "pro" ? clientUser?.avatarUrl : proUser?.avatarUrl;
  const avatarUrl = whoAvatar ? absUrl(whoAvatar) : "";
  const initial = (who?.[0] || "U").toUpperCase();

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
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 grid place-items-center font-semibold">
            {avatarUrl ? <img src={avatarUrl} alt="avatar" className="h-full w-full object-cover" /> : initial}
          </div>
          <div>
            <h3 className="font-semibold leading-5">{who}</h3>
            <p className="text-sm text-gray-600">{serviceName}</p>
            <p className="text-sm text-gray-600">{when}</p>
          </div>
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
