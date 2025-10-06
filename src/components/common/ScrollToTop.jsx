// src/components/common/ScrollToTop.jsx
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * 🟢 ScrollToTop
 * Este componente hace scroll automático hacia arriba cada vez que cambia la ruta.
 * Es ideal para evitar que el usuario quede "a mitad de página"
 * cuando entra desde otra sección o hace clic en un enlace.
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Si hay hash (por ejemplo #aspectos-clave), no forzamos el scroll
    if (hash) return;

    // Desplaza suavemente hasta arriba de todo
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, hash]);

  return null; // no renderiza nada visualmente
}
