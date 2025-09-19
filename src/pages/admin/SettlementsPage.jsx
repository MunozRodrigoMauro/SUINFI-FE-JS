import React, { useEffect, useState } from "react";
import Navbar from "../../components/layout/Navbar";
import BackBar from "../../components/layout/BackBar";
import { adminListDeposits, adminRefundManual, adminCreatePayout, adminListPayouts } from "../../api/adminPaymentsService";

export default function SettlementsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState([]);
  const [msg, setMsg] = useState("");

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [d, p] = await Promise.all([adminListDeposits(), adminListPayouts()]);
      setRows(d || []);
      setPayouts(p || []);
    } catch {
      setMsg("No se pudo cargar.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { if (!msg) return; const t=setTimeout(()=>setMsg(""),2000); return ()=>clearTimeout(t); },[msg]);

  return (
    <>
      <Navbar />
      <BackBar title="Liquidaciones" subtitle="Revisá señas acreditadas, devolvé o liquidá a profesionales" />
      <section className="pt-30 pb-24 px-4 max-w-6xl mx-auto">
        {msg && <div className="mb-3 text-sm rounded-lg px-3 py-2 border bg-indigo-50 border-indigo-200 text-indigo-700">{msg}</div>}

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Señas acreditadas</h2>
            <button className="px-3 py-2 rounded border" onClick={fetchAll}>Refrescar</button>
          </div>

          {loading ? (
            <div className="p-5 text-gray-600">Cargando…</div>
          ) : rows.length === 0 ? (
            <div className="p-5 text-gray-600">No hay señas.</div>
          ) : (
            <div className="divide-y">
              {rows.map((r) => (
                <div key={r._id} className="p-4 grid md:grid-cols-[1fr_auto] gap-3">
                  <div className="text-sm">
                    <div className="font-semibold">{r?.booking?.service?.name || "Servicio"} — ${Number(r.amount || 0).toFixed(2)}</div>
                    <div className="text-gray-600">Cliente: {r?.booking?.client?.name || "-"} · Pro: {r?.booking?.professional?.user?.name || "-"}</div>
                    <div className="text-gray-500">Pago: {r?.provider} · {r?.status}</div>
                    <div className="text-xs text-gray-500">{r?.payoutInfo?.alias ? `Alias: ${r.payoutInfo.alias}` : r?.payoutInfo?.cbu ? `CBU: ${r.payoutInfo.cbu}` : "Sin datos bancarios"}</div>
                    {r.hasPayout && <div className="text-xs text-emerald-700">✔ Liquidado</div>}
                    {r?.refund?.status === "refunded" && <div className="text-xs text-rose-700">↩ Reembolsado</div>}
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <button
                      className="px-3 py-1.5 rounded bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50"
                      disabled={r.hasPayout || r?.refund?.status === "refunded"}
                      onClick={async () => {
                        const amount = prompt("Monto a reembolsar", String(r.amount || ""));
                        if (!amount) return;
                        const reason = prompt("Motivo del reembolso", "Cancelación / no show");
                        try {
                          await adminRefundManual({ paymentId: r._id, amount: Number(amount), reason });
                          setMsg("Reembolso registrado.");
                          fetchAll();
                        } catch { setMsg("Error al reembolsar."); }
                      }}
                    >
                      Devolver seña
                    </button>

                    <button
                      className="px-3 py-1.5 rounded bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                      disabled={r.hasPayout || r?.refund?.status === "refunded"}
                      onClick={async () => {
                        const amount = prompt("Monto a liquidar al profesional", String(r.amount || ""));
                        if (!amount) return;
                        const notes = prompt("Notas internas (opcional)", "");
                        try {
                          await adminCreatePayout({ paymentId: r._id, amount: Number(amount), notes });
                          setMsg("Liquidación registrada.");
                          fetchAll();
                        } catch { setMsg("Error al liquidar."); }
                      }}
                    >
                      Marcar liquidado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden mt-6">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Historial de liquidaciones</h2>
          </div>
          {payouts.length === 0 ? (
            <div className="p-5 text-gray-600">Sin liquidaciones.</div>
          ) : (
            <div className="divide-y">
              {payouts.map((p) => (
                <div key={p._id} className="p-4 text-sm">
                  <div className="font-medium">${Number(p.amount || 0).toFixed(2)} — {p?.booking?.service?.name || "Servicio"}</div>
                  <div className="text-gray-600">Pro: {p?.booking?.professional?.user?.name || "-"} · Estado: {p.status}</div>
                  <div className="text-gray-500 text-xs">{p?.snapshot?.alias ? `Alias: ${p.snapshot.alias}` : p?.snapshot?.cbu ? `CBU: ${p.snapshot.cbu}` : ""}{p?.notes ? ` · Notas: ${p.notes}` : ""}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}