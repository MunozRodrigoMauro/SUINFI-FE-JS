// src/components/Shared/ProfileNudge.jsx
// CHANGES: look & feel “glassy” + tipografía/spacing refinados + botón X redondo con SVG alineado a la derecha.
import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";

const K = "cuyit:nudge:v1";
const DURATION_MS = 24 * 60 * 60 * 1000; // 24h

function useDismiss() {
  const [canShow, setCanShow] = useState(true);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(K);
      if (!raw) return;
      const obj = JSON.parse(raw);
      if (obj?.dismissUntil && Date.now() < obj.dismissUntil) setCanShow(false);
    } catch {}
  }, []);
  const rememberLater = (ms = DURATION_MS) => {
    try {
      localStorage.setItem(K, JSON.stringify({ dismissUntil: Date.now() + ms }));
    } catch {}
  };
  const clearNudge = () => {
    try {
      localStorage.removeItem(K);
    } catch {}
  };
  return { canShow, rememberLater, clearNudge };
}

export default function ProfileNudge({ user, missing = [], onClose }) {
  const navigate = useNavigate();
  const { canShow, rememberLater } = useDismiss();
  const [open, setOpen] = useState(false);
  const overlayRef = useRef(null);

  // Mostrar solo si faltan mínimos y el usuario no snoozeó
  useEffect(() => {
    const hasMissing = Array.isArray(missing) && missing.length > 0;
    setOpen(Boolean(user && hasMissing && canShow));
  }, [user, missing, canShow]);

  // Cerrar por ESC
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  // Bloquear scroll detrás
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => (document.body.style.overflow = prev);
  }, [open]);

  if (!open) return null;

  const role = user?.role || "user";
  const title =
    role === "professional"
      ? "Completá tu perfil para recibir más trabajos"
      : "Completá tu perfil para encontrar mejores profesionales";

  const mapLabel = {
    name: "Nombre",
    address: "Dirección",
    whatsapp: "WhatsApp",
    availability: "Disponibilidad",
  };

  const goProfile = () => {
    setOpen(false);
    onClose?.();
    navigate("/profile");
  };

  const snooze = () => {
    rememberLater();
    setOpen(false);
    onClose?.();
  };

  const onBackDrop = (e) => {
    if (e.target === overlayRef.current) snooze(); // tap/click fuera → cerrar (snooze)
  };

  return createPortal(
    <div
      ref={overlayRef}
      onClick={onBackDrop}
      className="fixed inset-0 z-[1000] bg-gradient-to-b from-black/50 to-black/30 backdrop-blur-sm flex items-end sm:items-center justify-center p-3"
      aria-modal="true"
      role="dialog"
    >
      <div className="w-full sm:max-w-md rounded-2xl border border-white/50 bg-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur p-4 sm:p-5 animate-in fade-in zoom-in duration-150 relative mb-40">
        {/* Header con título y X a la derecha (alineados) */}
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-[15px] sm:text-lg font-semibold tracking-tight text-slate-900 flex-1">
            {title}
          </h3>
<button
  aria-label="Cerrar"
  title="Cerrar"
  onClick={snooze}
  className="group h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-white/90 border border-slate-200 shadow-md grid place-items-center
             hover:bg-white hover:border-slate-300 hover:shadow-lg active:scale-[.98] cursor-pointer transition"
>
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700 transition-colors group-hover:text-slate-900"
  >
    <path
      d="M6.75 6.75l10.5 10.5M17.25 6.75l-10.5 10.5"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
  </svg>
</button>

        </div>

        <p className="text-[13px] sm:text-sm text-slate-600 mt-1 leading-relaxed">
          Completá estos datos para contactar y ser contactado con más facilidad:
        </p>

        <ul className="mt-3 space-y-1.5">
          {missing.map((k) => (
            <li key={k} className="flex items-center gap-2 text-[13px] sm:text-sm text-slate-800">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500/90 ring-2 ring-emerald-100" />
              <span>
                {mapLabel[k] || k}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          <button
            onClick={goProfile}
            className="w-full rounded-xl px-4 py-3 bg-emerald-600 text-white font-medium hover:bg-emerald-700 shadow-sm active:scale-[.99] cursor-pointer"
          >
            Completar ahora
          </button>
          <button
            onClick={snooze}
            className="w-full rounded-xl px-4 py-3 bg-white border border-slate-300 text-slate-900 hover:bg-slate-50 shadow-sm active:scale-[.99] cursor-pointer"
          >
            Recordar después
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
