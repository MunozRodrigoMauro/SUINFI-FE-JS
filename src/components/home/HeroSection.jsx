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
    <section className="relative min-h-[80vh] overflow-hidden">
      {/* Fallback sólido con tu gradiente */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a0e17] to-[#0a0e17]" />

      {/* Video de fondo */}
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

      {/* Overlay MÁS oscuro para tapar el video */}
      <div className="absolute inset-0 bg-black/70" />

      {/* Contenido */}
      <div className="relative z-10 flex flex-col min-h-[80vh] text-white px-4">
        {/* Título */}
        <div className="pt-18 md:pt-26 flex items-center justify-center">
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight text-center max-w-4xl">
            Conectá con profesionales en tiempo real
          </h1>
        </div>

        <div className="flex-1" />

        {/* CTA más grande */}
        <div className="pb-30 md:pb-40 flex items-center justify-center">
          <Link
            to={ctaLink}
            className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold px-10 py-5 rounded-full shadow-lg hover:scale-110 hover:shadow-xl transition transform text-lg md:text-xl"
          >
            {ctaText}
          </Link>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
