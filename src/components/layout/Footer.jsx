// src/components/Footer.jsx
import React, { useState } from "react";
import { FaInstagram, FaTwitter, FaLinkedin, FaChevronDown, FaFacebook } from "react-icons/fa";

function Footer() {
  const [expanded, setExpanded] = useState(null);

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
              onClick={() => setExpanded(expanded === 'links' ? null : 'links')}
            >
              <span className="text-white font-medium">Enlaces</span>
              <FaChevronDown className={`transition-transform ${expanded === 'links' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${expanded === 'links' ? 'max-h-40' : 'max-h-0'}`}>
              <ul className="pl-2 space-y-2 py-2">
                <li><a href="#" className="block py-1.5 text-sm hover:text-white">Inicio</a></li>
                <li><a href="#como-funciona" className="block py-1.5 text-sm hover:text-white">Cómo funciona</a></li>
                <li><a href="#" className="block py-1.5 text-sm hover:text-white">Profesionales</a></li>
              </ul>
            </div>
          </div>

          {/* Acordeón de redes */}
          <div className="border-t border-gray-700 pt-3">
            <button 
              className="w-full flex justify-between items-center py-3"
              onClick={() => setExpanded(expanded === 'social' ? null : 'social')}
            >
              <span className="text-white font-medium">Síguenos</span>
              <FaChevronDown className={`transition-transform ${expanded === 'social' ? 'rotate-180' : ''}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-200 ${expanded === 'social' ? 'max-h-40' : 'max-h-0'}`}>
              <div className="flex space-x-4 pl-2 py-3">
                <a href="#" className="text-gray-400 hover:text-white text-lg"><FaInstagram /></a>
                <a href="#" className="text-gray-400 hover:text-white text-lg"><FaTwitter /></a>
                <a href="#" className="text-gray-400 hover:text-white text-lg"><FaLinkedin /></a>
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
                <li><a href="#" className="hover:text-white">Inicio</a></li>
                <li><a href="#como-funciona" className="hover:text-white">Cómo funciona</a></li>
                <li><a href="#" className="hover:text-white">Profesionales</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Síguenos</h4>
              <div className="flex space-x-4">
                <a href="https://www.instagram.com/__cuyit__/" className="text-gray-400 hover:text-white text-xl" target="_blank"><FaInstagram /></a>
                <a href="#" className="text-gray-400 hover:text-white text-xl" target="_blank"><FaFacebook /></a>
                <a href="#" className="text-gray-400 hover:text-white text-xl" target="_blank"><FaLinkedin /></a>
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