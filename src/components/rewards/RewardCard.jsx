import React from "react";

export default function RewardCard({ reward, canRedeem, onRedeem }) {
  const cost = reward.pointsCost;
  return (
    <div className="group rounded-2xl bg-white/60 dark:bg-base-100 backdrop-blur border hover:shadow-xl transition overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        {reward?.partnerId?.logoUrl ? (
          <img
            src={reward.partnerId.logoUrl}
            alt={reward.partnerId.name}
            className="h-12 w-12 rounded-xl object-cover ring-1 ring-black/5"
          />
        ) : (
          <div className="h-12 w-12 rounded-xl bg-base-200" />
        )}
        <div>
          <div className="font-semibold">{reward.title}</div>
          <div className="text-xs opacity-70">{reward?.partnerId?.name || "Aliado"}</div>
        </div>
        <div className="ml-auto">
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-black/5 text-sm font-medium">
            {cost} pts
          </span>
        </div>
      </div>
      {reward.subtitle && <div className="px-4 text-sm opacity-80">{reward.subtitle}</div>}
      <div className="p-4 pt-3">
        <button
          className={`w-full px-4 py-2 rounded font-semibold transition ${
            canRedeem
              ? "bg-[#0a0e17] text-white hover:bg-gray-800"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          onClick={() => canRedeem && onRedeem?.(reward)}
          disabled={!canRedeem}
        >
          {canRedeem ? "Canjear" : "Te faltan puntos"}
        </button>
      </div>
    </div>
  );
}
