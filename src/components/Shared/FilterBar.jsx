// src/components/Shared/FilterBar.jsx
import React from "react";

/*
  [CHANGE] Nuevo prop: `scrolledLikeNavbar` (bool).
  - Si true: el wrapper es TRANSPARENTE (sin ring, sin radius, sin blur propio)
    para fundirse con el gradiente/blur del navbar padre.
  - Si false: mantiene tu look "glass" original.

  [CHANGE] Importante:
  - Se alineó la API del select "Documentos" con el Dashboard:
    usamos `docs` como key y valores "any" | "criminal" | "license" | "both".
*/

export default function FilterBar({ value, onChange, scrolledLikeNavbar = false, lockAvailableNow = false }) {
  const v = {
    availableNow: false,
    linkedIn: false,
    whatsapp: false,
    deposit: false,
    hasPhoto: false,
    docs: "any",          // [CHANGE] <— antes `documents`
    minRating: 0,
    sort: "relevance",
    ...(value || {}),
  };

  const pillBase =
    "inline-flex items-center gap-1.5 h-8 px-3 rounded-full border text-xs transition select-none";
  const pillOff = "bg-white text-[#0a0e17] border-white";
  const pillOn = "bg-[#0a0e17] text-white border-white/20";

  const Toggle = ({ label, keyName }) => {
    const active = !!v[keyName];
    const disabled = keyName === "availableNow" && lockAvailableNow;

    return (
      <button
        type="button"
         aria-disabled={disabled ? "true" : "false"}
  title={disabled ? "Bloqueado por 'Disponibles ahora'" : label}
  className={`${pillBase} ${active ? pillOn : pillOff} ${disabled ? "opacity-50 cursor-not-allowed ring-1 ring-white/40" : ""}`} 
        onMouseEnter={(e) => {
          if (disabled) return;
          if (!active) {
            e.currentTarget.classList.remove("bg-white", "text-[#0a0e17]");
            e.currentTarget.classList.add("bg-[#0a0e17]", "text-white");
          }
        }}
        onMouseLeave={(e) => {
           if (disabled) return; 
          if (!active) {
            e.currentTarget.classList.remove("bg-[#0a0e17]", "text-white");
            e.currentTarget.classList.add("bg-white", "text-[#0a0e17]");
          }
        }}
        onClick={() => {
  if (disabled) return;        // ← salí temprano si está bloqueado
  onChange?.({ ...v, [keyName]: !active });
}}
      >
        <span className={"h-2 w-2 rounded-full " + (active ? "bg-emerald-400" : "bg-slate-300")} />
        {label}
      </button>
    );
  };

  const Label = ({ children, className = "" }) => (
    <span className={`text-xs text-white/80 hidden lg:inline-block ${className}`}>{children}</span>
  );

  // [CHANGE] Wrapper: transparente cuando se acopla al navbar
  const wrapperClasses = scrolledLikeNavbar
    ? "w-full px-2 sm:px-3 py-2 transition-all duration-500 bg-transparent rounded-none ring-0 backdrop-blur-0 -mt-px"
    : "w-full px-3 py-2 transition-all duration-500 rounded-2xl bg-white/10 ring-1 ring-white/10 backdrop-blur-sm";

  // —— Sólo mobile: estado para desplegar el panel
  const [open, setOpen] = React.useState(false);

  return (
    <div className={wrapperClasses}>
      {/* ===== Desktop/Web (SIN CAMBIOS) ===== */}
      <div
        className="
          hidden lg:flex items-center gap-2 gap-y-2 flex-wrap
          overflow-x-visible whitespace-normal
        "
      >
        {/* Píldoras */}
        <div className="flex items-center gap-2 flex-wrap">
          <Toggle keyName="availableNow" label="Disponibles ahora" />
          <Toggle keyName="linkedIn" label="Con LinkedIn" />
          <Toggle keyName="whatsapp" label="Con WhatsApp" />
          <Toggle keyName="deposit" label="Requiere seña" />
          <Toggle keyName="hasPhoto" label="Con foto" />
        </div>

        {/* divisor */}
        <div className="hidden lg:block h-6 w-px bg-white/20 mx-1" />

        {/* Selects */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          <Label>Documentos</Label>
          <Select
            // [CHANGE] usamos v.docs (no v.documents)
            value={v.docs}
            onChange={(e) => onChange?.({ ...v, docs: e.target.value })}
            options={[
              { value: "any", label: "Cualquiera" },
              { value: "criminal", label: "Antecedentes" }, // [CHANGE] valores alineados
              { value: "license", label: "Matrícula" },
              { value: "both", label: "Ambos" },
            ]}
          />

          <Label className="ml-1">Rating</Label>
          <Select
            value={String(v.minRating)}
            onChange={(e) => onChange?.({ ...v, minRating: Number(e.target.value) })}
            options={[
              { value: "0", label: "Todos" },
              { value: "3", label: "≥ 3.0" },
              { value: "4", label: "≥ 4.0" },
              { value: "4.5", label: "≥ 4.5" },
            ]}
          />
        </div>

        {/* Orden */}
        <div className="lg:ml-auto flex items-center gap-2 w-full sm:w-auto">
          <Label className="hidden sm:inline-block">Ordenar por</Label>
          <Select
            value={v.sort}
            onChange={(e) => onChange?.({ ...v, sort: e.target.value })}
            options={[
              { value: "relevance", label: "Relevancia" },
              { value: "distance", label: "Distancia" },
              { value: "rating", label: "Mejor rating" },
            ]}
          />
        </div>
      </div>

      {/* ===== Mobile (NUEVO) ===== */}
      <div className="block lg:hidden">
        {/* Barra compacta: solo “Con foto” + botón “+ Filtros” a la derecha */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Toggle keyName="hasPhoto" label="Con foto" />
          </div>

          <button
            type="button"
            onClick={() => setOpen((s) => !s)}
            className={`
              inline-flex items-center gap-1 h-8 px-3 rounded-full border text-xs
              bg-white text-[#0a0e17] border-white
              active:scale-[0.98]
              hover:bg-white/90 hover:shadow-sm
            `}
            aria-expanded={open ? "true" : "false"}
            aria-label={open ? "Cerrar filtros" : "Abrir filtros"}
            title={open ? "Cerrar filtros" : "Abrir filtros"}
          >
            {open ? "Cerrar" : "+ Filtros"}
            <svg
              aria-hidden="true"
              className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" />
            </svg>
          </button>
        </div>

        {/* Panel desplegable con el RESTO de los filtros (sin repetir “Con foto”) */}
        {open && (
          <div
            className="
              mt-2 rounded-xl bg-white/8 ring-1 ring-white/10 backdrop-blur-sm
              p-3 space-y-3
            "
          >
            {/* Toggles adicionales */}
            <div className="flex items-center gap-2 flex-wrap">
              <Toggle keyName="availableNow" label="Disponibles ahora" />
              <Toggle keyName="linkedIn" label="Con LinkedIn" />
              <Toggle keyName="whatsapp" label="Con WhatsApp" />
              <Toggle keyName="deposit" label="Requiere seña" />
            </div>

            {/* Selects en dos filas ordenadas */}
            <div className="flex items-center gap-2">
              <Select
                value={v.docs}
                onChange={(e) => onChange?.({ ...v, docs: e.target.value })}
                options={[
                  { value: "any", label: "Cualquiera" },
                  { value: "criminal", label: "Antecedentes" },
                  { value: "license", label: "Matrícula" },
                  { value: "both", label: "Ambos" },
                ]}
              />
              <Select
                value={String(v.minRating)}
                onChange={(e) => onChange?.({ ...v, minRating: Number(e.target.value) })}
                options={[
                  { value: "0", label: "Todos" },
                  { value: "3", label: "≥ 3.0" },
                  { value: "4", label: "≥ 4.0" },
                  { value: "4.5", label: "≥ 4.5" },
                ]}
              />
            </div>

            <div className="flex items-center gap-2">
              <Select
                value={v.sort}
                onChange={(e) => onChange?.({ ...v, sort: e.target.value })}
                options={[
                  { value: "relevance", label: "Relevancia" },
                  { value: "distance", label: "Distancia" },
                  { value: "rating", label: "Mejor rating" },
                ]}
              />

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="ml-auto inline-flex items-center h-8 px-3 rounded-full border text-xs bg-white text-[#0a0e17] border-white hover:bg-white/90"
                title="Cerrar filtros"
              >
                Cerrar filtros
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={onChange}
      className="
        h-8 px-3 rounded-full
        bg-white text-[#0a0e17] border border-white
        text-xs
        focus:outline-none focus:ring-2 focus:ring-white/30
      "
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
