import React from "react";
import { motion } from "framer-motion";
import { LuMapPin, LuClock, LuShieldCheck } from "react-icons/lu";


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
  return (
    <section id="como-funciona" className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-14"
        >
          ¿Cómo funciona?
        </motion.h2>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.6 }}
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
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorksSection;
