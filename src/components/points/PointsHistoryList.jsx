import React from "react";

const LABELS = {
  BOOKING_BASE: "Reserva completada",
  BOOKING_DEPOSIT_BONUS: "Bonus por seña",
  REVIEW_BONUS: "Reseña enviada",
  REFERRAL_BONUS: "Referido con seña",
  ADJUSTMENT: "Ajuste",
  REDEMPTION_DEBIT: "Canje de beneficio",
};

export default function PointsHistoryList({ items = [], loading = false }) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-base-200 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="rounded-2xl p-8 text-center bg-base-100 border">
        <p className="text-lg font-semibold">Todavía no tenés movimientos</p>
        <p className="text-sm opacity-70 mt-1">Completá reservas, dejá reseñas o invitá amigos para sumar puntos.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-base-200" />
      <ul className="space-y-3">
        {items.map((tx) => {
          const positive = tx.points > 0;
          return (
            <li key={tx._id} className="relative pl-10">
              <span
                className={`absolute left-3 top-5 h-2.5 w-2.5 rounded-full ${
                  positive ? "bg-emerald-500" : "bg-rose-500"
                }`}
              />
              <div className="rounded-xl bg-base-100 border p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold">{LABELS[tx.type] || tx.type}</div>
                  <div className="text-xs opacity-60 mt-0.5">
                    {new Date(tx.createdAt).toLocaleString()}
                    {tx?.meta?.bookingId ? ` · #${tx.meta.bookingId}` : ""}
                  </div>
                </div>
                <div className={`text-lg font-bold tabular-nums ${positive ? "text-emerald-600" : "text-rose-600"}`}>
                  {positive ? `+${tx.points}` : tx.points}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
