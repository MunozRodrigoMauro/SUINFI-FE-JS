import { useState } from "react";
import { createMpDepositPreference } from "../../api/paymentService";

export default function PayDepositButton({ bookingId, className = "" }) {
  const [loading, setLoading] = useState(false);

  const startPayment = async () => {
    try {
      setLoading(true);

      const token =
        localStorage.getItem("auth_token") ||
        sessionStorage.getItem("auth_token") ||
        localStorage.getItem("token");

      if (!token) {
        alert("Tenés que iniciar sesión para pagar la seña.");
        return;
      }

      const { init_point, sandbox_init_point } = await createMpDepositPreference({
        bookingId,
        token,
      });

      localStorage.setItem("suinfi:lastBookingId", bookingId);

      const url = init_point || sandbox_init_point;
      if (!url) throw new Error("Preferencia creada sin URL de pago.");
      window.location.href = url;
    } catch (e) {
      alert(e.message || "No se pudo iniciar el pago.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={startPayment}
      disabled={loading}
      className={`px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs hover:bg-blue-700 disabled:opacity-60 ${className}`}
      title="Pagar seña"
    >
      {loading ? "Redirigiendo..." : "Pagar seña"}
    </button>
  );
}
