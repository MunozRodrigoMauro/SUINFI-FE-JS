// src/components/map/ProfessionalRequest/ProfessionalRequest.jsx
// CHANGES: Refactor completo al flujo DÓNDE → QUÉ → CUÁNDO.
// - No mostramos el mapa hasta completar los 3 pasos.
// - Integra SearchContext y componentes de pasos.
// - Mantiene nombres/estructura de carpeta original.

import React, { useMemo } from "react";
import { useSearch } from "../../../context/SearchContext";
import LocationStep from "../../Shared/LocationStep";
import ServiceStep from "../../Shared/ServiceStep";
import WhenStep from "../../Shared/WhenStep";
import MapCanvas from "./MapCanvas";

export default function ProfessionalRequest() {
  const {
    state: { step, query },
    setStep,
    setLocation,
    addService,
    removeService,
    setIntent,
    setRadius,
  } = useSearch();

  const canStep2 = useMemo(() => !!(query.location.lat && query.location.lng), [query.location.lat, query.location.lng]);
  const canStep3 = useMemo(() => query.serviceIds.length > 0, [query.serviceIds.length]);
  const isReady = useMemo(() => canStep2 && canStep3 && !!query.intent, [canStep2, canStep3, query.intent]);

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Paso indicators */}
      <div className="mb-6 grid grid-cols-3 gap-2 text-sm">
        <div className={`px-3 py-2 rounded-xl border ${step >= 1 ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300"}`}>1) Dónde</div>
        <div className={`px-3 py-2 rounded-xl border ${step >= 2 ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300"}`}>2) Qué</div>
        <div className={`px-3 py-2 rounded-xl border ${step >= 3 ? "bg-slate-900 text-white border-slate-900" : "bg-white border-slate-300"}`}>3) Cuándo</div>
      </div>

      {/* Paso 1 */}
      {step === 1 && (
        <div className="rounded-2xl border p-4 bg-white">
          <LocationStep
            value={query.location}
            onChange={(loc) => setLocation(loc)}
            onConfirm={() => setStep(2)}
          />
        </div>
      )}

      {/* Paso 2 */}
      {step === 2 && (
        <div className="rounded-2xl border p-4 bg-white">
          <ServiceStep
            selectedIds={query.serviceIds}
            onAdd={addService}
            onRemove={removeService}
            onConfirm={() => canStep2 && setStep(3)}
          />
          {!canStep2 && (
            <p className="mt-3 text-xs text-red-600">
              Primero confirmá la ubicación para continuar.
            </p>
          )}
        </div>
      )}

      {/* Paso 3 */}
      {step === 3 && (
        <div className="rounded-2xl border p-4 bg-white">
          <WhenStep
            intent={query.intent}
            onIntent={setIntent}
            radiusKm={query.radiusKm}
            onRadius={setRadius}
            onFinish={() => { /* solo mostramos resultados abajo (mapa) */ }}
          />
          {!canStep3 && (
            <p className="mt-3 text-xs text-red-600">
              Seleccioná al menos un servicio para continuar.
            </p>
          )}
        </div>
      )}

      {/* Resultados: Mapa + (en el futuro) lista de profesionales */}
      {isReady && (
        <div className="mt-6">
          <div className="mb-2 text-sm text-slate-600">
            Resultados en <strong>{query.location.label || "tu zona"}</strong> — radio {query.radiusKm} km — {query.intent === "now" ? "Disponibles ahora" : "Programados"}.
          </div>
          <MapCanvas
            // CHANGES: mostramos el mapa recién cuando el flujo está listo
            center={{ lat: query.location.lat, lng: query.location.lng }}
            zoom={13}
            markers={[]}
            radiusKm={query.radiusKm}
            draggableOrigin={false}
          />
        </div>
      )}
    </div>
  );
}
