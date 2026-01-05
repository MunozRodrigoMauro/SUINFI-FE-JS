// src/components/home/HowItWorksSection.jsx
import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { LuMapPin, LuClock, LuShieldCheck, LuSmartphone, LuSparkles } from "react-icons/lu";
// 🟢 CAMBIO: necesitamos location para leer state.focusSection cuando venimos redirigidos desde otra página
import { useLocation } from "react-router-dom";

/* ======== contenido ======== */
// ⭐ SEO: Textos optimizados para posicionar CuyIT como solución tecnológica y no burocrática.
const steps = [
  {
    icon: <LuMapPin className="w-10 h-10 md:w-12 md:h-12" />,
    title: "Geolocalización CuyIT",
    desc: "Nuestro algoritmo encuentra al profesional verificado más cercano a tu ubicación exacta. CuyIT funciona como un radar de servicios en tiempo real.",
  },
  {
    icon: <LuClock className="w-10 h-10 md:w-12 md:h-12" />,
    title: "Reserva Instantánea",
    desc: "Sin llamadas interminables. En CuyIT ves quién está libre ahora mismo, reservás y recibís ayuda al instante. Priorizamos tu tiempo.",
  },
  {
    icon: <LuShieldCheck className="w-10 h-10 md:w-12 md:h-12" />,
    title: "Seguridad Garantizada",
    desc: "Perfiles con identidad validada, reseñas reales y precios transparentes. La IA de CuyIT asegura el match perfecto y pagos protegidos.",
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
      "rounded-3xl", // Cambio visual: bordes más redondeados
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
      // eslint-disable-next-line no-restricted-globals
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
        // eslint-disable-next-line no-restricted-globals
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

  return (
    <section
      ref={sectionRef}
      id="aspectos-clave"
      className="relative py-24 bg-gradient-to-b from-gray-50 via-white to-gray-50 rounded-3xl scroll-mt-24"
    >
      {/* Ancla legacy para no romper enlaces existentes */}
      <span id="como-funciona" className="absolute -top-24" aria-hidden="true" />

      {/* Overlay para sombreado/iluminación al focalizar */}
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 
                   bg-emerald-100/30 mix-blend-multiply"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
            {/* ⭐ SEO: Título explícito de la marca */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 mb-6 tracking-tight">
              ¿ Por qué elegir <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">CuyIT</span> ?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-gray-600 mb-8">
              La evolución de los servicios profesionales. Tecnología, rapidez y confianza en una sola plataforma.
            </p>
        </motion.div>

        {/* 🟢 CAMBIO: badge destacando que la app móvil de CuyIT viene muy pronto */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="mx-auto mb-16 inline-flex items-center gap-3 px-6 py-2.5 rounded-full 
                     bg-gray-900 text-white shadow-xl ring-2 ring-emerald-500/50"
          aria-label="CuyIT app móvil muy pronto"
        >
          <LuSmartphone className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold tracking-wide uppercase">
            CuyIT App · Próximamente
          </span>
          <LuSparkles className="w-5 h-5 text-yellow-400" />
        </motion.div>

        <ul role="list" className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {steps.map((step, i) => (
            <motion.li
              role="listitem"
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              viewport={{ once: true }}
              whileHover={{ y: -10 }}
              className="group bg-white rounded-3xl p-8 lg:p-10 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.08)] 
                         hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.15)] 
                         transition-all duration-300 border border-gray-100 flex flex-col items-center relative overflow-hidden"
            >
              {/* Decoración de fondo en hover */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              
              <motion.div
                whileInView={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1, delay: i * 0.3 }}
                className="mb-6 relative"
              >
                <div className="absolute inset-0 bg-emerald-200/40 blur-xl rounded-full scale-150 opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center text-emerald-600 shadow-inner group-hover:text-emerald-700 group-hover:scale-110 transition-transform">
                  {step.icon}
                </div>
              </motion.div>
              
              <h3 className="text-2xl font-bold mb-4 text-gray-800 group-hover:text-emerald-700 transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {step.desc}
              </p>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default HowItWorksSection;