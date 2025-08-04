import React from "react"
import { Link } from "react-router-dom"

function HeroSection() {
  return (
    <section className="bg-gradient-to-b from-[#0a0e17] to-[#0a0e17] text-white min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
    <h1 className="text-4xl md:text-5xl font-bold mb-4">
      Conectá con profesionales en tiempo real
    </h1>
    <p className="text-lg md:text-xl mb-6 max-w-2xl">
      SUINFI te ayuda a encontrar expertos cerca tuyo, reservar servicios al instante, chatear y pagar de forma segura.
    </p>
    <Link
      to="/register"
      className="bg-white text-black font-semibold px-6 py-3 rounded shadow hover:bg-gray-200 transition"
    >
      ¡Comenzá gratis!
    </Link>
  </section>
  )
}

export default HeroSection
