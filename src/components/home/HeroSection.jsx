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
        /* 🛠 Cambio: más espacio en móvil (arriba y abajo) */
        pt-[calc(env(safe-area-inset-top)+92px)] md:pt-0
        pb-8 md:pb-0
        /* Desktop/Tablet: mantenemos min-height para el look grande */
        md:min-h-[50vh] lg:min-h-[56vh]
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

      {/* Oscurecimiento para legibilidad */}
      <div className="absolute inset-0 bg-black/70 md:bg-black/70" />

      {/* Contenido */}
      <div className="relative z-10 text-white px-4">
        <div
          className="
            mx-auto w-full max-w-screen-xl
            /* En móvil: contenido define el alto; en md+ centramos vertical */
            flex flex-col items-center justify-start md:justify-center
            gap-5 md:gap-6 /* 🛠 Cambio: un poco más de separación interna */
            md:min-h-[50vh] lg:min-h-[56vh]
          "
        >
          {/* Título */}
          <h1
            className="
              font-extrabold text-center
              leading-[1.12] tracking-[-0.02em]
              max-w-2xl md:max-w-3xl lg:max-w-4xl
              text-[clamp(1.55rem,6vw,2.3rem)]
              md:text-[clamp(2.25rem,4.2vw,3.75rem)]
            "
          >
            Conectá con profesionales en tiempo real
          </h1>

          {/* CTA */}
          <div className="mt-4 md:mt-6 lg:mt-8 flex items-center justify-center">
            <Link
              to={ctaLink}
              className="
                btn-breathe
                bg-gradient-to-r from-emerald-600 to-teal-700
                text-white font-bold
                px-6 py-3 md:px-7 md:py-4
                rounded-full shadow-lg hover:scale-110 hover:shadow-xl
                transition-transform duration-300
                text-base md:text-xl lg:text-2xl
                focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70
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
