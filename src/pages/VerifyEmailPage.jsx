// src/pages/VerifyEmailPage.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmailByToken, verifyToken as verifySession } from "../api/userService";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;

    const raw = params.get("token"); // viene del enlace: /verify-email?token=xxxxx(hex)
    const token = raw ? raw.trim() : "";

    if (!token) {
      setStatus("error");
      setMsg("Token faltante.");
      return;
    }

    (async () => {
      try {
        // 🔒 Llamada limpia sin interceptor/JWT
        const res = await verifyEmailByToken(token);
        if (!alive) return;

        setStatus("ok");
        setMsg(res?.message || "Correo verificado.");

        // Redirigir suave al login
        setTimeout(() => {
          if (alive) navigate("/login", { replace: true });
        }, 5000);
      } catch (e) {
        if (!alive) return;

        const statusCode = e?.status || e?.response?.status || 0;
        const serverMsg = e?.data?.message || e?.response?.data?.message || e?.message || "Error";

        console.log("[VerifyEmailPage] ❌ error verificando:", statusCode, serverMsg);

        // Si falla, intentamos ver si YA tiene sesión y está verificado → lo mandamos al dashboard
        try {
          const jwt = localStorage.getItem("token");
          if (jwt) {
            const s = await verifySession(jwt);
            if (s?.user?.verified) {
              navigate("/dashboard/user", { replace: true });
              return;
            }
          }
        } catch {/* ignore */}

        setStatus("error");
        // mostrar el mensaje real del backend si existe
        setMsg(serverMsg || "Token inválido o vencido.");
      }
    })();

    return () => { alive = false; };
  }, [navigate, params]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur border border-slate-200 shadow-xl rounded-2xl p-8 text-center">
        {status === "loading" && (
          <>
            <div className="mx-auto h-10 w-10 rounded-full border-2 border-slate-300 border-t-slate-900 animate-spin" />
            <h2 className="text-xl font-semibold mt-4 text-slate-800">
              Verificando tu correo…
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Esperá un momento, por favor.
            </p>
          </>
        )}

        {status === "ok" && (
          <>
            <div className="mx-auto h-10 w-10 rounded-full grid place-items-center bg-emerald-100">
              <span className="text-emerald-700 text-lg">✓</span>
            </div>
            <h2 className="text-2xl font-bold mt-4 text-slate-900">
              ¡Tu correo fue verificado!
            </h2>
            <p className="text-slate-600 mt-2">{msg}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 px-5 py-2 rounded-xl bg-gradient-to-tr from-[#0b1220] to-[#1f2a44] text-white hover:bg-black transition cursor-pointer"
            >
              Ir a iniciar sesión
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto h-10 w-10 rounded-full grid place-items-center bg-rose-100">
              <span className="text-rose-700 text-lg">!</span>
            </div>
            <h2 className="text-2xl font-bold mt-4 text-slate-900">Ups…</h2>
            <p className="text-slate-600 mt-2">{msg}</p>
            <button
              onClick={() => navigate("/login")}
              className="mt-6 px-5 py-2 rounded-xl bg-gradient-to-tr from-[#0b1220] to-[#1f2a44] text-white hover:bg-black transition cursor-pointer"
            >
              Volver a login
            </button>
          </>
        )}
      </div>
    </div>
  );
}