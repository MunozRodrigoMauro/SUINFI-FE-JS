import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { LuMapPin, LuClock, LuShieldCheck } from "react-icons/lu";
// 🟢 CAMBIO: necesitamos location para leer state.focusSection cuando venimos redirigidos desde otra página
import { useLocation } from "react-router-dom";

/* ======== contenido ======== */
const steps = [
  {
    icon: <LuMapPin className="w-12 h-12" />,
    title: "Geolocalización inteligente",
    desc: "Encontrá al profesional más cercano según dónde esté en este momento. Como pedir un auto, pero con expertos.",
  },
  {
    icon: <LuClock className="w-12 h-12" />,
    title: "Disponibilidad en tiempo real",
    desc: "Ves quién está libre AHORA mismo. Reservá y recibí ayuda al instante, sin esperar turnos.",
  },
  {
    icon: <LuShieldCheck className="w-12 h-12" />,
    title: "Confianza 24/7",
    desc: "Perfiles verificados con CV, reseñas, puntuación y precio claro. Disponible las 24 horas.",
  },
];

function HowItWorksSection() {
  const sectionRef = useRef(null);
  const overlayRef = useRef(null);
  // 🟢 CAMBIO:
  const location = useLocation();

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const overlayEl = overlayRef.current;
    if (!sectionEl || !overlayEl) return;

    const OFFSET = 64;     // por si tenés navbar fija
    const DURATION = 1200; // ms que dura el halo

    const glowClasses = [
      "ring-4",
      "ring-emerald-400/60",
      "shadow-emerald-300/40",
      "shadow-[0_20px_70px_var(--tw-shadow-color)]",
      "transition-shadow",
      "duration-300",
      "rounded-2xl",
      "outline-none",
    ];

    let timer;

    const addGlow = () => {
      sectionEl.classList.add(...glowClasses);
      overlayEl.classList.add("opacity-100");
      clearTimeout(timer);
      timer = setTimeout(removeGlow, DURATION);
    };

    const removeGlow = () => {
      sectionEl.classList.remove(...glowClasses);
      overlayEl.classList.remove("opacity-100");
    };

    const cancelEarly = () => {
      clearTimeout(timer);
      removeGlow();
      unbindCancel();
    };

    const bindCancel = () => {
      window.addEventListener("wheel", cancelEarly, { passive: true });
      window.addEventListener("touchstart", cancelEarly, { passive: true });
      window.addEventListener("keydown", cancelEarly);
    };

    const unbindCancel = () => {
      window.removeEventListener("wheel", cancelEarly, { passive: true });
      window.removeEventListener("touchstart", cancelEarly, { passive: true });
      window.removeEventListener("keydown", cancelEarly);
    };

    const smoothToSection = () => {
      const y = sectionEl.getBoundingClientRect().top + window.scrollY - OFFSET;
      addGlow();
      bindCancel();
      // incluso si casi no hay scroll, aplicamos el halo igual
      window.scrollTo({ top: y, behavior: "smooth" });
    };

    // Intercepta clicks a #aspectos-clave y #como-funciona
    const clickDelegate = (e) => {
      const a = e.target.closest('a[href="#aspectos-clave"], a[href="#como-funciona"]');
      if (!a) return;
      e.preventDefault();
      smoothToSection();
      // Actualizar hash sin saltar de golpe
      history.pushState(null, "", "#aspectos-clave");
    };
    document.addEventListener("click", clickDelegate);

    // Si llegan por hash directo
    const handleHash = () => {
      if (location.hash === "#aspectos-clave" || location.hash === "#como-funciona") {
        // pequeño delay para asegurar layout
        setTimeout(smoothToSection, 50);
      }
    };
    handleHash();
    window.addEventListener("hashchange", handleHash);

    // 🟢 CAMBIO: si venimos desde otra página con state.focusSection, scrollear + glow
    if (location?.state && location.state.focusSection === "aspectos-clave") {
      setTimeout(() => {
        smoothToSection();
        // sincronizamos el hash para que quede compartible
        history.replaceState(null, "", "#aspectos-clave");
      }, 80);
    }

    return () => {
      document.removeEventListener("click", clickDelegate);
      window.removeEventListener("hashchange", handleHash);
      unbindCancel();
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location?.state]); // 🟢 CAMBIO: dependemos del state por si se reutiliza el componente
  // (el resto queda igual)

  return (
    <section
      ref={sectionRef}
      id="aspectos-clave"
      className="relative py-20 bg-gradient-to-b from-gray-50 to-white rounded-2xl scroll-mt-24"
    >
      {/* Ancla legacy para no romper enlaces existentes */}
      <span id="como-funciona" className="absolute -top-24" aria-hidden="true" />

      {/* Overlay para sombreado/iluminación al focalizar */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-500 
                   bg-emerald-200/20"
      />

      <div className="max-w-6xl mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-14"
        >
          Aspectos clave
        </motion.h2>

        <ul role="list" className="grid md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <motion.li
              role="listitem"
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="bg-white rounded-2xl p-8 shadow-md hover:shadow-xl transition flex flex-col items-center"
            >
              <motion.div
                whileInView={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, delay: i * 0.3 }}
                className="mb-5"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-lg">
                  {step.icon}
                </div>
              </motion.div>
              <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
              <p className="text-gray-600 text-sm">{step.desc}</p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default HowItWorksSection;
