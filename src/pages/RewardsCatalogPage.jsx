// src/pages/RewardsCatalogPage.jsx
import React, { useEffect, useState } from "react";
import { listRewards, redeemReward } from "../api/rewardsService";
import { getMyPoints } from "../api/pointsService";
import RewardCard from "../components/rewards/RewardCard";
import RedeemModal from "../components/rewards/RedeemModal";
import BackBar from "../components/layout/BackBar"; // <- ruta correcta
import { useNavigate, Link } from "react-router-dom";

export default function RewardsCatalogPage() {
  const [rewards, setRewards] = useState([]);
  const [summary, setSummary] = useState({ balance: 0, nextReward: { cost: 200, missing: 200 } });
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true); // <- loading real del fetch
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [rw, s] = await Promise.all([listRewards(), getMyPoints()]);
        if (!mounted) return;
        setRewards(Array.isArray(rw) ? rw : []);
        setSummary(s || { balance: 0, nextReward: { cost: 200, missing: 200 } });
      } catch (e) {
        setError("No pudimos cargar el catálogo en este momento.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const handleRedeem = async () => {
    if (!selected) return;
    try {
      setLoading(true);
      const r = await redeemReward(selected._id);
      navigate(`/redemptions/${r.redemptionId}`, { state: { code: r.code, reward: selected } });
    } catch (e) {
      alert(e?.response?.data?.message || "No se pudo canjear");
    } finally {
      setLoading(false);
      setSelected(null);
    }
  };

  // ---- UI auxiliares ----
  const SkeletonGrid = () => (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-2xl border bg-base-200/70 h-40 animate-pulse" />
      ))}
    </div>
  );

  const EmptyState = () => (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-2xl border bg-base-100 p-8 md:p-10 text-center">
        {/* iconito simple */}
        <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-black/90 flex items-center justify-center">
          <span className="text-white text-xl">🎁</span>
        </div>
        <h2 className="text-xl font-extrabold">Pronto vas a ver beneficios acá</h2>
        <p className="mt-1 text-sm opacity-70">
          Hoy no hay recompensas activas o tu saldo todavía no alcanza.
        </p>

        {/* cómo ganar puntos */}
        <div className="mt-6 grid sm:grid-cols-2 gap-3 text-left">
          <div className="rounded-xl border bg-white/60 p-4">
            <div className="font-semibold mb-1">Cómo ganar puntos</div>
            <ul className="text-sm space-y-1.5">
              <li>+10 pts por reserva completada</li>
              <li>+15 pts extra si tuvo seña</li>
              <li>+5 pts por reseña de tu reserva</li>
              <li>+5 pts por referido con seña (máx. 3/mes)</li>
            </ul>
          </div>
          <div className="rounded-xl border bg-white/60 p-4">
            <div className="font-semibold mb-1">Qué podés canjear</div>
            <p className="text-sm opacity-80">
              Desde <b>200 pts</b> en aliados cercanos (ej.: helado gratis, %OFF, combos).
            </p>
            <p className="text-sm opacity-80">Estamos sumando nuevos aliados todas las semanas.</p>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/points"
            className="bg-[#0a0e17] text-white px-4 py-2 rounded hover:bg-gray-800 transition text-sm"
          >
            Ver mis puntos ({summary.balance} pts)
          </Link>
        </div>

        {/* carrusel/placa de “Próximamente” */}
        <div className="mt-8">
          <div className="text-xs uppercase tracking-wide opacity-60 mb-2">
            Próximamente
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {["Heladería", "Cafetería", "Gimnasio", "Cine"].map((p) => (
              <div
                key={p}
                className="rounded-xl border bg-white/50 h-16 flex items-center justify-center text-sm font-medium"
              >
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <BackBar
        title="Catálogo de beneficios"
        subtitle={`Saldo disponible: ${summary.balance} pts`}
        right={
          <Link
            to="/points"
            className="bg-[#0a0e17] text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Mis puntos
          </Link>
        }
      />

      <main className="pt-[132px] md:pt-[152px] min-h-[70vh]">
        <div className="container mx-auto max-w-6xl px-4 pb-20">
          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 text-rose-700 p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <SkeletonGrid />
          ) : rewards.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {rewards.map((r) => (
                <RewardCard
                  key={r._id}
                  reward={r}
                  canRedeem={summary.balance >= r.pointsCost}
                  onRedeem={(rw) => setSelected(rw)}
                />
              ))}
            </div>
          )}
        </div>

        <RedeemModal
          open={!!selected}
          reward={selected}
          missing={Math.max(0, (selected?.pointsCost || 0) - (summary.balance || 0))}
          onConfirm={handleRedeem}
          onClose={() => setSelected(null)}
          loading={loading && !!selected}
        />
      </main>
    </>
  );
}
