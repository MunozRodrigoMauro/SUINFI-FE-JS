import React, { useState } from "react";
import { FaInstagram, FaTwitter, FaLinkedin, FaChevronDown, FaFacebook } from "react-icons/fa";
import { useAuth } from "../../auth/AuthContext";
// 🟢 CAMBIO: importamos navigate y location para redirigir al home con state y hacer scroll + glow
import { useNavigate, useLocation } from "react-router-dom";

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
                  <a href="#" className="block py-1.5 text-sm hover:text-white">
                    Inicio
                  </a>
                </li>
                <li>
                  <a
                    href="#como-funciona"
                    onClick={handleAspectosClick} // 🟢 CAMBIO
                    className="block py-1.5 text-sm hover:text-white"
                  >
                    Aspectos Clave
                  </a>
                </li>

                {user && (
                  <li>
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#25D366] text-white hover:bg-[#1ebe57]"
                    >
                      <svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M19.11 17.23c-.29-.14-1.68-.83-1.94-.92-.26-.1-.45-.14-.64.14-.19.29-.74.92-.91 1.11-.17.2-.34.22-.63.08-.29-.14-1.23-.45-2.35-1.44-.87-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.12-.58.12-.12.29-.31.43-.46.14-.15.19-.26.29-.43.1-.17.05-.32-.02-.46-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.47-.64-.47h-.54c-.19 0-.49.07-.75.35-.26.29-.99.97-.99 2.36s1.02 2.74 1.16 2.93c.14.2 2 3.05 4.84 4.28.68.29 1.21.46 1.62.58.68.22 1.29.19 1.77.12.54-.08 1.68-.69 1.92-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.33zM16.01 4.3c-6.42 0-11.63 5.21-11.63 11.63 0 2.05.54 4.05 1.57 5.81L4 28l6.43-1.89a11.57 11.57 0 0 0 5.58 1.46h.01c6.42 0 11.63-5.21 11.63-11.63 0-3.11-1.21-6.04-3.41-8.24a11.587 11.587 0 0 0-8.24-3.41zm0 21.17h-.01c-1.79 0-3.54-.48-5.06-1.38l-.36-.21-3.78 1.11 1.13-3.68-.23-.38a9.67 9.67 0 0 1-1.49-5.18c0-5.35 4.35-9.7 9.7-9.7 2.59 0 5.03 1.01 6.86 2.84a9.66 9.66 0 0 1 2.84 6.85c0 5.35-4.35 9.7-9.7 9.7z"
                        />
                      </svg>
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
                  <a href="#" className="hover:text-white">
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

                {user && (
                  <li>
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#25D366] text-white hover:bg-[#1ebe57]"
                    >
                      <svg viewBox="0 0 32 32" width="16" height="16" aria-hidden="true">
                        <path
                          fill="currentColor"
                          d="M19.11 17.23c-.29-.14-1.68-.83-1.94-.92-.26-.1-.45-.14-.64.14-.19.29-.74.92-.91 1.11-.17.2-.34.22-.63.08-.29-.14-1.23-.45-2.35-1.44-.87-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.12-.58.12-.12.29-.31.43-.46.14-.15.19-.26.29-.43.1-.17.05-.32-.02-.46-.07-.14-.64-1.54-.88-2.11-.23-.55-.47-.47-.64-.47h-.54c-.19 0-.49.07-.75.35-.26.29-.99.97-.99 2.36s1.02 2.74 1.16 2.93c.14.2 2 3.05 4.84 4.28.68.29 1.21.46 1.62.58.68.22 1.29.19 1.77.12.54-.08 1.68-.69 1.92-1.36.24-.67.24-1.24.17-1.36-.07-.12-.26-.19-.55-.33zM16.01 4.3c-6.42 0-11.63 5.21-11.63 11.63 0 2.05.54 4.05 1.57 5.81L4 28l6.43-1.89a11.57 11.57 0 0 0 5.58 1.46h.01c6.42 0 11.63-5.21 11.63-11.63 0-3.11-1.21-6.04-3.41-8.24a11.587 11.587 0 0 0-8.24-3.41zm0 21.17h-.01c-1.79 0-3.54-.48-5.06-1.38l-.36-.21-3.78 1.11 1.13-3.68-.23-.38a9.67 9.67 0 0 1-1.49-5.18c0-5.35 4.35-9.7 9.7-9.7 2.59 0 5.03 1.01 6.86 2.84a9.66 9.66 0 0 1 2.84 6.85c0 5.35-4.35 9.7-9.7 9.7z"
                        />
                      </svg>
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
