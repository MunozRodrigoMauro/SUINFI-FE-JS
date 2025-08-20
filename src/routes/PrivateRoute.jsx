// src/routes/PrivateRoute.jsx
import React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"

// Este componente protege rutas según el rol requerido
function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth()

  // Cargando sesión
  if (loading) return <p className="text-center mt-10">Verificando sesión...</p>

  // No logueado
  if (!user) return <Navigate to="/login" replace />

  // Logueado pero con rol incorrecto
  if (!allowedRoles.includes(user.role)) return <Navigate to="/" replace />

  // Logueado y con rol correcto
  return children
}

export default PrivateRoute
