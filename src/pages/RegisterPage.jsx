// src/pages/RegisterPage.jsx
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { registerUser } from "../api/userService"
import { useAuth } from "../auth/AuthContext"

function RegisterPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("user") // 👈 ahora sí, válido para backend
  const [error, setError] = useState([])
  const navigate = useNavigate()
  const { login } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const response = await registerUser({ name, email, password, role })

      // Login automático con el nuevo usuario
      await login({ email, password })

      navigate(`/dashboard/${role}`)
    } catch (err) {
      console.error("❌ Error al registrar:", err)

      if (err.response && err.response.data?.errors) {
        const messages = err.response.data.errors.map(e => e.msg)
        setError(messages)
      } else if (err.response?.data?.message) {
        setError([err.response.data.message])
      } else {
        setError(["No se pudo registrar. Intente más tarde."])
      }
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Crear cuenta</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full border px-4 py-2 rounded"
        />

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

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full border px-4 py-2 rounded bg-white"
        >
          <option value="admin">👑 Soy Admin</option>
          <option value="user">👤 Soy Cliente</option>
          <option value="professional">🔧 Soy Profesional</option>
        </select>

        {/* Mostrar errores si hay */}
        {error.length > 0 && (
          <ul className="text-red-500 text-sm space-y-1">
            {error.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        )}

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
