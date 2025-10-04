import React from "react";

export default function BalanceHeader({ balance = 0, next = { cost: 200, missing: 200 } }) {
  const progress = Math.min(100, Math.round(((next.cost - next.missing) / next.cost) * 100));

  return (
    <section className="relative overflow-hidden rounded-2xl">
      {/* Fondo brand */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e17] to-[#111827]" />
      <div className="absolute inset-0 opacity-20"
           style={{ backgroundImage: "radial-gradient(600px 200px at 10% 0%, #10b98133, transparent)" }} />
      <div className="relative p-6 md:p-8 text-white">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-sm uppercase tracking-widest text-white/70">Mis Puntos</h2>
            <div className="mt-1 text-4xl md:text-5xl font-extrabold tabular-nums">{balance}<span className="text-white/80 text-xl"> pts</span></div>
            <p className="mt-1 text-sm text-white/80">
              Te faltan <span className="font-semibold text-white">{next.missing}</span> pts para tu próximo beneficio (nivel {next?.cost || 200}).
            </p>
          </div>
          <a
            href="/rewards"
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg bg-white text-[#0a0e17] font-semibold hover:bg-gray-100 transition"
          >
            Ver catálogo
          </a>
        </div>

        {/* Barra de progreso */}
        <div className="mt-5 h-3 w-full rounded-full bg-white/20 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress}%` }} />
        </div>

        {/* Tips compactos */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-white/80">
          <div className="rounded-lg bg-white/5 px-3 py-2">+10 <span className="text-white">Reserva completa</span></div>
          <div className="rounded-lg bg-white/5 px-3 py-2">+15 <span className="text-white">Seña pagada</span></div>
          <div className="rounded-lg bg-white/5 px-3 py-2">+5 <span className="text-white">Reseña</span></div>
          <div className="rounded-lg bg-white/5 px-3 py-2">+5 <span className="text-white">Referido (máx. 3/mes)</span></div>
        </div>
      </div>
    </section>
  );
}
