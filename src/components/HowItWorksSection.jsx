// src/components/HowItWorksSection.jsx
import React from "react"
import { FaSearch, FaComments, FaCheckCircle } from "react-icons/fa"

function HowItWorksSection() {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-10">
            ¿Cómo funciona SUINFI?
          </h2>
          <div className="grid md:grid-cols-3 gap-10">
            {/* Paso 1 */}
            <div className="flex flex-col items-center">
              <FaSearch className="text-[#111827] text-5xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Buscá</h3>
              <p className="text-gray-600">
                Encontrá profesionales cerca tuyo usando filtros inteligentes.
              </p>
            </div>
  
            {/* Paso 2 */}
            <div className="flex flex-col items-center">
              <FaComments className="text-[#111827] text-5xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Conectá</h3>
              <p className="text-gray-600">
                Chateá en tiempo real antes de contratar para sacarte dudas.
              </p>
            </div>
  
            {/* Paso 3 */}
            <div className="flex flex-col items-center">
              <FaCheckCircle className="text-[#111827] text-5xl mb-4" />
              <h3 className="text-xl font-semibold mb-2">Contratá</h3>
              <p className="text-gray-600">
                Reservá y pagá de forma segura en solo un clic.
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

export default HowItWorksSection
