// src/components/ReservationCard.jsx
import React from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const ASSET_BASE = API_BASE.replace(/\/api\/?$/, "");
const absUrl = (u) => (!u ? "" : /^https?:\/\//i.test(u) ? u : u.startsWith("/") ? `${ASSET_BASE}${u}` : `${ASSET_BASE}/${u}`);

function ReservationCard({ user, service, date, status, avatarUrl }) {
  const initial = (user?.[0] || "U").toUpperCase();
  const photo = avatarUrl ? absUrl(avatarUrl) : "";

  return (
    <div className="bg-[#111827] p-4 rounded-lg shadow text-white">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-9 w-9 rounded-full overflow-hidden bg-white/10 grid place-items-center font-bold">
          {photo ? <img src={photo} alt="avatar" className="h-full w-full object-cover" /> : initial}
        </div>
        <h3 className="text-lg font-semibold">{service}</h3>
      </div>
      <p className="text-sm text-gray-300">Cliente: {user}</p>
      <p className="text-sm text-gray-300">Fecha: {date}</p>
      <p
        className={`text-sm font-bold mt-2 ${
          status === "confirmado" ? "text-green-400" : "text-yellow-400"
        }`}
      >
        {status === "confirmado" ? "✅ Confirmado" : "⏳ Pendiente"}
      </p>
    </div>
  );
}

export default ReservationCard;
