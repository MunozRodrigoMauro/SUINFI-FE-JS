// src/pages/RegisterPage.jsx
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"

function RegisterPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("client") // 👈 valor por defecto
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()

    // Acá enviaríamos a la API real (simulado por ahora)
    const newUser = {
      email,
      password,
      role, // 👈 lo guardamos con su rol
    }

    console.log("Usuario registrado:", newUser)
    // Luego podrías guardar en localStorage, context, etc

    navigate("/login")
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Crear cuenta</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder="Correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded"
        />

        {/* Selector de rol */}
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border px-4 py-2 rounded bg-white"
        >
          <option value="client">👤 Soy Cliente</option>
          <option value="professional">🔧 Soy Profesional</option>
        </select>

        <button
          type="submit"
          className="w-full bg-gradient-to-b from-[#0a0e17] to-[#0a0e17] text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Registrarme
        </button>
      </form>
    </div>
  )
}

export default RegisterPage
