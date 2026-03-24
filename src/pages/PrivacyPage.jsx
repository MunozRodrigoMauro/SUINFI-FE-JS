// src/pages/PrivacyPage.jsx
import React, { useEffect, useState } from "react";
import BackBar from "../components/layout/BackBar";

/** Chevron reutilizable */
function Chevron({ open }) {
  return (
    <svg
      className={`h-5 w-5 transition-transform ${open ? "rotate-90" : ""}`}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707A1 1 0 118.707 5.293l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Contenido */
const SECTIONS = [
  {
    id: "vigencia",
    title: "1. Vigencia",
    body: (
      <>
        <p>
          Esta Política de Privacidad describe cómo CuyIT trata tu información cuando usás la app y
          los servicios asociados.
        </p>
        <p className="mt-2">
          Fecha de entrada en vigencia:{" "}
          <span className="font-medium">7 de febrero de 2026</span>.
        </p>
      </>
    ),
  },
  {
    id: "info",
    title: "2. Qué información recopilamos",
    body: (
      <>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <span className="font-medium">Información de cuenta:</span> nombre, email, rol
            (cliente/profesional), foto de perfil y datos que completes en tu perfil.
          </li>
          <li>
            <span className="font-medium">Información de uso:</span> interacciones dentro de la app
            (por ejemplo: reservas creadas, mensajes enviados, pantallas visitadas de forma agregada).
          </li>
          <li>
            <span className="font-medium">Mensajería:</span> contenido de mensajes entre usuarios
            para permitir el funcionamiento del chat y la seguridad de la plataforma.
          </li>
          <li>
            <span className="font-medium">Ubicación (si la autorizás):</span> para funciones que dependen
            de geolocalización (por ejemplo, mostrar disponibilidad o calcular distancias).
          </li>
          <li>
            <span className="font-medium">Datos técnicos:</span> información básica del dispositivo y la app
            (por ejemplo: versión) para compatibilidad y diagnóstico.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "uso",
    title: "3. Cómo usamos la información",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <span className="font-medium">Operación del servicio:</span> crear y administrar cuentas, reservas,
          chat y notificaciones relacionadas.
        </li>
        <li>
          <span className="font-medium">Mejora del servicio:</span> análisis interno, soporte y corrección
          de errores.
        </li>
        <li>
          <span className="font-medium">Seguridad y cumplimiento:</span> prevención de fraude, abuso, spam
          y respuesta a reportes o requerimientos legales.
        </li>
      </ul>
    ),
  },
  {
    id: "compartimos",
    title: "4. Con quién compartimos la información",
    body: (
      <>
        <p>
          Compartimos información sólo cuando es necesario para operar CuyIT, cumplir la ley y brindar el
          servicio:
        </p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>
            <span className="font-medium">Entre usuarios:</span> algunos datos se muestran para que el servicio
            funcione (por ejemplo: nombre y foto en el chat o en una reserva).
          </li>
          <li>
            <span className="font-medium">Proveedores:</span> servicios de infraestructura, analítica, email,
            notificaciones y otros proveedores que procesan datos por cuenta de CuyIT.
          </li>
          <li>
            <span className="font-medium">Funcionalidades futuras:</span> si en el futuro se habilitan integraciones
            de cobro o pago, CuyIT podrá compartir la información estrictamente necesaria con el proveedor externo
            correspondiente para prestar esa funcionalidad.
          </li>
          <li>
            <span className="font-medium">Requerimientos legales:</span> cuando sea necesario para cumplir con
            obligaciones legales, responder a autoridades o proteger derechos y seguridad.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "ubicacion",
    title: "5. Ubicación",
    body: (
      <>
        <p>
          Si habilitás permisos de ubicación, se utiliza para funcionalidades como mejorar coincidencias,
          mostrar disponibilidad y calcular distancias. Si no otorgás el permiso, la app puede funcionar
          con funcionalidad limitada en aquellas partes que dependan de ubicación.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          Podés revocar el permiso en cualquier momento desde la configuración del dispositivo.
        </p>
      </>
    ),
  },
  {
    id: "mensajeria",
    title: "6. Mensajería y contenido",
    body: (
      <>
        <p>
          Los mensajes se almacenan para permitir el funcionamiento del chat, mejorar la seguridad y
          habilitar herramientas de moderación (por ejemplo, ante reportes).
        </p>
        <p className="mt-2">
          Está prohibido compartir contenido ilícito, fraudulento o que viole los Términos. CuyIT puede
          tomar medidas de moderación, bloqueo y reporte a autoridades cuando corresponda.
        </p>
      </>
    ),
  },
  {
    id: "seguridad",
    title: "7. Seguridad",
    body: (
      <>
        <p>
          Implementamos medidas técnicas y organizativas razonables para proteger tu información, como
          cifrado en tránsito, controles de acceso y monitoreo de abuso.
        </p>
        <p className="mt-2">
          Aun así, ningún sistema es 100% infalible. Recomendamos usar contraseñas fuertes y no compartir
          credenciales.
        </p>
      </>
    ),
  },
  {
    id: "retencion",
    title: "8. Retención de datos",
    body: (
      <>
        <p>
          Conservamos la información el tiempo necesario para operar CuyIT, cumplir obligaciones legales,
          resolver disputas y hacer cumplir nuestros acuerdos. Cuando deja de ser necesaria, se elimina o
          anonimiza de forma razonable.
        </p>
      </>
    ),
  },
  {
    id: "derechos",
    title: "9. Tus derechos (Argentina)",
    body: (
      <>
        <p>
          Tratamos datos conforme a Ley 25.326, su decreto reglamentario y normativa AAIP. Tenés derechos de
          acceso, rectificación, actualización y supresión.
        </p>
        <p className="mt-2">
          Para ejercerlos escribinos a{" "}
          <a className="underline" href="mailto:info@cuyit.com">
            info@cuyit.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "menores",
    title: "10. Menores de edad (18+)",
    body: (
      <>
        <p>
          CuyIT está destinado exclusivamente a personas mayores de 18 años. Si tomás conocimiento de que
          un menor utiliza CuyIT, por favor notificanos a{" "}
          <a className="underline" href="mailto:info@cuyit.com">
            info@cuyit.com
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "cambios",
    title: "11. Cambios a esta Política",
    body: (
      <p>
        Podemos actualizar esta Política de Privacidad. Publicaremos la versión vigente en el sitio y, si
        los cambios son relevantes, podremos notificarte por medios in-app o email.
      </p>
    ),
  },
  {
    id: "contacto",
    title: "12. Contacto",
    body: (
      <p>
        Para consultas sobre privacidad o seguridad:{" "}
        <a className="underline" href="mailto:info@cuyit.com">
          info@cuyit.com
        </a>
        .
      </p>
    ),
  },
];

export default function PrivacyPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Política de Privacidad • CuyIT";
  }, []);

  const [open, setOpen] = useState(() =>
    Object.fromEntries(SECTIONS.map((s) => [s.id, false]))
  );
  const allOpen = Object.values(open).every(Boolean);

  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const setAll = (v) =>
    setOpen(Object.fromEntries(SECTIONS.map((s) => [s.id, !!v])));

  return (
    <div className="min-h-screen bg-white text-[#0a0e17]">
      <BackBar title="Política de Privacidad" />

      {/* separación del BackBar */}
      <main className="mx-auto max-w-4xl px-4 pt-8 pb-12">
        <header className="mb-6">
          <p className="text-sm text-gray-600">
            Última actualización:{" "}
            <span className="font-medium text-gray-800">7 de febrero de 2026</span>
          </p>
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm">
              <span className="font-medium">Titular del Servicio:</span> CuyIT (la “Empresa”) —{" "}
              <span className="font-medium">Contacto:</span>{" "}
              <a href="mailto:info@cuyit.com" className="underline">
                info@cuyit.com
              </a>
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setAll(!allOpen)}
              className="rounded-lg bg-[#0a0e17] px-3 py-1.5 text-sm font-semibold text-white hover:bg-black active:opacity-90 transition cursor-pointer"
            >
              {allOpen ? "Colapsar todo" : "Expandir todo"}
            </button>
          </div>
        </header>

        <section className="space-y-3">
          {SECTIONS.map((s) => {
            const isOpen = open[s.id];
            return (
              <article
                key={s.id}
                className={`rounded-2xl border transition ${
                  isOpen ? "border-[#0a0e17]" : "border-[#0a0e17]/10"
                }`}
              >
                <button
                  onClick={() => toggle(s.id)}
                  aria-expanded={isOpen}
                  className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition cursor-pointer
                    ${
                      isOpen
                        ? "bg-[#0a0e17] text-white hover:bg-black"
                        : "bg-[#0a0e17]/5 hover:bg-[#0a0e17]/10 text-[#0a0e17]"
                    }
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0e17]/50`}
                >
                  <span className="font-semibold">{s.title}</span>
                  <Chevron open={isOpen} />
                </button>

                <div className={`${isOpen ? "block" : "hidden"} px-4 pb-4 pt-3`}>
                  <div className="prose max-w-none prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0.5">
                    {s.body}
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <p className="mt-8 text-xs text-gray-500">
          El uso de la plataforma implica la aceptación de los Términos y Condiciones y de esta Política
          de Privacidad. Conservá una copia para tu referencia.
        </p>
      </main>
    </div>
  );
}

/*
[CAMBIOS HECHOS AQUÍ]
- Se ajustó la referencia a proveedores para no mostrar pagos integrados como una funcionalidad actualmente activa.
- Se dejó planteado como posibilidad futura, alineado con el estado actual de la plataforma.
*/