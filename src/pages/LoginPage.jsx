import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("") // limpiamos error anterior

    try {
      const user = await login({ email, password })
  
      const roleRoute = {
        user: "/dashboard/client",
        professional: "/dashboard/professional"
      }
  
      if (roleRoute[user.role]) {
        navigate(roleRoute[user.role])
      } else {
        console.error("Rol no reconocido:", user.role)
        setError("Rol no reconocido")
      }
  
    } catch (err) {
      console.error("Error de login:", err)
      setError("Credenciales inválidas")
    }
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white shadow rounded-md">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">Iniciar sesión</h2>
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
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <button
          type="submit"
          className="w-full bg-gradient-to-b from-[#0a0e17] to-[#0a0e17] text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  )
}

export default LoginPage