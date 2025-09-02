import React, { useMemo, useState } from "react";

const LABELS = ["Terrible", "Malo", "Aceptable", "Bueno", "Excelente"];

export default function StarRating({
  value = 0,           // 0 = vacío (se ve como Google antes de elegir)
  onChange,
  size = 28,
  readOnly = false,
  className = "",
}) {
  const [hover, setHover] = useState(0);

  const shown = hover || value; // previsualiza en hover
  const label = useMemo(() => (shown ? LABELS[shown - 1] : "Elegí una calificación"), [shown]);

  const setVal = (n) => {
    if (readOnly) return;
    const v = Math.max(1, Math.min(5, Number(n)));
    onChange?.(v);
  };

  const onKeyDown = (e) => {
    if (readOnly) return;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setVal((value || 0) + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setVal((value || 0) - 1);
    } else if (e.key === "0") {
      e.preventDefault();
      onChange?.(0);
    }
  };

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className="inline-flex items-center gap-1"
        role="radiogroup"
        aria-label="Calificación"
        tabIndex={0}
        onKeyDown={onKeyDown}
        onMouseLeave={() => setHover(0)}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const filled = shown >= i;
          return (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={value === i}
              disabled={readOnly}
              onMouseEnter={() => !readOnly && setHover(i)}
              onClick={() => setVal(i)}
              className="leading-none select-none transition-transform hover:scale-110 focus:outline-none"
              style={{ fontSize: size, lineHeight: 1 }}
              title={`${i} estrella${i > 1 ? "s" : ""}`}
            >
              {filled ? "⭐" : "☆"}
            </button>
          );
        })}
      </div>
      <span className="text-sm text-gray-600">{label}</span>
    </div>
  );
}
