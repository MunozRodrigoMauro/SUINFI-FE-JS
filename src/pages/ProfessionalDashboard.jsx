import React from "react";
import { useAuth } from "../context/AuthContext";
import ReservationCard from "../components/ReservationCard";
import ChatPreviewCard from "../components/ChatPreviewCard";

function ProfessionalDashboard() {
  const { user } = useAuth();

  return (
    <section className="min-h-screen bg-white text-[#0a0e17] py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">🔧 Panel del Profesional</h1>
          <p className="text-lg text-gray-700">
            Hola, <span className="text-[#0a0e17] font-semibold">{user?.email?.split("@")[0]}</span>. Gestioná tus servicios y reservas desde acá.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {["Reservas", "Mensajes", "Servicios ofrecidos", "Solicitudes", "Agenda", "Cobros"].map((title, i) => (
            <div key={i} className="bg-[#111827] p-6 rounded shadow hover:shadow-lg transition">
              <h3 className="text-xl text-white font-semibold mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">Descripción de {title.toLowerCase()}.</p>
            </div>
          ))}
        </div>

        <div className="text-left mb-12">
          <h2 className="text-2xl font-bold mb-4">📋 Próximas reservas</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ReservationCard client="Rodrigo Fernández" service="Gasista matriculado" date="2025-08-05" status="confirmado" />
            <ReservationCard client="Elena Sánchez" service="Electricista" date="2025-08-09" status="pendiente" />
          </div>
        </div>

        <div className="text-left">
          <h2 className="text-2xl font-bold mb-4">💬 Chats recientes</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <ChatPreviewCard name="Mariano Duarte" lastMessage="¿Cuánto cuesta una revisión de gas?" time="hace 2 horas" />
            <ChatPreviewCard name="Laura Ledesma" lastMessage="¡Gracias! Nos vemos el sábado." time="hace 4 horas" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfessionalDashboard;