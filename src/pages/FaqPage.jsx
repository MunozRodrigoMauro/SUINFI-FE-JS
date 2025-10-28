// src/pages/FaqPage.jsx
import React, { useEffect, useState } from "react";
import BackBar from "../components/layout/BackBar";

/** Chevron reutilizable (igual que en TermsPage) */
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

/** FAQ como acordeones planos (mismo patrón visual que TermsPage) */
const FAQ_ITEMS = [
  // =======================
  // Usuarios (Clientes)
  // =======================
  {
    id: "u-que-es",
    group: "Para Usuarios (Clientes)",
    question: "1) ¿Qué es CuyIT?",
    answer: (
      <p>
        CuyIT es una plataforma que conecta usuarios con profesionales en tiempo real,algunos verificados y otros no, de distintos
        rubros para la prestación de servicios, facilitando la solicitud, pago y calificación.
      </p>
    ),
  },
  {
    id: "u-solicitud",
    group: "Para Usuarios (Clientes)",
    question: "2) ¿Cómo solicito un servicio?",
    answer: (
      <p>
        Ingresás a la app/web, seleccionás el tipo de servicio, describís lo que necesitás, elegís
        un profesional disponible o programado (o esperás que se asigne uno), y realizás la reserva, algunos servicios requieren el pago de una seña a través de la
        plataforma.
      </p>
    ),
  },
  {
    id: "u-pago",
    group: "Para Usuarios (Clientes)",
    question: "3) ¿Cómo funciona el pago?",
    answer: (
      <p>
        El pago se realiza dentro de CuyIT a través de medios admitidos (p. ej., Mercado Pago).
        CuyIT puede retener el pago hasta tu confirmación de servicio satisfactorio; ver condiciones
        aplicables en los Términos.
      </p>
    ),
  },
  {
    id: "u-incumplimiento",
    group: "Para Usuarios (Clientes)",
    question: "4) ¿Qué sucede si el profesional no cumple con lo pactado?",
    answer: (
      <p>
        Podés reportarlo al soporte. Según evaluación y Términos, CuyIT puede retener/devolver el
        pago, o aplicar medidas sobre la cuenta del profesional.
      </p>
    ),
  },
  {
    id: "u-calificacion",
    group: "Para Usuarios (Clientes)",
    question: "5) ¿Puedo calificar al profesional?",
    answer: (
      <p>
        Sí. Al finalizar el servicio podrás dejar una calificación y reseña para favorecer la
        transparencia y calidad de la comunidad.
      </p>
    ),
  },
  {
    id: "u-costo",
    group: "Para Usuarios (Clientes)",
    question: "6) ¿Tiene costo usar la app como usuario?",
    answer: (
      <p>
        No hay membresía básica. Solo pagás la seña de los servicios que solicitás (Si aplica).
      </p>
    ),
  },
  {
    id: "u-cancelacion",
    group: "Para Usuarios (Clientes)",
    question: "7) ¿Qué política de cancelación existe para el usuario?",
    answer: (
      <p>
        Depende del estado del servicio. Si cancelás antes de iniciar, puede corresponder devolución
        parcial/total; si ya está en curso, puede no aplicar. Consultá la política vigente en los
        Términos y en el flujo de pago con atención al cliente.
      </p>
    ),
  },
  {
    id: "u-disponibilidad",
    group: "Para Usuarios (Clientes)",
    question: "8) ¿Dónde está disponible CuyIT?",
    answer: (
      <p>
        Actualmente en Argentina (y otras zonas que la plataforma irá habilitando). Verificá cobertura en
        la app/web.
      </p>
    ),
  },

  // =======================
  // Profesionales
  // =======================
  {
    id: "p-registro",
    group: "Para Profesionales (Prestadores)",
    question: "1) ¿Cómo me registro como profesional?",
    answer: (
      <p>
        Completás el formulario de registro en la app/web, rellenas todos los campos necesarios para tener más posibilidades de conseguir empleo, adjuntás tu identidad
        y aceptás los Términos de CuyIT.
      </p>
    ),
  },
  {
    id: "p-requisitos",
    group: "Para Profesionales (Prestadores)",
    question: "2) ¿Qué requisitos tengo que cumplir?",
    answer: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Ser mayor de 18 años.</li>
        <li>Poseer documento de identidad válido.</li>
        <li>Tener un medio de cobro habilitado.</li>
        <li>En algunos rubros: acreditar matrícula/certificaciones.</li>
      </ul>
    ),
  },
  {
    id: "p-cobro",
    group: "Para Profesionales (Prestadores)",
    question: "3) ¿Cómo y cuándo cobro?",
    answer: (
      <p>
        Una vez que el usuario confirma la prestación satisfactoria se te notifica, se acredita el pago en tu
        balance en CuyIT y podés solicitar la transferencia a tu cuenta/billetera registrada.
      </p>
    ),
  },
  {
    id: "p-comision",
    group: "Para Profesionales (Prestadores)",
    question: "4) ¿Existe comisión para profesionales?",
    answer: (
      <p>
        Por ahora es totalmente gratuito. La tasa exacta se informará en la plataforma o contrato
        correspondiente en caso de que CuyIT decida implementar comisiones.
      </p>
    ),
  },
  {
    id: "p-disponibilidad",
    group: "Para Profesionales (Prestadores)",
    question: "5) ¿Puedo elegir mis horarios y disponibilidad?",
    answer: (
      <p>
        Sí. Podés activar/desactivar “Disponible ahora” manualmente, pero recomendamos programar agenda desde tu panel.
      </p>
    ),
  },
  {
    id: "p-resenas",
    group: "Para Profesionales (Prestadores)",
    question: "6) ¿Qué pasa con las reseñas de usuarios?",
    answer: (
      <p>
        Los usuarios pueden calificar y opinar sobre tu trabajo. Esto impacta en visibilidad y
        reputación dentro de CuyIT.
      </p>
    ),
  },
  {
    id: "p-cancelaciones",
    group: "Para Profesionales (Prestadores)",
    question: "7) ¿Qué sucede si un usuario cancela o no paga?",
    answer: (
      <p>
        Se aplican las reglas de cancelación/pago vigentes en los Términos y en el procesador
        de pago. CuyIT evaluará cada caso según la evidencia disponible.
      </p>
    ),
  },

  // =======================
  // Seguridad, Datos y Responsabilidad
  // =======================
  {
    id: "s-datos",
    group: "Seguridad, Datos y Responsabilidad",
    question: "1) ¿Cómo protege CuyIT mis datos personales?",
    answer: (
      <p>
        Implementamos medidas como cifrado en tránsito, controles de acceso y políticas de
        privacidad conforme a la normativa argentina vigente.
      </p>
    ),
  },
  {
    id: "s-responsabilidad",
    group: "Seguridad, Datos y Responsabilidad",
    question: "2) ¿Cuál es la responsabilidad de CuyIT frente al servicio prestado?",
    answer: (
      <p>
        CuyIT actúa como intermediario tecnológico. No presta el servicio directamente; la
        ejecución es responsabilidad del cliente y el profesional. Ver límites y alcances en los Términos.
      </p>
    ),
  },
  {
    id: "s-jurisdiccion",
    group: "Seguridad, Datos y Responsabilidad",
    question: "3) ¿En qué jurisdicción opera CuyIT?",
    answer: (
      <p>
        Según Términos, aplica legislación argentina y la jurisdicción allí indicada (p. ej.,
        Tribunales Ordinarios de San Juan, salvo vía de consumo). Confirmá en el documento oficial.
      </p>
    ),
  },

  // =======================
  // Otros
  // =======================
  {
    id: "o-dispositivos",
    group: "Otros",
    question: "1) ¿Puedo usar CuyIT desde web y móvil?",
    answer: <p>No. Por ahora solo disponible vía web y pronto estará disponble la app móvil.</p>,
  },
  {
    id: "o-categorias",
    group: "Otros",
    question: "2) ¿Se puede cambiar de plan o categoría de servicio?",
    answer: (
      <p>
        Sí, cuando esté permitido. Puede requerir actualización de perfil o verificación adicional
        según el rubro.
      </p>
    ),
  },
  {
    id: "o-fraude",
    group: "Otros",
    question: "3) ¿Qué hago si detecto conducta inapropiada o fraude?",
    answer: (
      <p>
        Reportalo a soporte, a través de la reserva, una vez completado el servicio o atención al cliente desde cualquier medio. CuyIT puede suspender/eliminar cuentas que infrinjan Términos o
        políticas de seguridad.
      </p>
    ),
  },
];

export default function FaqPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
    document.title = "Preguntas Frecuentes • CuyIT";
  }, []);

  // estado abierto/cerrado por item
  const [open, setOpen] = useState(() =>
    Object.fromEntries(FAQ_ITEMS.map((f) => [f.id, false]))
  );
  const allOpen = Object.values(open).every(Boolean);
  const toggle = (id) => setOpen((o) => ({ ...o, [id]: !o[id] }));
  const setAll = (v) =>
    setOpen(Object.fromEntries(FAQ_ITEMS.map((f) => [f.id, !!v])));

  // Agrupar por "group" para mostrar bloques con subtítulo
  const groups = FAQ_ITEMS.reduce((acc, f) => {
    acc[f.group] = acc[f.group] || [];
    acc[f.group].push(f);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-white text-[#0a0e17]">
      <BackBar title="Preguntas Frecuentes (FAQ)" />

      {/* separación del BackBar */}
      <main className="mx-auto max-w-4xl px-4 pt-8 pb-12">
        <header className="mb-6">
          <p className="text-sm text-gray-600">
            Esta sección resume puntos clave. Ante diferencias, prevalecen los{" "}
            <a href="/terms" className="underline">Términos y Condiciones</a>.
          </p>
          <div className="mt-4">
            <button
              onClick={() => setAll(!allOpen)}
              className="rounded-lg bg-[#0a0e17] px-3 py-1.5 text-sm font-semibold text-white hover:bg-black active:opacity-90 transition"
            >
              {allOpen ? "Colapsar todo" : "Expandir todo"}
            </button>
          </div>
        </header>

        {/* Bloques por grupo */}
        <div className="space-y-8">
          {Object.entries(groups).map(([groupName, items]) => (
            <section key={groupName}>
              <h2 className="mb-3 text-lg font-semibold">{groupName}</h2>
              <div className="space-y-3">
                {items.map((f) => {
                  const isOpen = open[f.id];
                  return (
                    <article
                      key={f.id}
                      className={`rounded-2xl border transition ${
                        isOpen ? "border-[#0a0e17]" : "border-[#0a0e17]/10"
                      }`}
                    >
                      <button
                        onClick={() => toggle(f.id)}
                        aria-expanded={isOpen}
                        className={`group flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left transition
                          ${isOpen
                            ? "bg-[#0a0e17] text-white hover:bg-black"
                            : "bg-[#0a0e17]/5 hover:bg-[#0a0e17]/10 text-[#0a0e17]"}
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0a0e17]/50`}
                      >
                        <span className="font-semibold">{f.question}</span>
                        <Chevron open={isOpen} />
                      </button>

                      <div className={`${isOpen ? "block" : "hidden"} px-4 pb-4 pt-3`}>
                        <div className="prose max-w-none prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0.5">
                          {f.answer}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
