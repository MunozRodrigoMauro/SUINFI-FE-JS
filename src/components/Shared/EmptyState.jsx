// src/components/Shared/EmptyState.jsx
import React from "react";
import { motion } from "framer-motion";

export default function EmptyState({
  title = "No encontramos profesionales disponibles",
  description = "Intentá ajustar los filtros o ampliar el radio de búsqueda para descubrir más profesionales cerca tuyo.",
  onRetry,
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20 px-6">
      {/* Fondo degradado circular animado */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative flex items-center justify-center"
      >
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#0b1220] to-[#1f2a44] blur-3xl opacity-60 scale-125" />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 200"
          className="w-44 h-44 relative z-10 drop-shadow-lg"
        >
          <circle cx="100" cy="100" r="90" fill="url(#gradBg)" />
          <path
            d="M50 120h100M70 100h60M80 80h40"
            stroke="url(#gradLine)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="100" cy="50" r="8" fill="url(#gradDot)" />
          <defs>
            <linearGradient id="gradBg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0b1220" />
              <stop offset="100%" stopColor="#1f2a44" />
            </linearGradient>
            <linearGradient id="gradLine" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
            <linearGradient id="gradDot" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#0d9488" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      {/* Texto */}
      <motion.h3
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl md:text-3xl font-semibold text-slate-800 mt-6"
      >
        {title}
      </motion.h3>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="text-gray-600 max-w-md mx-auto mt-3 leading-relaxed"
      >
        {description}
      </motion.p>

      {/* Botón */}
      <motion.button
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onRetry || (() => (window.location.href = "/request"))}
        className="mt-8 px-6 py-2.5 rounded-lg text-white font-medium shadow-lg hover:shadow-xl transition 
        bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 focus:ring-4 focus:ring-emerald-300 cursor-pointer"
      >
        Volver a buscar
      </motion.button>
    </div>
  );
}
