// src/components/Shared/WhenStep.jsx
import React from "react";

export default function WhenStep({ intent, onIntent, radiusKm, onRadius, onFinish }) {
  return (
    <div className="w-full">
      <div className="bg-white/95 text-slate-900 rounded-2xl border border-slate-200 p-6 shadow-xl">
        <h2 className="text-xl font-semibold mb-4">¿Cuándo?</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={() => onIntent?.("now")}
            className={`rounded-xl border px-4 py-3 text-left cursor-pointer ${
              intent === "now"
                ? "border-emerald-600 bg-emerald-50"
                : "border-slate-300 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="font-semibold">Disponible ahora</div>
            <div className="text-sm text-slate-600">Que me atiendan lo antes posible</div>
            {/* CHANGES: Badge aclaratorio para “Disponible ahora” */}
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs sm:text-[13px] text-emerald-700">
                Muestra <span className="mx-1 font-semibold">solo disponibles</span>
              </span>
            </div>
          </button>

          <button
            onClick={() => onIntent?.("schedule")}
            className={`rounded-xl border px-4 py-3 text-left cursor-pointer ${
              intent === "schedule"
                ? "border-emerald-600 bg-emerald-50"
                : "border-slate-300 bg-white hover:bg-slate-50"
            }`}
          >
            <div className="font-semibold">Programar</div>
            <div className="text-sm text-slate-600">Coordinar día y horario</div>
            {/* CHANGES: Badge aclaratorio para “Programar” */}
            <div className="mt-2">
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs sm:text-[13px] text-slate-700">
                Incluye <span className="mx-1 font-semibold">disponibles</span> y <span className="mx-1 font-semibold">no disponibles</span>
              </span>
            </div>
          </button>
        </div>

        {/* (El bloque del radio fue removido en un cambio previo) */}

        <button
          onClick={() => onFinish?.()}
          className="mt-6 w-full rounded-xl py-3 bg-emerald-600 text-white hover:bg-emerald-700 cursor-pointer"
        >
          Buscar profesionales
        </button>
      </div>
    </div>
  );
}
