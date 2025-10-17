import React, { useState } from "react";
import { FaInstagram, FaTwitter, FaLinkedin, FaChevronDown, FaFacebook, FaWhatsapp } from "react-icons/fa";
import { useAuth } from "../../auth/AuthContext";
// 🟢 CAMBIO: importamos navigate y location para redirigir al home con state y hacer scroll + glow
import { useNavigate, useLocation, Link } from "react-router-dom"; // 🔵 CAMBIO: sumo Link para /terms

function Footer() {
  const [expanded, setExpanded] = useState(null);
  const { user } = useAuth();
  // 🟢 CAMBIO:
  const navigate = useNavigate();
  const location = useLocation();

  const waHref = `https://wa.me/${import.meta.env.VITE_SUPPORT_WA}?text=${encodeURIComponent("Hola! Quiero atención personalizada desde CuyIT")}`;

  // 🟢 CAMBIO: manejador para "Aspectos Clave" desde cualquier página
  const handleAspectosClick = (e) => {
    e.preventDefault();
    // si ya estamos en Home, hacemos scroll suave y actualizamos el hash
    if (location.pathname === "/") {
      const target = document.querySelector("#aspectos-clave, #como-funciona");
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        history.pushState(null, "", "#aspectos-clave");
      } else {
        // por si el DOM todavía no montó (edge), forzamos hash; HowItWorksSection lo capta
        window.location.hash = "#aspectos-clave";
      }
    } else {
      // si NO estamos en Home, redirigimos con state para que en Home haga scroll + glow
      navigate("/", { state: { focusSection: "aspectos-clave" } });
    }
  };

  // 🟢 CAMBIO: manejador para "Inicio" desde cualquier página
const handleInicioClick = (e) => {
  e.preventDefault();
  if (location.pathname === "/") {
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.pushState(null, "", "/");
  } else {
    navigate("/", { replace: false });
  }
};


  return (
    <footer className="bg-gradient-to-t from-black to-[#111827] text-gray-300">
      {/* Versión Mobile (solo se aplica en pantallas < md) */}
      <div className="md:hidden">
        <div className="px-4 pt-8 pb-4">
          {/* Logo y descripción (siempre visible) */}
          <div className="mb-6">
            <h3 className="text-white font-bold text-xl mb-2">CuyIT</h3>
            <p className="text-gray-400 text-sm">
              Conectamos profesionales con usuarios en tiempo real.
            </p>
          </div>

          {/* Acordeón de enlaces */}
          <div className="border-t border-gray-700 pt-3">
            <button
              className="w-full flex justify-between items-center py-3"
              onClick={() => setExpanded(expanded === "links" ? null : "links")}
            >
              <span className="text-white font-medium">Enlaces</span>
              <FaChevronDown
                className={`transition-transform ${expanded === "links" ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                expanded === "links" ? "max-h-40" : "max-h-0"
              }`}
            >
              <ul className="pl-2 space-y-2 py-2">
                <li>
                  <a
                    href="#inicio"
                    onClick={handleInicioClick} // 🟢 CAMBIO
                    className="block py-1.5 text-sm hover:text-white"
                  >
                    Inicio
                  </a>
                </li>
                <li>
                  <a
                    href="#aspectos-clave"
                    onClick={handleAspectosClick} // 🟢 CAMBIO
                    className="block py-1.5 text-sm hover:text-white"
                  >
                    Aspectos Clave
                  </a>
                </li>

                {/* 🔵 CAMBIO: Términos -> ruta interna /terms (ya no WhatsApp) */}
                <li>
                  <Link
                    to="/terms"
                    className="block py-1.5 text-sm hover:text-white"
                  >
                    Términos y condiciones
                  </Link>
                </li>

                {user && (
                  <li>
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2.5 px-3 py-2 rounded-md bg-[#25D366] text-white hover:bg-[#1ebe57] leading-none"
                    >
                      <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
                      <span>Atención al cliente</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          {/* Acordeón de redes */}
          <div className="border-t border-gray-700 pt-3">
            <button
              className="w-full flex justify-between items-center py-3"
              onClick={() => setExpanded(expanded === "social" ? null : "social")}
            >
              <span className="text-white font-medium">Síguenos</span>
              <FaChevronDown
                className={`transition-transform ${expanded === "social" ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`overflow-hidden transition-all duration-200 ${
                expanded === "social" ? "max-h-40" : "max-h-0"
              }`}
            >
              <div className="flex space-x-4 pl-2 py-3">
                <a
                  href="https://www.instagram.com/__cuyit__/"
                  className="text-gray-400 hover:text-white text-xl"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaInstagram />
                </a>
                <a href="#" className="text-gray-400 hover:text-white text-xl pointer-events-none opacity-50 cursor-not-allowed" target="_blank" rel="noreferrer" >
                  <FaFacebook />
                </a>
                <a href="#" className="text-gray-400 hover:text-white text-xl pointer-events-none opacity-50 cursor-not-allowed" target="_blank" rel="noreferrer" >
                  <FaLinkedin />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Derechos reservados (mobile) */}
        <div className="border-t border-gray-800 px-4 py-4 text-center text-gray-500 text-xs">
          © {new Date().getFullYear()} CuyIT — Todos los derechos reservados.
        </div>
      </div>

      {/* Versión Desktop (se mantiene EXACTAMENTE igual) */}
      <div className="hidden md:block">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <h3 className="text-white font-bold text-xl mb-4">CuyIT</h3>
              <p className="text-gray-400">
                Conectamos profesionales con usuarios en tiempo real. Reservas, chat y pagos seguros.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Enlaces</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#inicio"
                    onClick={handleInicioClick} // 🟢 CAMBIO
                    className="hover:text-white"
                  >
                    Inicio
                  </a>
                </li>
                <li>
                  <a
                    href="#como-funciona"
                    onClick={handleAspectosClick} // 🟢 CAMBIO
                    className="hover:text-white"
                  >
                    Aspectos clave
                  </a>
                </li>

                {/* 🔵 CAMBIO: Términos -> ruta interna /terms (ya no WhatsApp) */}
                <li>
                  <Link
                    to="/terms"
                    className="hover:text-white"
                  >
                    Términos y condiciones
                  </Link>
                </li>

                {user && (
                  <li>
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-md bg-[#25D366] text-white hover:bg-[#1ebe57] leading-none"
                    >
                      <FaWhatsapp className="h-4 w-4" aria-hidden="true" />
                      <span>Atención al cliente</span>
                    </a>
                  </li>
                )}
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Síguenos</h4>
              <div className="flex space-x-4">
                <a
                  href="https://www.instagram.com/__cuyit__/"
                  className="text-gray-400 hover:text-white text-xl"
                  target="_blank"
                  rel="noreferrer"
                >
                  <FaInstagram />
                </a>
                <a href="#" className="text-gray-400 hover:text-white text-xl pointer-events-none opacity-50 cursor-not-allowed" target="_blank" rel="noreferrer" >
                  <FaFacebook />
                </a>
                <a href="#" className="text-gray-400 hover:text-white text-xl pointer-events-none opacity-50 cursor-not-allowed" target="_blank" rel="noreferrer" >
                  <FaLinkedin />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-sm">
            © {new Date().getFullYear()} CuyIT — Todos los derechos reservados.
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
