// src/pages/VerifyEmailSent.jsx
import React, { useEffect, useState } from "react"; // CHANGES: agrego useEffect
import { useSearchParams } from "react-router-dom";
import { resendVerification } from "../api/userService";

export default function VerifyEmailSent() {
  const [params] = useSearchParams();
  const initial = params.get("email") || "";
  const [email, setEmail] = useState(initial);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false); // 👈 loader

  // CHANGES: countdown para habilitar el reenvío (evita spam).
  const RESEND_DELAY = 45;
  const [secondsLeft, setSecondsLeft] = useState(RESEND_DELAY);

  // CHANGES: permite editar el email en la vista (sin llamar backend todavía).
  const [editing, setEditing] = useState(false);

  // CHANGES: interval del contador
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  // CHANGES: abrir el proveedor de correo según dominio.
  const openMailClient = (mail) => {
    const domain = (mail.split("@")[1] || "").toLowerCase();
    let url = null;

    if (domain.includes("gmail.com")) url = "https://mail.google.com/mail/u/0/#inbox";
    else if (
      domain.includes("outlook.") ||
      domain.includes("hotmail.") ||
      domain.includes("live.") ||
      domain.includes("msn.")
    )
      url = "https://outlook.live.com/mail/0/inbox";
    else if (domain.includes("yahoo.")) url = "https://mail.yahoo.com/d/folders/1";
    else if (domain.includes("icloud.") || domain.includes("me.com") || domain.includes("mac.com"))
      url = "https://www.icloud.com/mail";
    else if (domain.includes("proton."))
      url = "https://mail.proton.me/u/0/inbox";

    if (url) {
      window.open(url, "_blank", "noopener,noreferrer");
    } else {
      // fallback mínimo: abre cliente por defecto
      window.location.href = `mailto:${mail}`;
    }
  };

  const handleResend = async (e) => {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      await resendVerification(email);
      setMsg("Te enviamos un nuevo correo de verificación.");
      // CHANGES: reiniciar contador para evitar reenvíos seguidos
      setSecondsLeft(RESEND_DELAY);
    } catch (e) {
      setMsg(e?.response?.data?.message || "No se pudo reenviar. Probá más tarde.");
    } finally {
      setLoading(false);
    }
  };

  // CHANGES: copiar email al portapapeles
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setMsg("Correo copiado.");
    } catch {
      setMsg("No se pudo copiar el correo.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded-md">
      <h2 className="text-2xl font-bold mb-2 text-center">Revisá tu correo</h2>
      <p className="text-center text-gray-600 mb-4">
        Te enviamos un enlace para activar tu cuenta a{" "}
      </p>

      {/* CHANGES: chip con email y acciones */}
      <div className="flex items-center justify-between gap-2 mb-4">
        {!editing ? (
          <>
            <div className="flex-1">
              <span className="block w-full truncate border rounded px-3 py-2 bg-gray-50">
                {email}
              </span>
            </div>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEditing(false);
            }}
            className="flex w-full items-center gap-2"
          >
            <input
              type="email"
              placeholder="Tu correo"
              className="flex-1 border px-3 py-2 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
            <button
              type="submit"
              className="px-3 py-2 border rounded hover:bg-gray-50"
              disabled={loading}
            >
              Guardar
            </button>
          </form>
        )}
      </div>

      {/* CHANGES: CTA primario → Abrir mi correo */}
      <button
        type="button"
        onClick={() => window.open("https://mail.google.com/mail/u/0/#inbox", "_blank")}
        className="w-full bg-gradient-to-tr from-[#0b1220] to-[#1f2a44] text-white py-2 rounded cursor-pointer transition mb-3"
      >
        Abrir mi correo
      </button>

      {/* CHANGES: checklist de ayuda */}
      <ul className="text-sm text-gray-700 space-y-1 mb-4">
        <li>✔ Abrí tu bandeja de entrada o la carpeta de spam.</li>
        <li>
          ✔ Buscá el asunto: <span className="font-medium">CuyIT — Confirmá tu correo</span>.
        </li>
        <li>✔ El enlace vence en 15 minutos.</li>
      </ul>

      {/* CHANGES: reenvío con timer (desaparece el submit primario) */}
      <div className="text-center text-sm">
        {secondsLeft > 0 ? (
          <p className="text-gray-600">
            ¿No llegó? Podrás reenviar en <span className="font-semibold">{secondsLeft}s</span>.
          </p>
        ) : (
          <form onSubmit={handleResend} className="inline-block w-full">
            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2 rounded border-2 text-base font-medium transition
                border-[#1f2a44] text-[#1f2a44]
                hover:bg-[#0b1220] hover:text-white cursor-pointer
                ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {loading ? "Enviando…" : "Reenviar verificación"}
            </button>
          </form>
        )}
      </div>

      {msg && <p className="text-sm mt-3 text-center">{msg}</p>}
    </div>
  );
}
