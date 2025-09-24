// src/components/booking/BookingCard.jsx
import React, { useMemo, useState } from "react";
import BookingStatusBadge from "./BookingStatusBadge";
import { formatDateTime } from "../../utils/datetime";
import { useAuth } from "../../auth/AuthContext";
import ReportModal from "../reports/ReportModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const ASSET_BASE = API_BASE.replace(/\/api\/?$/, "");
const absUrl = (u) =>
  !u ? "" : /^https?:\/\//i.test(u) ? u : u.startsWith("/") ? `${ASSET_BASE}${u}` : `${ASSET_BASE}/${u}`;

export default function BookingCard({ booking, role, rightSlot, onOpenChat }) {
  const { user } = useAuth();
  const [openReport, setOpenReport] = useState(false);

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

  // IDs posibles según cómo venga el populate
  const clientUserId = typeof booking?.client === "object" ? booking?.client?._id : booking?.client || null;
  const proUserId =
    (booking?.professional?.user && typeof booking.professional.user === "object"
      ? booking.professional.user._id
      : booking?.professional?.user) || null;

  const meId = user?._id || user?.id || null;

  // lógica de denuncia
  const isCompleted = booking?.status === "completed";

  // si el rol es profesional y no viene populado pro.user, igual permitimos denunciar al cliente
  const amClient = meId && clientUserId && String(meId) === String(clientUserId);
  const amPro =
    meId &&
    ((proUserId && String(meId) === String(proUserId)) ||
      (role === "pro" && !proUserId)); // fallback por rol si no hay populate

  const targetUser = useMemo(() => {
    if (amClient && (proUserId || proName)) {
      return { _id: proUserId || "", name: proName || "Profesional" };
    }
    if (amPro && clientUserId) {
      return { _id: String(clientUserId), name: clientName || "Cliente" };
    }
    return null;
  }, [amClient, amPro, proUserId, clientUserId, proName, clientName]);

  // si no tenemos _id del target (por falta de populate al pro), igualmente mostramos el botón y el BE validará
  const canReport = isCompleted && (amClient || amPro);

  const handleCardClick = () => {
    if (openReport) return; // bloquea abrir chat si el modal está abierto
    if (onOpenChat) onOpenChat();
  };

  const onKey = (e) => {
    if (!onOpenChat || openReport) return;
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
      onClick={onOpenChat ? handleCardClick : undefined}
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

      <div className="flex gap-2 justify-end mt-2">
        {canReport && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpenReport(true);
            }}
            className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50"
          >
            Reportar usuario
          </button>
        )}
      </div>

      {openReport && (
        <ReportModal
          open={openReport}
          onClose={() => setOpenReport(false)}
          booking={booking}
          targetUser={targetUser}
          onSaved={() => {}}
        />
      )}
    </div>
  );
}
