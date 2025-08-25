// src/pages/VerifyEmailSent.jsx
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { resendVerification } from "../api/userService";

export default function VerifyEmailSent() {
  const [params] = useSearchParams();
  const initial = params.get("email") || "";
  const [email, setEmail] = useState(initial);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false); // 👈 loader

  const handleResend = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      await resendVerification(email);
      setMsg("Te enviamos un nuevo correo de verificación.");
    } catch (e) {
      setMsg(e?.response?.data?.message || "No se pudo reenviar. Probá más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded-md">
      <h2 className="text-2xl font-bold mb-2 text-center">Revisá tu correo</h2>
      <p className="text-center text-gray-600 mb-6">
        Te enviamos un enlace para activar tu cuenta.
      </p>

      <form onSubmit={handleResend} className="space-y-3">
        <input
          type="email"
          placeholder="Tu correo"
          className="w-full border px-4 py-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-tr from-[#0b1220] to-[#1f2a44] text-white py-2 rounded cursor-pointer transition
            ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <span className="flex justify-center items-center">
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Enviando…
            </span>
          ) : (
            "Reenviar verificación"
          )}
        </button>
      </form>

      {msg && <p className="text-sm mt-3 text-center">{msg}</p>}
    </div>
  );
}