import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import UserDashboard from "../pages/UserDashboard";
import ProfessionalDashboard from "../pages/ProfessionalDashboard";
import MainLayout from "../layouts/MainLayout";
import PrivateRoute from "./PrivateRoute";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "../pages/AdminDashboard";
import ProfilePage from "../pages/ProfilePage";
import ProfessionalAvailabilityPage from "../pages/ProfessionalAvailabilityPage";
import ProfessionalDetailPage from "../pages/ProfessionalDetailPage";

function AppRoutes() {
  const { loading } = useAuth();
  const navigate = useNavigate();

  // 🧭 Redirección centralizada de onboarding (escucha eventos del AuthContext)
  useEffect(() => {
    const handler = (e) => {
      const { requiresOnboarding, role } = e.detail || {};
      if (requiresOnboarding && role === "professional") {
        navigate("/profile", { replace: true });
      }
    };
    window.addEventListener("suinfi:onboarding", handler);
    return () => window.removeEventListener("suinfi:onboarding", handler);
  }, [navigate]);

  if (loading) return <p className="text-center mt-10">Cargando sesión...</p>;

  return (
    <Routes>
      {/* Públicas */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Route>

      {/* Protegidas */}
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard/admin"
          element={
            <PrivateRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/user"
          element={
            <PrivateRoute allowedRoles={["user"]}>
              <UserDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/professional"
          element={
            <PrivateRoute allowedRoles={["professional"]}>
              <ProfessionalDashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/dashboard/professional/availability"
          element={
            <PrivateRoute allowedRoles={["professional"]}>
              <ProfessionalAvailabilityPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/professional/:id"
          element={
            <PrivateRoute allowedRoles={["user", "professional"]}>
              <ProfessionalDetailPage />
            </PrivateRoute>
          }
        />
      </Route>

      {/* Alias /catalog -> dashboard del user */}
      <Route path="/catalog" element={<Navigate to="/dashboard/user" replace />} />

      {/* Perfil (protegido para todos los roles) */}
      <Route
        path="/profile"
        element={
          <PrivateRoute allowedRoles={["user", "professional", "admin"]}>
            <ProfilePage />
          </PrivateRoute>
        }
      />
    </Routes>
  );
}

export default AppRoutes;