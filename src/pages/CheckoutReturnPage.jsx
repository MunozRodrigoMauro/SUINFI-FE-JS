// FRONTEND — src/pages/CheckoutReturnPage.jsx
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function CheckoutReturnPage() {
  const [sp] = useSearchParams();
  const status = sp.get("status") || "";
  const navigate = useNavigate();
  const [msg, setMsg] = useState("Procesando…");

  useEffect(() => {
    (async () => {
      try {
        const token =
          localStorage.getItem("auth_token") ||
          sessionStorage.getItem("auth_token") ||
          localStorage.getItem("token");

        const preBookingId = localStorage.getItem("suinfi:lastPreBookingId");
        if (!token || !preBookingId) {
          setMsg("No hay datos para reconciliar.");
          return;
        }

        const RAW_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";
        const BASE = RAW_BASE.replace(/\/+$/, "").replace(/\/api$/i, "");
        const res = await fetch(`${BASE}/api/payments/mp/reconcile-pre`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ preBookingId }),
        });
        await res.json();
        localStorage.removeItem("suinfi:lastPreBookingId");

        setMsg(
          status === "failure" ? "Pago rechazado."
          : status === "pending" ? "Pago pendiente."
          : "¡Pago acreditado! Tu reserva se creó."
        );
      } catch (e) {
        setMsg(e.message || "No se pudo reconciliar.");
      } finally {
        setTimeout(() => navigate("/bookings", { replace: true }), 1200);
      }
    })();
  }, [navigate, status]);

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="border rounded-xl p-6 text-center">
        <h1 className="text-lg font-semibold">Retorno de pago</h1>
        <p className="mt-2 text-gray-700">{msg}</p>
      </div>
    </div>
  );
}
