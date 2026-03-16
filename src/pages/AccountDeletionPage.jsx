// src/pages/AccountDeletionPage.jsx
import React, { useEffect } from "react";
import BackBar from "../components/layout/BackBar";

export default function AccountDeletionPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Eliminación de cuenta • CuyIT";
  }, []);

  return (
    <div className="min-h-screen bg-white text-[#0a0e17]">
      <BackBar title="Eliminación de cuenta" />

      <main className="mx-auto max-w-4xl px-4 pt-8 pb-12">
        <header className="mb-6">
          <p className="text-sm text-gray-600">
            Esta página describe cómo solicitar la eliminación de tu cuenta y datos asociados en CuyIT.
          </p>

          <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm">
              <span className="font-medium">Soporte:</span>{" "}
              <a className="underline" href="mailto:info@cuyit.com">info@cuyit.com</a>
            </p>
          </div>
        </header>

        <section className="space-y-4">
          <article className="rounded-2xl border border-[#0a0e17]/10 p-5">
            <h2 className="text-lg font-semibold">Opción 1 — Desde la app (recomendado)</h2>
            <ol className="mt-3 list-decimal pl-5 space-y-1 text-sm text-gray-700">
              <li>Ingresá a CuyIT con tu cuenta.</li>
              <li>Ir a <b>Perfil / Configuración</b>.</li>
              <li>Seleccioná <b>Eliminar cuenta</b> y confirmá.</li>
            </ol>
            <p className="mt-3 text-sm text-gray-700">
              Si tu cuenta tiene verificación o sesión activa, completá el paso de verificación que te muestre la app.
            </p>
          </article>

          <article className="rounded-2xl border border-[#0a0e17]/10 p-5">
            <h2 className="text-lg font-semibold">Opción 2 — Por email (si no podés ingresar)</h2>
            <p className="mt-3 text-sm text-gray-700">
              Enviá un correo a{" "}
              <a className="underline" href="mailto:info@cuyit.com">info@cuyit.com</a>{" "}
              con asunto <b>“Eliminar cuenta”</b> e incluí:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Email de la cuenta registrada.</li>
              <li>Rol (Cliente o Profesional).</li>
              <li>Motivo (opcional).</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-[#0a0e17]/10 p-5">
            <h2 className="text-lg font-semibold">Qué datos se eliminan</h2>
            <ul className="mt-3 list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Perfil y datos de cuenta (nombre, email, teléfono si aplica, foto/avatars).</li>
              <li>Preferencias y configuración.</li>
              <li>Contenido asociado a la cuenta (por ejemplo, mensajes y actividad), sujeto a las retenciones de abajo.</li>
            </ul>
          </article>

          <article className="rounded-2xl border border-[#0a0e17]/10 p-5">
            <h2 className="text-lg font-semibold">Retención por motivos legales/seguridad</h2>
            <p className="mt-3 text-sm text-gray-700">
              Algunos datos pueden conservarse por un tiempo limitado cuando sea necesario para:
              cumplir obligaciones legales/contables, resolver disputas, prevenir fraude y mantener seguridad.
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-gray-700">
              <li>Registros transaccionales/facturación y auditoría (si aplica).</li>
              <li>Logs técnicos y seguridad (por prevención de abuso/fraude).</li>
              <li>Reservas/pagos/reclamos en curso hasta su resolución.</li>
            </ul>
            <p className="mt-3 text-sm text-gray-700">
              Si necesitás un detalle de tu caso, escribinos a{" "}
              <a className="underline" href="mailto:info@cuyit.com">info@cuyit.com</a>.
            </p>
          </article>
        </section>

        <p className="mt-8 text-xs text-gray-500">
          Si modificamos este proceso, actualizaremos esta página.
        </p>
      </main>
    </div>
  );
}
