// src/pages/RegisterPage.jsx
// 🛠 CAMBIO: el usuario DEBE elegir rol antes de registrar o continuar con Google.
// - role inicia vacío ("") -> obliga a una acción explícita
// - Botón "Registrarme" y "Continuar con Google" quedan deshabilitados hasta elegir rol
// - Mensaje de ayuda bajo el selector de rol
// - Guard de seguridad en handleSubmit por si llegara sin rol

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/userService";

const FRIENDLY = {
  name: {
    "Name is required": "El nombre es obligatorio.",
    "Name length 2–50": "El nombre debe tener entre 2 y 50 caracteres.",
    "Invalid name characters":
      "Usá solo letras (con acentos), espacios, apóstrofos (') o guiones (-). Ej: Juan Pérez, O’Connor, Ana-María.",
  },
  email: { "Must be a valid email": "Ingresá un email válido." },
  password: {
    "La contraseña debe tener al menos 8 caracteres.":
      "La contraseña debe tener al menos 8 caracteres.",
    "La contraseña debe contener al menos una letra minúscula.":
      "Debe incluir al menos una letra minúscula.",
    "La contraseña debe contener al menos una letra mayúscula.":
      "Debe incluir al menos una letra mayúscula.",
    "La contraseña debe contener al menos un número.":
      "Debe incluir al menos un número.",
    "La contraseña debe contener al menos un carácter especial (!@#$%^&*)":
      "Debe incluir al menos un símbolo (¡Ej: ! @ # $ % ^ & *).",
  },
  role: { "Invalid role": 'Tipo inválido. Debe ser "user" o "professional".' },
};

const DEFAULT_HELPERS = {
  name: "Usá solo letras (con acentos), espacios, ' o -. Ej: Juan Pérez.",
  email: "Usá un email válido. Ej: nombre@dominio.com",
  password: "Mínimo 8 caracteres con mayúscula, minúscula, número y símbolo.",
};

