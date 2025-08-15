import React from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <section className="min-h-screen bg-white text-[#0a0e17] pt-24 pb-20 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Encabezado del panel */}
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold mb-2">👑 Panel de Administración</h1>
          <p className="text-lg text-gray-700">
            Bienvenido, <span className="font-semibold">{user?.name}</span>. Desde aquí podés administrar el sistema.
          </p>
          <div className="mt-4">
            <button
              onClick={() => navigate("/profile")}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition"
            >
              ✏️ Editar mi perfil
            </button>
          </div>
        </div>

        {/* Tarjetas de resumen */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {[
            { title: "Usuarios", desc: "Gestionar usuarios registrados", icon: "👥" },
            { title: "Profesionales", desc: "Revisar perfiles de expertos", icon: "🧰" },
            { title: "Servicios", desc: "Controlar rubros y categorías", icon: "🛠️" },
            { title: "Reportes", desc: "Ver métricas del sistema", icon: "📊" },
            { title: "Pagos", desc: "Supervisar transacciones", icon: "💸" },
            { title: "Notificaciones", desc: "Enviar mensajes o alertas", icon: "🔔" },
          ].map(({ title, desc, icon }, i) => (
            <div key={i} className="bg-[#111827] p-6 rounded shadow hover:shadow-lg transition">
              <h3 className="text-xl text-white font-semibold mb-2">
                {icon} {title}
              </h3>
              <p className="text-gray-400 text-sm">{desc}</p>
            </div>
          ))}
        </div>

        {/* Pie o sección adicional */}
        <div className="text-center mt-12">
          <p className="text-gray-600 text-sm">
            Último acceso: {new Date(user?.lastLogin || Date.now()).toLocaleString()}
          </p>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;