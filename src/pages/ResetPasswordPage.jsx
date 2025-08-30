// src/pages/ResetPasswordPage.jsx
import React, { useMemo, useState } from "react";
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

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = (params.get("token") || "").trim();
  const navigate = useNavigate();

  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const label = useMemo(()=>strengthLabel(p1), [p1]);

  const submit = async (e) => {
    e.preventDefault();
    if (!token) { setErr("Enlace inválido."); return; }
    if (p1 !== p2) { setErr("Las contraseñas no coinciden"); return; }
    setLoading(true); setMsg(""); setErr("");
    try {
      await resetPasswordByToken(token, p1);
      setMsg("¡Listo! Tu contraseña fue restablecida. Ya podés iniciar sesión.");
      setTimeout(()=>navigate("/login", { replace: true }), 2000);
    } catch (e) {
      setErr(e.message || "El enlace es inválido o venció.");
    } finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <BackBar title="Restablecer contraseña" />
      <section className="max-w-md mx-auto px-4 pt-28 pb-16">
        {msg ? (
          <div className="bg-green-50 border border-green-200 text-green-700 rounded p-4">{msg}</div>
        ) : (
          <form onSubmit={submit} className="bg-white border rounded-2xl shadow-sm p-5">
            {err && <div className="mb-3 p-2 rounded bg-red-50 border border-red-200 text-red-700">{err}</div>}
            <label className="block text-sm mb-1">Nueva contraseña</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mb-1" type="password" value={p1}
              onChange={(e)=>setP1(e.target.value)} required minLength={8}
              placeholder="Mínimo 8 y compleja"
            />
            <div className="text-xs text-gray-500 mb-3">Fortaleza: {label}</div>

            <label className="block text-sm mb-1">Repetir nueva contraseña</label>
            <input
              className="w-full border rounded-lg px-3 py-2 mb-4" type="password" value={p2}
              onChange={(e)=>setP2(e.target.value)} required minLength={8}
              placeholder="Repetir contraseña"
            />
            <button className="w-full px-4 py-2 rounded bg-gradient-to-tr from-[#0b1220] to-[#1f2a44] text-white disabled:opacity-60 cursor-pointer"
                    disabled={loading}>
              {loading ? "Guardando…" : "Guardar"}
            </button>
          </form>
        )}
      </section>
    </>
  );
}
