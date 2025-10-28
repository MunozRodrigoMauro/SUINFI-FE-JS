// src/pages/TermsPage.jsx
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
    id: "relacion",
    title: "1. Relación contractual",
    body: (
      <p>
        Estas condiciones regulan el acceso y/o uso de la plataforma CuyIT (web y app) y de sus
        funcionalidades de búsqueda, contratación, comunicación y pago entre usuarios y
        profesionales (los “Servicios”). Al registrarte o usar CuyIT aceptás estas Condiciones y la
        Política de Privacidad. Si no estás de acuerdo, no uses la plataforma.
      </p>
    ),
  },
  {
    id: "objeto",
    title: "2. Objeto — Intermediación tecnológica",
    body: (
      <p>
        CuyIT es una plataforma de intermediación que conecta a usuarios con profesionales de
        múltiples rubros (hogar, tecnología, salud no crítica, diseño, etc.), facilitando
        geolocalización, mensajería, agenda y pagos a través de procesadores externos. CuyIT no
        presta los servicios contratados: la relación y ejecución es entre Usuario y Profesional.
      </p>
    ),
  },
  {
    id: "licencia",
    title: "3. Licencia y restricciones de uso",
    body: (
      <>
        <p>
          Te damos una licencia limitada, no exclusiva y revocable para usar la app/sitio. Queda
          prohibido: (i) extraer o indexar masivamente; (ii) ingeniería inversa salvo lo permitido
          por ley; (iii) intentar vulnerar seguridad; (iv) crear servicios derivados que compitan
          deslealmente con CuyIT.
        </p>
        <div className="mt-4 rounded-xl border border-rose-300/50 bg-rose-50 p-4">
          <p className="font-semibold text-rose-800">
            PROHIBICIÓN ABSOLUTA — Contenido sexual y actividades ilícitas
          </p>
          <p className="mt-1 text-sm text-rose-900/90">
            Se prohíbe estrictamente ofertar o contratar servicios relacionados con pornografía,
            prostitución, servicios sexuales, contenido erótico explícito o cualquier actividad
            ilícita o contraria a la moral y las buenas costumbres. CuyIT podrá eliminar o bloquear
            perfiles, publicaciones o solicitudes que violen esta prohibición.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "cuenta",
    title: "4. Cuenta, verificación y seguridad",
    body: (
      <>
        <p>
          Debés (i) registrarte con datos veraces, (ii) mantener segura tu contraseña, y (iii)
          avisar ante uso no autorizado. CuyIT aplica hashing de contraseñas, JWT con refresh
          tokens, TLS en tránsito, cifrado en reposo y controles anti-abuso. Podemos requerir
          verificación de identidad en casos de riesgo/fraude.
        </p>
        <div className="mt-4 rounded-xl border border-amber-300/50 bg-amber-50 p-4">
          <p className="font-semibold text-amber-900">Seguridad personal en encuentros presenciales</p>
          <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-amber-900/90">
            <li>Verificá identidad y documentación (DNI, matrícula, certificaciones, etc.).</li>
            <li>Acordá encuentros en lugares públicos y seguros.</li>
            <li>Evitá compartir datos personales/financieros fuera de la app.</li>
            <li>Informá a un contacto de confianza el lugar y horario del encuentro.</li>
          </ul>
          <p className="mt-2 text-sm text-amber-900/90">
            CuyIT no interviene físicamente en las reuniones ni garantiza la identidad real de las
            partes, pero promueve activamente la seguridad y el uso responsable de la plataforma.
          </p>
        </div>
      </>
    ),
  },
  {
    id: "privacidad",
    title: "5. Privacidad y protección de datos (Argentina)",
    body: (
      <p>
        Tratamos datos conforme a Ley 25.326, su decreto reglamentario y normativa AAIP. Tenés
        derechos de acceso, rectificación, actualización y supresión; podés ejercerlos en{" "}
        <a className="underline" href="mailto:info@cuyit.com">info@cuyit.com</a> o ante la AAIP.
        Implementamos salvaguardas técnicas y organizativas (TLS 1.3, cifrado en reposo, control
        de accesos y auditoría).
      </p>
    ),
  },
{
  id: "pagos",
  title: "6. Pagos, facturación, reembolsos y contracargos",
  body: (
    <>
      <div className="rounded-xl border border-sky-300/50 bg-sky-50 p-4">
        <p className="font-semibold text-sky-900">Procesamiento de pagos</p>
        <p className="mt-1 text-sm text-sky-900/90">
          Los pagos se cursan con <b>Mercado Pago</b>; CuyIT no almacena datos de tarjeta. Las
          políticas de contracargo y reembolso siguen las reglas del procesador y bancos emisores.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-indigo-300/50 bg-indigo-50 p-4">
        <p className="font-semibold text-indigo-900">Rol de CuyIT — Agente de cobro limitado</p>
        <p className="mt-1 text-sm text-indigo-900/90">
          CuyIT actúa como <b>agente de cobro limitado del Profesional</b>. Podemos{" "}
          <b>recibir y retener una seña/anticipo</b> en nombre del Profesional <b>hasta</b> que el
          Usuario <b>confirme</b> la realización del servicio o venza el plazo establecido para la confirmación.
          CuyIT no es entidad financiera ni ofrece servicios de escrow regulado.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-emerald-300/50 bg-emerald-50 p-4">
        <p className="font-semibold text-emerald-900">Señas / anticipos</p>
        <p className="mt-1 text-sm text-emerald-900/90">
          El Profesional puede requerir una seña entre <b>$2.000 y $5.000 (ARS)</b>. La seña se{" "}
          <b>libera</b> al Profesional cuando: (i) el Usuario confirma el servicio, o (ii) transcurre
          el plazo de confirmación sin objeciones. Si el Usuario <b>impugna</b> dentro del plazo, CuyIT
          podrá <b>retener temporalmente</b> la seña mientras las partes aportan antecedentes y, de
          corresponder, proceder a <b>devolución total/parcial</b> o <b>liberación</b>, según la evidencia
          y/o resolución del procesador.
        </p>
      </div>

      <p className="mt-3">
        <b>Comisiones:</b> actualmente CuyIT <b>no cobra comisión</b> por uso de plataforma. Si en el
        futuro se aplicaran cargos, se informarán <b>antes de pagar</b>.
      </p>

      <p className="mt-2">
        <b>Reembolsos/cancelaciones:</b> se gestionan por el canal del procesador (p. ej., Mercado Pago)
        y evidencia del caso. Los reclamos por anticipos, cancelaciones o incumplimientos se resuelven
        primariamente entre Usuario y Profesional; CuyIT puede <b>retener preventivamente</b> fondos de
        seña hasta contar con elementos suficientes para decidir liberación o devolución.
      </p>
    </>
  ),
},
 {
  id: "conducta",
  title: "7. Conducta de Usuarios y Profesionales",
  body: (
    <>
      <div className="rounded-xl border border-rose-300/50 bg-rose-50 p-4">
        <p className="font-semibold text-rose-900">Tolerancia cero — contenido/actividades prohibidas</p>
        <p className="mt-1 text-sm text-rose-900/90">
          Está <b>estrictamente prohibido</b>: fraude, suplantación de identidad, manipulación de reputación,
          uso de malware, interferencias técnicas, contratación para <b>fines ilícitos</b> y{" "}
          <b>cualquier servicio, contenido o actividad de carácter sexual</b> (incluye pornografía,
          prostitución, ofrecimiento o solicitud de servicios sexuales, contenido erótico explícito,
          explotación sexual o conductas contrarias a la ley y a las buenas costumbres).
        </p>
        <p className="mt-2 text-sm text-rose-900/90">
          CuyIT podrá <b>remover contenido</b> y <b>suspender o cancelar cuentas</b> que infrinjan estas reglas.
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-amber-300/50 bg-amber-50 p-4">
        <p className="font-semibold text-amber-900">Seguridad y cumplimiento</p>
        <p className="mt-1 text-sm text-amber-900/90">
          Podemos aplicar medidas preventivas (bloqueo de perfiles/solicitudes, limitaciones de uso,
          verificación adicional) ante <b>riesgo de seguridad</b> o incumplimiento. Usuarios y Profesionales
          se comprometen a (i) brindar información veraz; (ii) actuar con respeto y sin discriminación;
          (iii) cumplir normativa vigente (consumidor, laboral, impositiva, higiene y seguridad, etc.).
        </p>
      </div>

      <div className="mt-4 rounded-xl border border-slate-300/60 bg-slate-50 p-4">
        <p className="font-semibold text-slate-900">Colaboración con autoridades</p>
        <p className="mt-1 text-sm text-slate-900/90">
          CuyIT <b>reportará</b> a autoridades competentes cualquier indicio de fraude, abuso, trata de
          personas, explotación sexual o laboral u otras conductas ilícitas detectadas en la plataforma, y
          podrá <b>conservar y poner a disposición</b> registros pertinentes conforme la ley.
        </p>
      </div>
    </>
  ),
},
  {
    id: "geo",
    title: "8. Geolocalización, disponibilidad y seguridad",
    body: (
      <p>
        La app usa ubicación para mejorar coincidencias y tiempos. El Servicio puede interrumpirse
        por mantenimiento o incidentes. Contamos con plan de respuesta a incidentes, backups
        cifrados y monitoreo de anomalías.
      </p>
    ),
  },
  {
    id: "contenido",
    title: "9. Contenido y reseñas",
    body: (
      <p>
        Las calificaciones y reseñas deben ser veraces y respetar derechos de terceros. CuyIT
        puede moderar u ocultar contenido que infrinja estas Condiciones o la ley.
      </p>
    ),
  },
  {
    id: "pi",
    title: "10. Propiedad intelectual",
    body: (
      <p>
        El software, bases de datos, diseños, marcas y contenidos de CuyIT son de la Empresa o
        licenciantes. No se permite copia, distribución o ingeniería inversa no autorizada.
      </p>
    ),
  },
  {
    id: "exenciones",
    title: "11. Exenciones y limitación de responsabilidad",
    body: (
      <>
        <p>
          CuyIT se provee “tal cual” y “según disponibilidad”. En la máxima medida legal, CuyIT no
          responde por (i) ejecución/calidad del servicio de Profesionales; (ii) pérdida de
          ganancias/datos; (iii) demoras o indisponibilidad por causas fuera de control razonable.
        </p>
        <p className="mt-2">
          CuyIT no garantiza la veracidad o vigencia de la información o documentación que los
          usuarios o profesionales compartan entre sí. Se recomienda verificar la autenticidad y
          actuar con prudencia.
        </p>
      </>
    ),
  },
  {
    id: "indemnidad",
    title: "12. Indemnidad",
    body: (
      <p>
        Te comprometés a indemnizar a CuyIT por reclamos de terceros derivados de (i) tu uso de la
        plataforma, (ii) violación de estas Condiciones, o (iii) infracción de derechos de
        terceros.
      </p>
    ),
  },
  {
    id: "cambios",
    title: "13. Cambios en las Condiciones",
    body: (
      <p>
        Podemos modificar estas Condiciones y lo notificaremos por la app/email. El uso posterior
        implica aceptación. Conservamos versionado y “última actualización”.
      </p>
    ),
  },
  {
    id: "terminacion",
    title: "14. Terminación",
    body: (
      <p>
        Podemos suspender o cerrar cuentas por incumplimiento, fraude, riesgo de seguridad o por
        razones operativas razonables.
      </p>
    ),
  },
  {
    id: "ley",
    title: "15. Legislación aplicable, reclamos y jurisdicción (Argentina)",
    body: (
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <span className="font-medium">Normativa:</span> Código Civil y Comercial, Ley 24.240 de
          Defensa del Consumidor y normativa complementaria.
        </li>
        <li>
          <span className="font-medium">Reclamos de consumo:</span> Ventanilla Única Federal o
          autoridades de defensa del consumidor.
        </li>
        <li>
          <span className="font-medium">Jurisdicción:</span> Tribunales Ordinarios de San Juan
          (Argentina), salvo asuntos alcanzados por vía de consumo.
        </li>
      </ul>
    ),
  },
  {
    id: "contacto",
    title: "16. Notificaciones y contacto",
    body: (
      <p>
        Te notificaremos por medios in-app o email. Para soporte o seguridad:{" "}
        <a className="underline" href="mailto:info@cuyit.com">info@cuyit.com</a>.
      </p>
    ),
  },
  {
    id: "mayoria",
    title: "17. Elegibilidad y mayoría de edad (18+)",
    body: (
      <>
        <p>
          La plataforma CuyIT está destinada exclusivamente a personas mayores de 18 años.
          Al registrarte o utilizar nuestros servicios, declarás y garantizás que tenés 18
          (dieciocho) años o más. Nos reservamos el derecho de solicitar documentos que
          acrediten tu edad y de suspender o cerrar cuentas cuando identifiquemos el uso por
          parte de menores de edad o dudas razonables sobre la veracidad de la información
          provista.
        </p>
        <p className="mt-2">
          Si tomás conocimiento de que un menor de 18 años utiliza CuyIT, por favor
          notificanos de inmediato a{" "}
          <a href="mailto:info@cuyit.com" className="underline">info@cuyit.com</a>.
        </p>
      </>
    ),
  },  
];

