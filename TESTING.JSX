import React from "react"
import { useAuth } from "../context/AuthContext"
import ReservationCard from "../components/ReservationCard"
import ChatPreviewCard from "../components/ChatPreviewCard"

function UserDashboard() {
  const { user } = useAuth()

  return (
    <section className="min-h-screen bg-gradient-to-b from-[#0a0e17] to-[#0a0e17] text-white py-20 px-4">
      <div className="max-w-6xl mx-auto">

        {/* ✅ Bienvenida */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">🎯 Panel del Cliente</h1>
          <p className="text-lg text-gray-300">
            Bienvenido,{" "}
            <span className="text-white font-semibold">{user?.email?.split("@")[0]}</span>. <br />
            Acá podés buscar profesionales, ver tus reservas, chatear y gestionar tus pagos.
          </p>
        </div>

        {/* ✅ Filtros inteligentes */}
        <div className="bg-[#111827] rounded-lg p-6 mb-12 shadow-md">
          <div className="grid md:grid-cols-3 gap-4">
            <input className="w-full px-4 py-2 rounded bg-white text-black placeholder-gray-600" placeholder="🔍 Rubro..." />
            <input className="w-full px-4 py-2 rounded bg-white text-black placeholder-gray-600" placeholder="📍 Zona..." />
            <select className="w-full px-4 py-2 rounded bg-white text-black">
              <option>📆 Disponibilidad</option>
              <option>Mañana</option>
              <option>Tarde</option>
              <option>Noche</option>
            </select>
          </div>
        </div>

        {/* ✅ Acciones rápidas */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {[
            {
              icon: "🔍",
              title: "Buscar expertos",
              desc: "Filtrá por categoría, ubicación o disponibilidad.",
            },
            {
              icon: "📅",
              title: "Mis reservas",
              desc: "Revisá tus próximos servicios contratados.",
            },
            {
              icon: "💬",
              title: "Chat en tiempo real",
              desc: "Contactá con el profesional antes de confirmar.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="bg-[#111827] rounded-lg p-6 shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold mb-2">
                {item.icon} {item.title}
              </h3>
              <p className="text-gray-400 text-sm">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* ✅ Profesionales recomendados */}
        <h2 className="text-2xl font-semibold mb-6">Profesionales recomendados</h2>
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {[1, 2, 3].map((_, idx) => (
            <div
              key={idx}
              className="bg-white text-black p-4 rounded shadow hover:shadow-md transition"
            >
              <h3 className="text-lg font-bold">Juan Pérez</h3>
              <p className="text-sm text-gray-700">Electricista - Palermo</p>
              <p className="text-sm text-yellow-500 mt-2">⭐ 4.9 (102 opiniones)</p>
              <button className="mt-4 bg-[#0a0e17] text-white px-4 py-2 rounded hover:bg-gray-800 transition">
                Ver perfil
              </button>
            </div>
          ))}
        </div>

        {/* ✅ Vista previa de reservas */}
        <div className="text-left mb-16">
          <h2 className="text-2xl font-bold mb-4">📋 Reservas recientes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ReservationCard
              user="Juan García"
              service="Electricista"
              date="2025-08-15"
              status="confirmado"
            />
            <ReservationCard
              user="Carla Pérez"
              service="Plomero"
              date="2025-08-10"
              status="pendiente"
            />
          </div>
        </div>

        {/* ✅ Vista previa de chats */}
        <div className="text-left">
          <h2 className="text-2xl font-bold mb-4">💬 Chats recientes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ChatPreviewCard
              name="Marcelo López"
              lastMessage="¿En qué horario estarías disponible?"
              time="hace 1 hora"
            />
            <ChatPreviewCard
              name="Lautaro Peña"
              lastMessage="Perfecto, te agendo para mañana."
              time="hace 3 horas"
            />
          </div>
        </div>

      </div>
    </section>
  )
}

export default UserDashboard
