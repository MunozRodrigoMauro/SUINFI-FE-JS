// src/pages/ForgotPasswordPage.jsx
import React, { useState } from "react";
import Navbar from "../components/layout/Navbar";
import BackBar from "../components/layout/BackBar";
import { requestPasswordReset } from "../api/userService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true); setMsg(""); setErr("");
    try {
      await requestPasswordReset(email.trim());
      setMsg("Si el email existe, te enviamos un enlace para restablecerla.");
    } catch (e) {
      setErr(e.message || "Ocurrió un error");
    } finally { setLoading(false); }
  };

  return (
    <>
      <Navbar />
      <BackBar title="Recuperar contraseña" />
      <section className="max-w-md mx-auto px-4 pt-28 pb-16">
        {msg && <div className="mb-4 p-3 rounded bg-green-50 border border-green-200 text-green-700">{msg}</div>}
        {err && <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-700">{err}</div>}
        <form onSubmit={submit} className="bg-white border rounded-2xl shadow-sm p-5">
          <label className="block text-sm mb-1">Email</label>
          <input
            className="w-full border rounded-lg px-3 py-2 mb-4"
            type="email"
            value={email}
            onChange={(e)=>setEmail(e.target.value)}
            placeholder="tu@email.com"
            required
          />
          <button className="w-full px-4 py-2 rounded bg-gradient-to-tr from-[#0b1220] to-[#1f2a44] text-white disabled:opacity-60 cursor-pointer"
                  disabled={loading}>
            {loading ? "Enviando…" : "Enviar link"}
          </button>
        </form>
      </section>
    </>
  );
}
