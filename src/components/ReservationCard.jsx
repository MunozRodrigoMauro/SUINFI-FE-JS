import React from "react"

function ReservationCard({ user, service, date, status }) {
  return (
    <div className="bg-[#111827] p-4 rounded-lg shadow text-white">
      <h3 className="text-lg font-semibold mb-1">{service}</h3>
      <p className="text-sm text-gray-300">Cliente: {user}</p>
      <p className="text-sm text-gray-300">Fecha: {date}</p>
      <p className={`text-sm font-bold mt-2 ${
        status === "confirmado" ? "text-green-400" : "text-yellow-400"
      }`}>
        {status === "confirmado" ? "✅ Confirmado" : "⏳ Pendiente"}
      </p>
    </div>
  )
}

export default ReservationCard
