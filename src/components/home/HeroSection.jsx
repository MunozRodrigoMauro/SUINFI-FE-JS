// src/components/home/HeroSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

function HeroSection() {
  const { user } = useAuth();

  // 🔀 Según si está logueado o no (SIN CAMBIAR LÓGICA)
  const isLoggedIn = !!user;
  let ctaText = "¡Comenzá gratis!";
  let ctaLink = "/register";

  if (isLoggedIn) {
    if (user.role === "admin") {
      ctaText = "Ir a mi Panel Admin";
      ctaLink = "/dashboard/admin";
    } else if (user.role === "professional") {
      ctaText = "Ir a mi Panel Profesional";
      ctaLink = "/dashboard/professional";
    } else {
      ctaText = "Ir a mi Panel Usuario";
      ctaLink = "/dashboard/user";
    }
  }

  return (
    <section
      className="
        relative overflow-hidden supports-[overflow:clip]:overflow-clip
        /* 🛠 Cambio: más espacio en móvil para compensar navbar fija */
        pt-[calc(env(safe-area-inset-top)+92px)] md:pt-0
        pb-12 md:pb-0
        /* Desktop/Tablet: altura completa para impacto visual */
        md:h-screen md:min-h-[600px]
        flex flex-col justify-center
      "
    >
      {/* Fondo base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17] to-[#0a0e17]" />

      {/* Video con compatibilidad */}
      <video
        className="absolute inset-0 w-full h-full object-cover motion-safe:block motion-reduce:hidden"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
        poster="/videos/VIDEOSUINFI.jpg"
      >
        <source src="/videos/VIDEOSUINFI.webm" type="video/webm" />
        <source src="/videos/VIDEOSUINFI.mp4" type="video/mp4" />
      </video>

      {/* Oscurecimiento general para que el video no compita con el texto */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Contenido Principal */}
      <div className="relative z-10 w-full px-4 md:px-6 flex flex-col items-center justify-center h-full">
        
        {/* ⭐ TARJETA GLASSMORPHISM (SOLUCIÓN):
            - En móvil (default): w-full.
            - En Desktop (md/lg): max-w-3xl (limita el ancho para que parezca tarjeta).
            - bg-black/30: Fondo oscuro traslúcido para mayor legibilidad.
        */}
        <div 
          className="
            w-full md:max-w-3xl lg:max-w-4xl
            mx-auto
            flex flex-col items-center text-center
            backdrop-blur-md 
            bg-black/30 md:bg-black/40 /* Un poco más oscuro en desktop para contraste */
            border border-white/10 
            shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]
            rounded-3xl
            p-6 md:p-12 lg:p-14
            transition-all duration-300
          "
        >
          
          {/* Badge "Bienvenido" */}
          <span className="mb-4 inline-block text-emerald-400 font-bold tracking-[0.2em] uppercase text-xs md:text-sm animate-pulse">
            Bienvenido a CuyIT
          </span>

          {/* Título Principal */}
          <h1
            className="
              font-extrabold text-white
              leading-tight tracking-tight
              mb-6
              text-3xl sm:text-4xl md:text-5xl lg:text-6xl
              drop-shadow-lg
            "
          >
            La plataforma que conecta servicios y profesionales en tiempo real
          </h1>
          
          {/* Subtítulo */}
          <p className="max-w-2xl mx-auto text-base md:text-xl text-gray-200 font-light leading-relaxed mb-8 md:mb-10">
            Olvidate de las esperas. En <strong>CuyIT</strong> encontrás expertos verificados cerca de tu ubicación al instante. Soluciones rápidas, seguras y a un clic.
          </p>

          {/* CTA Botón */}
          <div>
            <Link
              to={ctaLink}
              className="
                btn-breathe
                inline-flex items-center justify-center
                bg-gradient-to-r from-emerald-600 to-teal-600
                text-white font-bold
                px-8 py-4 md:px-10 md:py-4
                rounded-full 
                shadow-lg shadow-emerald-900/20
                hover:scale-105 hover:shadow-emerald-500/30
                transition-all duration-300
                text-lg md:text-xl
              "
            >
              {ctaText}
            </Link>
          </div>
        </div>
      </div>

      {/* Animación del botón */}
      <style>{`
        @keyframes breathe {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4);
          }
          50% {
            box-shadow: 0 0 0 12px rgba(16, 185, 129, 0);
          }
        }
        .btn-breathe {
          animation: breathe 3s infinite;
        }
      `}</style>
    </section>
  );
}

export default HeroSection;