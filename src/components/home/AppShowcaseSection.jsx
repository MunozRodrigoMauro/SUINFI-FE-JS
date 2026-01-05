// src/components/home/AppShowcaseSection.jsx

import React from "react";

import { motion } from "framer-motion";

import {
  LuZap,          // Electricidad / Urgencia
  LuBriefcase,    // Profesionales (Contadores, Abogados)
  LuWrench,       // Mantenimiento / Mecánica
  LuStethoscope,  // Salud / Cuidado
  LuMonitor,      // Tecnología / Diseño
  LuCheck,        // Reemplazo de LuCheckCircle2
  LuBadgeCheck,   // Reemplazo para verificados
  LuSmartphone    // Icono general
} from "react-icons/lu";

/* ⭐ SEO CONFIG:
   Ampliamos el abanico. Google leerá que NO somos solo plomeros.
   Somos una red profesional completa.
*/
const services = [
  {
    id: "urgent",
    icon: <LuZap className="w-6 h-6" />,
    title: "Urgencias & Hogar",
    desc: "Gasistas, plomeros y electricistas. Llegan en minutos.",
    color: "bg-amber-500"
  },
  {
    id: "auto",
    icon: <LuWrench className="w-6 h-6" />,
    title: "Mecánica & Auxilio",
    desc: "¿Te quedaste en la ruta? Mecánicos y grúas geolocalizados.",
    color: "bg-red-500"
  },
  {
    id: "pro",
    icon: <LuBriefcase className="w-6 h-6" />,
    title: "Servicios Profesionales",
    desc: "Contadores, abogados, gestores y consultores on-demand.",
    color: "bg-blue-600"
  },
  {
    id: "tech",
    icon: <LuMonitor className="w-6 h-6" />,
    title: "Tecnología & Diseño",
    desc: "Programadores, diseñadores gráficos y soporte IT remoto.",
    color: "bg-purple-500"
  },
  {
    id: "care",
    icon: <LuStethoscope className="w-6 h-6" />,
    title: "Salud & Cuidado",
    desc: "Enfermería, acompañantes terapéuticos y cuidadores.",
    color: "bg-emerald-500"
  },
];

function AppShowcaseSection() {
  return (
    <section className="relative py-24 overflow-hidden bg-gradient-to-b from-[#0a0e17] via-[#0f172a] to-[#111827]">
      {/* Fondo decorativo con gradientes (Look 'Tech/Dark Mode') */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] bg-emerald-600/20 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-teal-600/20 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
       
        {/* ============ COLUMNA IZQ: TEXTO SEO Y CATEGORÍAS ============ */}
        <div className="flex-1 text-left order-2 lg:order-1">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 py-1 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-sm tracking-wider mb-4">
              <LuSmartphone /> DISPONIBLE EN IOS Y ANDROID
            </span>
           
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-6 leading-tight">
              Más que servicios del hogar. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                Cualquier profesión, en tiempo real.
              </span>
            </h2>
           
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              CuyIT es la evolución de la contratación. ¿Necesitás un <strong>ingeniero</strong> para una obra, un <strong>diseñador</strong> urgente o un <strong>plomero</strong> un domingo a la noche?
              <br /><br />
              Nuestra IA conecta tu necesidad con el profesional verificado más cercano. Sin intermediarios, con pagos seguros y chat directo.
            </p>
          </motion.div>

          {/* Lista de Servicios (SEO Rich Snippets visuales) */}
          <div className="grid gap-4">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="group flex items-center p-3 md:p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-emerald-500/30 transition-all duration-300 cursor-default"
              >
                <div className={`flex-shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-xl ${service.color} flex items-center justify-center text-white shadow-lg mr-4 group-hover:scale-110 transition-transform`}>
                  {service.icon}
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white group-hover:text-emerald-300 transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-xs md:text-sm text-gray-400">
                    {service.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* ============ COLUMNA DER: CELULAR 3D ============ */}
        <div className="flex-1 w-full max-w-md lg:max-w-full flex justify-center perspective-1000 order-1 lg:order-2">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, type: "spring" }}
            viewport={{ once: true }}
            className="relative"
          >
            {/* 📱 MARCO DEL CELULAR (CSS PURE) */}
            <div className="relative mx-auto border-gray-900 bg-gray-900 border-[12px] md:border-[14px] rounded-[2.5rem] h-[550px] w-[280px] md:h-[650px] md:w-[320px] shadow-2xl flex flex-col overflow-hidden ring-1 ring-white/20">
             
              {/* Botones físicos del celular */}
              <div className="h-[32px] w-[3px] bg-gray-800 absolute -left-[15px] top-[72px] rounded-l-lg"></div>
              <div className="h-[46px] w-[3px] bg-gray-800 absolute -left-[15px] top-[124px] rounded-l-lg"></div>
              <div className="h-[64px] w-[3px] bg-gray-800 absolute -right-[15px] top-[142px] rounded-r-lg"></div>
             
              {/* PANTALLA INTERNA */}
              <div className="rounded-[2rem] overflow-hidden w-full h-full bg-gray-100 relative">
               
                {/* 📸 AQUI PEGAS TU URL 📸
                    Recomendación: Usa una captura de tu Figma o App real.
                    Si no tienes una a mano, dejé esta de Unsplash que simula un mapa/perfil.
                */}
                <img
                  src="/src/assets/web.png"
                  alt="App CuyIT Interfaz"
                  className="object-cover w-full h-full"
                />
               
                {/* Overlay oscuro suave abajo para que se lea algo si quieres poner texto encima */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
               
                {/* UI Falsa inferior (Bottom Nav Indicator) */}
                <div className="absolute bottom-6 left-0 right-0 flex justify-center">
                   <div className="w-16 h-1 bg-white/70 rounded-full" />
                </div>
              </div>
            </div>

            {/* ELEMENTOS FLOTANTES (Parallax Cards) */}
           
            {/* Card 1: Notificación de Match */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute top-24 -right-4 md:-right-16 bg-white p-3 md:p-4 rounded-2xl shadow-xl border-l-4 border-emerald-500 w-[200px] z-20"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-emerald-100 p-1.5 rounded-full text-emerald-600">
                  <LuCheck size={16} />
                </div>
                <span className="text-xs font-bold text-gray-800">Profesional Asignado</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                   <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Pro" />
                </div>
                <div>
                    <p className="text-xs font-semibold text-gray-700">Arq. J. Pérez</p>
                    <p className="text-[10px] text-gray-500">Llega en 12 min</p>
                </div>
              </div>
            </motion.div>

            {/* Card 2: Seguridad / Verificado */}
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 1 }}
              className="absolute bottom-40 -left-6 md:-left-20 bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-lg z-20 flex items-center gap-3 border border-gray-200 max-w-[180px]"
            >
              <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                <LuBadgeCheck size={20} />
              </div>
              <div>
                <span className="block text-xs font-bold text-gray-800">Identidad Validada</span>
                <span className="text-[10px] text-gray-500">Pagos protegidos</span>
              </div>
            </motion.div>

          </motion.div>
        </div>

      </div>
    </section>
  );
}

export default AppShowcaseSection;