function RegisterPage() {
  // 🛠 CAMBIO: el rol inicia SIN selección (obliga al click del usuario)
  const [role, setRole] = useState(""); // "" | "user" | "professional"
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🔧 Normaliza la base para evitar doble /api o barras de más
  const RAW_BASE =
    import.meta.env.VITE_API_URL ||
    import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_SOCKET_URL ||
    "http://localhost:3000/api";

  // -> nos quedamos con el origin (sin slash final y sin /api)
  const API_BASE = RAW_BASE.replace(/\/+$/, "").replace(/\/api$/i, "");

  // 🛠 CAMBIO: bloqueo hasta elegir rol
  const roleSelected = role === "user" || role === "professional";
  const isGoogleDisabled = !roleSelected;
  const isSubmitDisabled = loading || !roleSelected;

  const googleLabel = isGoogleDisabled
    ? "Elegí un rol para continuar"
    : role === "professional"
    ? "Google como Profesional"
    : "Google como Cliente";

  // OAuth con guard si no hay rol (usa /api exactamente una vez)
  const handleGoogle = () => {
    if (!roleSelected) return;
    const safeRole = role === "professional" ? "professional" : "user";
    const nextByRole = {
      user: "/dashboard/user",
      professional: "/dashboard/professional",
    };
    const intent = "register";
    const path = safeRole === "professional" ? "professional" : "client";
    const next = nextByRole[safeRole] || "/dashboard/user";
    window.location.href = `${API_BASE}/api/auth/google/${path}?intent=${encodeURIComponent(
      intent
    )}&next=${encodeURIComponent(next)}`;
  };

  // 🛠 CAMBIO: registro por email exige rol seleccionado
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    setError([]);
    setFieldErrors({});

    if (!roleSelected) {
      setFieldErrors({ role: "Elegí un rol (Cliente o Profesional) para continuar." });
      return;
    }

    setLoading(true);
    try {
      const safeRole = role === "professional" ? "professional" : "user";
      await registerUser({ name, email, password, role: safeRole });
      navigate(`/verify-email-sent?email=${encodeURIComponent(email)}`, {
        replace: true,
      });
    } catch (err) {
      const raw = err?.response?.data?.errors;
      const code = err?.response?.data?.code;
      const status = err?.response?.status;
    
      // 🛠️ CAMBIO: manejo especial si el email ya existe (409 o EMAIL_TAKEN)
      if (status === 409 || code === "EMAIL_TAKEN") {
        setFieldErrors({ email: "Ese correo ya está registrado. Iniciá sesión o recuperá tu contraseña." });
        setError([]);
      } else if (Array.isArray(raw) && raw.length) {
        const perField = {};
        const general = [];
        raw.forEach((e) => {
          const path = e.path || e.param || "general";
          const msg = e.msg || "Dato inválido.";
          const friendly =
            (FRIENDLY[path] && FRIENDLY[path][msg]) ||
            (FRIENDLY[path] && FRIENDLY[path][String(msg)]) ||
            msg;
          if (["name", "email", "password", "role"].includes(path)) {
            perField[path] = perField[path] || friendly;
          } else {
            general.push(friendly);
          }
        });
        setFieldErrors(perField);
        setError(general);
      } else if (err.response?.data?.message) {
        setFieldErrors({});
        setError([err.response.data.message]);
      } else {
        setFieldErrors({});
        setError([
          "No pudimos completar el registro: revisá nombre, email y contraseña.",
        ]);
      }
    }
     finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">
        Crear cuenta
      </h2>

      {/* 🛠 CAMBIO: toggle de rol obliga a una acción explícita */}
      <div className="mb-4">
        <p className="text-xs text-gray-600 mb-2">Elegí tu rol:</p>
        <div className="grid grid-cols-2 gap-1 bg-gray-100 rounded-xl p-1">
          <button
            type="button"
            onClick={() => setRole("user")}
            className={`py-2 rounded-lg text-sm transition ${
              role === "user"
                ? "bg-white shadow font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            aria-pressed={role === "user"}
          >
            👤 Cliente
          </button>
          <button
            type="button"
            onClick={() => setRole("professional")}
            className={`py-2 rounded-lg text-sm transition ${
              role === "professional"
                ? "bg-white shadow font-medium"
                : "text-gray-600 hover:text-gray-800"
            }`}
            aria-pressed={role === "professional"}
          >
            🔧 Profesional
          </button>
        </div>
        <p
          className={`text-[11px] mt-2 ${
            roleSelected ? "text-gray-500" : "text-amber-600"
          }`}
        >
          {fieldErrors.role
            ? fieldErrors.role
            : roleSelected
            ? `Vas a crear una cuenta como ${
                role === "professional" ? "Profesional" : "Cliente"
              }.`
            : "Tenés que elegir un rol para continuar (registro y Google)."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="text"
            placeholder="Nombre"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full border px-4 py-2 rounded disabled:opacity-60"
            disabled={loading}
          />
          <p
            className={`text-xs mt-1 ${
              fieldErrors.name ? "text-red-600" : "text-gray-500"
            }`}
          >
            {fieldErrors.name || DEFAULT_HELPERS.name}
          </p>
        </div>

        <div>
          <input
            type="email"
            placeholder="Correo"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border px-4 py-2 rounded disabled:opacity-60"
            disabled={loading}
          />
          <p
            className={`text-xs mt-1 ${
              fieldErrors.email ? "text-red-600" : "text-gray-500"
            }`}
          >
            {fieldErrors.email || DEFAULT_HELPERS.email}
          </p>
        </div>

        <div>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border px-4 py-2 rounded disabled:opacity-60"
            disabled={loading}
          />
          <p
            className={`text-xs mt-1 ${
              fieldErrors.password ? "text-red-600" : "text-gray-500"
            }`}
          >
            {fieldErrors.password || DEFAULT_HELPERS.password}
          </p>
        </div>

        {/* 🛠 CAMBIO: submit deshabilitado si no hay rol */}
        <button
          type="submit"
          disabled={isSubmitDisabled}
          aria-disabled={isSubmitDisabled}
          className={`w-full cursor-pointer text-white py-2 rounded transition ${
            isSubmitDisabled
              ? "opacity-60 cursor-not-allowed"
              : "hover:brightness-110"
          } bg-gradient-to-tr from-[#0b1220] to-[#1f2a44]`}
        >
          <div className="flex items-center justify-center gap-2">
            {loading && (
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" aria-hidden="true">
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                  opacity="0.25"
                ></circle>
                <path
                  d="M12 2a10 10 0 0 1 10 10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                ></path>
              </svg>
            )}
            <span>Registrarme</span>
          </div>
        </button>

        {loading && (
          <p className="text-xs text-gray-500 text-center">
            Creando tu cuenta y enviando el correo de verificación…
          </p>
        )}
      </form>

      {/* separador */}
      <div className="my-5 flex items-center gap-3">
        <div className="h-px bg-gray-200 flex-1" />
        <span className="text-xs text-gray-500">o</span>
        <div className="h-px bg-gray-200 flex-1" />
      </div>

      {/* 🛠 CAMBIO: botón Google deshabilitado hasta elegir rol */}
      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={handleGoogle}
          disabled={isGoogleDisabled}
          aria-disabled={isGoogleDisabled}
          className={`w-full border rounded py-2 flex items-center justify-center gap-2 cursor-pointer
            ${isGoogleDisabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "hover:bg-gray-50"}`}
          title={googleLabel}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.8 31.9 29.4 35 24 35c-7.2 0-13-5.8-13-13S16.8 9 24 9c3.1 0 6 1.1 8.2 3l5.7-5.7C34.6 3.6 29.6 5.5 24 5.5c-7.7 0-14.3 4.4-17.7 10.9z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.6 16.4 19 13 24 13c3.1 0 6 1.1 8.2 3l5.7-5.7C34.6 7.6 29.6 5.5 24 5.5c-7.7 0-14.3 4.4-17.7 10.9z"
            />
            <path
              fill="#4CAF50"
              d="M24 42.5c5.3 0 10.1-2 13.7-5.3l-6.3-5.2c-1.9 1.3-4.4 2.1-7.4 2.1-5.3 0-9.8-3.6-11.4-8.5l-6.6 5.1C8.3 38.1 15.6 42.5 24 42.5z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-1.3 3.9-5.6 7-11.3 7-5 0-9.4-3.1-11.1-7.4l-6.6 5.1C8.3 38.1 15.6 42.5 24 42.5c8.7 0 16.1-5.9 18.5-13.8 0-1.2.3-2.4.3-3.7 0-1.2-.1-2.3-.2-3.5z"
            />
          </svg>
          <span className="text-sm font-medium">{googleLabel}</span>
        </button>
        {!isGoogleDisabled && (
          <p className="text-[11px] text-gray-500 text-center">
            Continuás con Google como <b>{role === "professional" ? "Profesional" : "Cliente"}</b>.
          </p>
        )}
      </div>
    </div>
  );
}

export default RegisterPage;
