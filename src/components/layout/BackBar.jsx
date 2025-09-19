// src/components/navigation/BackBar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

export default function BackBar({
  title,
  subtitle,
  onBack,
  right = null,
}) {
  const navigate = useNavigate();
  const goBack = onBack || (() => navigate(-1));

  return (
    <div className="sticky top-14 md:top-16 z-10 bg-[#111827] text-white border-b border-black/20">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-12 flex items-center gap-3">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 transition cursor-pointer"
            title="Volver"
          >
            <span className="text-lg">←</span>
            <span className="text-sm font-medium">Volver</span>
          </button>

          <div className="ml-2 flex-1 min-w-0">
            {title && <div className="truncate font-semibold">{title}</div>}
            {subtitle && (
              <div className="truncate text-xs text-gray-300 -mt-0.5">{subtitle}</div>
            )}
          </div>

          {/* Acciones derechas: ocultas en mobile para evitar desfasaje */}
          {right && <div className="shrink-0 hidden md:block">{right}</div>}
        </div>
      </div>
    </div>
  );
}