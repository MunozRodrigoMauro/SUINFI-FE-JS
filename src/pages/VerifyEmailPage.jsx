// src/pages/VerifyEmailPage.jsx
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { verifyEmailByToken, verifyToken as verifySession } from "../api/userService";

function buildMobileVerifyUrl(token) {
  return `cuyitmobile://verify-email?token=${encodeURIComponent(token)}`;
}

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState("loading");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    let alive = true;
    let appOpened = false;

    const raw = params.get("token");
    const token = raw ? raw.trim() : "";

    if (!token) {
      setStatus("error");
      setMsg("Token faltante.");
      return () => {
        alive = false;
      };
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        appOpened = true;
      }
    };

    const handlePageHide = () => {
      appOpened = true;
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    const runWebFallback = async () => {
      try {
        const res = await verifyEmailByToken(token);
        if (!alive || appOpened) return;

        setStatus("ok");
        setMsg(res?.message || "Correo verificado.");

        setTimeout(() => {
          if (alive) {
            navigate("/login", { replace: true });
          }
        }, 5000);
      } catch (e) {
        if (!alive || appOpened) return;

        try {
          const jwt = localStorage.getItem("token");
          if (jwt) {
            const session = await verifySession(jwt);
            if (session?.user?.verified) {
              navigate("/dashboard/user", { replace: true });
              return;
            }
          }
        } catch {
          // sin acción
        }

        const serverMsg =
          e?.data?.message ||
          e?.response?.data?.message ||
          e?.message ||
          "Token inválido o vencido.";

        setStatus("error");
        setMsg(serverMsg);
      }
    };

    const timerId = window.setTimeout(() => {
      if (!appOpened) {
        void runWebFallback();
      }
    }, 1200);

    window.location.assign(buildMobileVerifyUrl(token));

    return () => {
      alive = false;
      window.clearTimeout(timerId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
    };
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
              Estamos intentando abrir la app. Si no se abre, continuamos acá.
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