import React, { useEffect, useState } from "react";
import { getMyPoints, getMyPointsHistory } from "../api/pointsService";
import BalanceHeader from "../components/points/BalanceHeader";
import PointsHistoryList from "../components/points/PointsHistoryList";
import BackBar from "../components/layout/BackBar";
import { Link } from "react-router-dom";

export default function PointsPage() {
  const [summary, setSummary] = useState({ balance: 0, nextReward: { cost: 200, missing: 200 } });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const s = await getMyPoints();
        const h = await getMyPointsHistory({ limit: 50 });
        if (mounted) {
          setSummary(s);
          setHistory(h.items || []);
        }
      } finally {
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <>
      {/* SOLO BackBar (debajo del Navbar global) */}
      <BackBar
        title="Mis Puntos"
        subtitle="Sumá completando reservas, pagando seña, dejando reseñas y trayendo amigos."
        right={
          <Link
            to="/rewards"
            className="bg-[#0a0e17] text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Ver catálogo
          </Link>
        }
      />

      {/* Compensar altura Navbar (h-14/16) + BackBar (h-12) */}
      <main className="pt-[132px] md:pt-[152px] min-h-[70vh]">
        {/* Hero / Balance */}
        <div className="container mx-auto max-w-5xl px-4 pb-6">
          <BalanceHeader balance={summary.balance} next={summary.nextReward} />
        </div>

        {/* Contenido */}
        <div className="container mx-auto max-w-5xl px-4 pb-20 grid md:grid-cols-3 gap-6">
          {/* Info + CTA */}
          <div className="md:col-span-1 space-y-4">
            <div className="rounded-2xl border bg-base-100 p-5">
              <h3 className="font-semibold mb-2">Cómo ganar puntos</h3>
              <ul className="text-sm space-y-2">
                <li>+10 pts por reserva completada</li>
                <li>+15 pts extra si tuvo seña</li>
                <li>+5 pts por reseña de tu reserva</li>
                <li>+5 pts por referido con seña (máx. 3/mes)</li>
              </ul>
            </div>

            <Link
              to="/rewards"
              className="block rounded-2xl border bg-white/60 dark:bg-base-100 p-5 hover:shadow-md transition"
            >
              <div className="text-lg font-semibold">Catálogo de beneficios</div>
              <p className="text-sm opacity-70">Canjeá desde 200 pts en comercios aliados.</p>
              <button className="mt-3 bg-[#0a0e17] text-white px-4 py-2 rounded w-full hover:bg-gray-800 transition">
                Ver catálogo
              </button>
            </Link>
          </div>

          {/* Historial */}
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold">Historial</h3>
              <span className="text-xs opacity-60">Últimos movimientos</span>
            </div>
            <PointsHistoryList items={history} loading={loading} />
          </div>
        </div>
      </main>
    </>
  );
}
