// src/components/professionals/ServiceCard.jsx
import React from "react"

function ServiceCard({ title, description, icon }) {
  return (
    <div className="bg-[#111827] rounded-lg p-6 shadow hover:shadow-lg transition text-white">
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-400 text-sm">{description}</p>
    </div>
  )
}

export default ServiceCard
