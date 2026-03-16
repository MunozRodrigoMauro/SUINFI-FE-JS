// src/pages/ResetPasswordPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import BackBar from "../components/layout/BackBar";
import { resetPasswordByToken } from "../api/userService";

function strengthLabel(pwd) {
  const ok = [
    pwd.length >= 8,
    /[a-z]/.test(pwd),
    /[A-Z]/.test(pwd),
    /\d/.test(pwd),
    /[!@#$%^&*]/.test(pwd),
  ];
  const score = ok.filter(Boolean).length;
  return score <= 2 ? "débil" : score === 3 ? "media" : "fuerte";
}

function buildMobileResetUrl(token) {
  return `cuyitmobile://reset-password?token=${encodeURIComponent(token)}`;
}

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = (params.get("token") || "").trim();
  const navigate = useNavigate();

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const label = useMemo(() => strengthLabel(p1), [p1]);

  useEffect(() => {
    if (!token) return;

    window.location.assign(buildMobileResetUrl(token));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();

    if (!token) {
      setErr("Enlace inválido.");
      return;
    }

    if (p1 !== p2) {
      setErr("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    setMsg("");
    setErr("");

    try {
      await resetPasswordByToken(token, p1);
      setMsg("¡Listo! Tu contraseña fue restablecida. Ya podés iniciar sesión.");
      setTimeout(() => navigate("/login", { replace: true }), 2000);
    } catch (e) {
      setErr(e.message || "El enlace es inválido o venció.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <BackBar title="Restablecer contraseña" />
      <section className="max-w-md mx-auto px-4 pt-28 pb-16">
        {token ? (
          <div className="mb-4 p-3 rounded bg-slate-50 border border-slate-200 text-slate-700">
            Estamos intentando abrir la app. Si no se abrió, podés continuar el proceso acá.
          </div>
        ) : null}

        {msg ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded p-4">
            {msg}
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="bg-white border rounded-2xl shadow-sm p-5"
          >
            {err && (
              <div className="mb-3 p-2 rounded bg-red-50 border border-red-200 text-red-700">
                {err}
              </div>
            )}

            <label className="block text-sm mb-1">Nueva contraseña</label>
            <div className="relative mb-1">
              <input
                className="w-full border rounded-lg px-3 py-2 pr-10"
                type={showPwd ? "text" : "password"}
                value={p1}
                onChange={(e) => setP1(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 y compleja"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute inset-y-0 right-2 my-auto h-8 w-8 grid place-items-center rounded hover:bg-gray-100"
                title={showPwd ? "Ocultar" : "Mostrar"}
              >
                {showPwd ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 1013.42 13.4" />
                    <path d="M9.88 4.24A9.77 9.77 0 0112 4c5.52 0 9 5.5 9 8-.19.46-.43.9-.71 1.31M6.11 6.11C4.21 7.39 3 9.19 3 12c0 .74.21 1.53.57 2.3A13.3 13.3 0 0012 20a12.1 12.1 0 005.27-1.2" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <div className="text-xs text-gray-500 mb-3">
              Fortaleza: {label}
            </div>

            <label className="block text-sm mb-1">
              Repetir nueva contraseña
            </label>
            <div className="relative mb-4">
              <input
                className="w-full border rounded-lg px-3 py-2 pr-10"
                type={showPwd ? "text" : "password"}
                value={p2}
                onChange={(e) => setP2(e.target.value)}
                required
                minLength={8}
                placeholder="Repetir contraseña"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? "Ocultar contraseña" : "Mostrar contraseña"}
                className="absolute inset-y-0 right-2 my-auto h-8 w-8 grid place-items-center rounded hover:bg-gray-100"
                title={showPwd ? "Ocultar" : "Mostrar"}
              >
                {showPwd ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M3 3l18 18" />
                    <path d="M10.58 10.58A2 2 0 1013.42 13.4" />
                    <path d="M9.88 4.24A9.77 9.77 0 0112 4c5.52 0 9 5.5 9 8-.19.46-.43.9-.71 1.31M6.11 6.11C4.21 7.39 3 9.19 3 12c0 .74.21 1.53.57 2.3A13.3 13.3 0 0012 20a12.1 12.1 0 005.27-1.2" />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>

            <button
              className="w-full px-4 py-2 rounded bg-gradient-to-tr from-[#0b1220] to-[#1f2a44] text-white disabled:opacity-60 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </form>
        )}
      </section>
    </>
  );
}