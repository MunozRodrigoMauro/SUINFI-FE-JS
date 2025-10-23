// src/pages/RequestServicePage.jsx
import React, { useEffect } from "react";
import { useSearch } from "../context/SearchContext";
import LocationStep from "../components/Shared/LocationStep";
import ServiceStep from "../components/Shared/ServiceStep";
import WhenStep from "../components/Shared/WhenStep";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Dónde → Qué → Cuándo.
 * Mobile: layout compacto (menos padding arriba/abajo).
 * Desktop: igual que venías usando.
 */

export default function RequestServicePage() {
  const {
    state,
    setStep,
    setLocation,
    addService,
    removeService,
    setIntent,
    setRadius,
    finishSearch,
  } = useSearch();

  const step = state.step;
  const { location, serviceIds, intent, radiusKm } = state.query;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  const nextStep = () => setStep(state.step + 1);
  const prevStep = () => setStep(state.step - 1);

  return (
    <div
      className={`
        /* ↓↓↓ Ajuste clave SOLO mobile ↓↓↓ */
        min-h-[100dvh]                     
        /* evita scroll fantasma en iOS */
        bg-[#f7f7f2] text-slate-900
        flex flex-col
        justify-start pt-20 pb-24           
        sm:justify-center sm:pt-12 sm:pb-12
        lg:pt-20 lg:pb-10
        px-4
      `}
    >
      {/* Header */}
      <header
        className={`
          w-full mx-auto text-center
          max-w-sm sm:max-w-2xl
          mb-4 sm:mb-8                    
        `}
      >
        <h1 className="text-[22px] sm:text-4xl font-bold tracking-tight leading-tight mb-1 sm:mb-2 text-[#1f2a44]">
          Encontrá al profesional ideal
        </h1>
        <p className="text-slate-600 text-sm sm:text-base">
          En menos de un minuto, CuyIT te conecta con quien necesitás.
        </p>
      </header>

      {/* Steps container */}
      <div
        className={`
          w-full mx-auto
          max-w-sm sm:max-w-2xl
          flex flex-col items-center
          gap-3 sm:gap-4
        `}
      >
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <LocationStep
                value={location}
                onChange={(loc) => setLocation(loc)}
                onConfirm={nextStep}
              />
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <ServiceStep
                selectedIds={serviceIds}
                onAdd={addService}
                onRemove={removeService}
                onConfirm={nextStep}
              />
              <button
                onClick={prevStep}
                className="mt-3 sm:mt-4 text-slate-600 hover:text-slate-800 text-xl underline font-bold cursor-pointer"
              >
                ← VOLVER
              </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.35 }}
              className="w-full"
            >
              <WhenStep
                intent={intent}
                onIntent={setIntent}
                radiusKm={radiusKm}
                onRadius={setRadius}
                onFinish={finishSearch}
              />
              <button
                onClick={prevStep}
                className="mt-3 sm:mt-4 text-slate-600 hover:text-slate-800 text-xl underline font-bold cursor-pointer"
              >
                ← VOLVER
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="mt-4 sm:mt-6 flex justify-center gap-2">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className={`h-2 w-8 rounded-full transition-all ${
                step === n ? "bg-emerald-500 w-10" : "bg-slate-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