export default function TermsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Términos y Condiciones • CuyIT";
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
      <BackBar title="Términos y condiciones" />

      {/* separación del BackBar */}
      <main className="mx-auto max-w-4xl px-4 pt-8 pb-12">
        <header className="mb-6">
          <p className="text-sm text-gray-600">
            Última actualización: <span className="font-medium text-gray-800">8 de octubre de 2025</span>
          </p>
          <div className="mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm">
              <span className="font-medium">Titular del Servicio:</span> CuyIT (la “Empresa”) —{" "}
              <span className="font-medium">Contacto:</span>{" "}
              <a href="mailto:info@cuyit.com" className="underline">info@cuyit.com</a>
            </p>
          </div>

          <div className="mt-4">
            <button
              onClick={() => setAll(!allOpen)}
              className="rounded-lg bg-[#0a0e17] px-3 py-1.5 text-sm font-semibold text-white hover:bg-black active:opacity-90 transition"
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
                  className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition
                    ${isOpen
                      ? "bg-[#0a0e17] text-white hover:bg-black"
                      : "bg-[#0a0e17]/5 hover:bg-[#0a0e17]/10 text-[#0a0e17]"}
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
          El uso de la plataforma implica la aceptación de estas Condiciones y de la Política de
          Privacidad. Conservá una copia para tu referencia.
        </p>
      </main>
    </div>
  );
}
