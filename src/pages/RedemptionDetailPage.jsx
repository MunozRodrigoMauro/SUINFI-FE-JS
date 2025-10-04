import React, { useEffect, useState } from "react";
import { useLocation, useParams, Link } from "react-router-dom";
import VoucherCard from "../components/rewards/VoucherCard";
import BackBar from "../components/layout/BackBar";
import { useAuth } from "../auth/AuthContext";

export default function RedemptionDetailPage() {
  const { state } = useLocation();
  const { id } = useParams();
  const [data, setData] = useState(state || null);

  useEffect(() => {
    if (!state) setData(null); // Futuro: fetch por id
  }, [id, state]);

  return (
    <>
      <BackBar
        title="Detalle del canje"
        subtitle="Presentá el código en el comercio adherido"
        right={
          <Link
            to="/rewards"
            className="bg-[#0a0e17] text-white px-4 py-2 rounded hover:bg-gray-800 transition"
          >
            Ver catálogo
          </Link>
        }
      />

      <main className="pt-[132px] md:pt-[152px] min-h-[60vh]">
        <div className="container mx-auto max-w-lg px-4 md:px-6">
          {!data ? (
            <div className="rounded-2xl p-8 text-center bg-base-100 border space-y-3">
              <div className="text-lg font-semibold">Canje realizado</div>
              <div className="opacity-70 text-sm">Si no ves el código, volvé a “Mis puntos”.</div>
              <Link className="inline-flex bg-[#0a0e17] text-white px-4 py-2 rounded hover:bg-gray-800" to="/points">
                Ir a Mis Puntos
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <h1 className="text-2xl font-extrabold">¡Listo! Tenés tu beneficio</h1>
              <VoucherCard code={data.code} status="ISSUED" />
              <div className="flex gap-3">
                <Link className="inline-flex border rounded px-4 py-2 hover:bg-base-200 transition" to="/rewards">
                  Volver al catálogo
                </Link>
                <Link className="inline-flex border rounded px-4 py-2 hover:bg-base-200 transition" to="/points">
                  Ver mis puntos
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
