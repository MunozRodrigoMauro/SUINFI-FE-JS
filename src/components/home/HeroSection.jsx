// src/components/home/HeroSection.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

function HeroSection() {
  const { user } = useAuth();

  // 🔀 Según si está logueado o no
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
    <section className="relative min-h-[40vh] md:min-h-[48vh] overflow-hidden">
      {/* Fondo */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17] to-[#0a0e17]" />

      <video
        className="absolute inset-0 w-full h-full object-cover motion-safe:block motion-reduce:hidden"
        autoPlay
        loop
        muted
        playsInline
        poster="/videos/VIDEOSUINFI.webm"
      >
        <source src="/videos/VIDEOSUINFI.webm" type="video/webm" />
      </video>

      <div className="absolute inset-0 bg-black/70" />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col min-h-[42vh] md:min-h-[50vh] text-white px-4">
        {/* Título */}
        <div className="pt-20 md:pt-26 flex items-center justify-center">
          <h1
            className="
              text-3xl md:text-6xl font-extrabold
              leading-[1.05] tracking-[-0.03em]
              text-center max-w-2xl md:max-w-3xl
            "
          >
            Conectá con profesionales en tiempo real
          </h1>
        </div>

        {/* Espacio extra entre texto y botón */}
        <div className="mt-6 md:mt-20 flex items-center justify-center">
          <Link
            to={ctaLink}
            className="btn-breathe bg-gradient-to-r from-emerald-600 to-teal-700 
              text-white font-bold px-7 py-4
              rounded-full shadow-lg hover:scale-110 hover:shadow-xl 
              transition transform text-xl md:text-2xl"
          >
            {ctaText}
          </Link>
        </div>
      </div>

      {/* Animación suave del botón (breathe) */}
      <style>{`
        @keyframes breathe {
          0%, 100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.35);
          }
          50% {
            transform: translateY(-2px) scale(1.05);
            box-shadow: 0 0 0 12px rgba(16, 185, 129, 0);
          }
        }
        .btn-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
}

export default HeroSection;
