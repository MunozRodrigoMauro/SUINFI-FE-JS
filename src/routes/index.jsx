// src/routes/index.jsx
import React from "react"
import { Routes, Route } from "react-router-dom"
import HomePage from "../pages/HomePage"
import LoginPage from "../pages/LoginPage"
import RegisterPage from "../pages/RegisterPage"
import ClientDashboard from "../pages/ClientDashboard"
import ProfessionalDashboard from "../pages/ProfessionalDashboard"
import MainLayout from "../layouts/MainLayout"
import PrivateRoute from "./PrivateRoute" // ✅ ahora lo tendremos acá

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas públicas con layout */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Rutas protegidas según el rol */}
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard/client"
          element={
            <PrivateRoute role="client">
              <ClientDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/professional"
          element={
            <PrivateRoute role="professional">
              <ProfessionalDashboard />
            </PrivateRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default AppRoutes
