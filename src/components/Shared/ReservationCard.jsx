// src/components/Shared/ReservationCard.jsx
import React from "react"

function ReservationCard({ user, service, date, status }) {
  return (
    <div className="bg-white text-black p-4 rounded shadow hover:shadow-md transition">
      <h3 className="text-lg font-bold">{user}</h3>
      <p className="text-sm text-gray-700">Servicio: {service}</p>
      <p className="text-sm text-gray-600">Fecha: {date}</p>
      <p className={`text-sm font-semibold mt-2 ${status === "confirmado" ? "text-green-600" : "text-yellow-600"}`}>
        Estado: {status}
      </p>
    </div>
  )
}

export default ReservationCard
