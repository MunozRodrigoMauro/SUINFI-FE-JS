// src/routes/index.jsx
import React, { useEffect } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import UserDashboard from "../pages/UserDashboard";
import ProfessionalDashboard from "../pages/ProfessionalDashboard";
import MainLayout from "../layouts/MainLayout";
import PrivateRoute from "./PrivateRoute";
import { useAuth } from "../auth/AuthContext";
import AdminDashboard from "../pages/AdminDashboard";
import ProfilePage from "../pages/ProfilePage";
import ProfessionalAvailabilityPage from "../pages/ProfessionalAvailabilityPage";
import ProfessionalDetailPage from "../pages/ProfessionalDetailPage";
import BookingsPage from "../pages/BookingsPage";
import ProfessionalServicesPage from "../pages/ProfessionalServicesPage";
import ChatsPage from "../pages/ChatsPage";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import VerifyEmailSent from "../pages/VerifyEmailSent";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import CheckoutReturnPage from "../pages/CheckoutReturnPage";
import PointsPage from "../pages/PointsPage";
import RewardsCatalogPage from "../pages/RewardsCatalogPage";
import RedemptionDetailPage from "../pages/RedemptionDetailPage";
import GoogleCallbackPage from "../pages/GoogleCallbackPage";
import SettlementsPage from "../pages/admin/SettlementsPage";
import ScrollToTop from "../components/common/ScrollToTop";
import TermsPage from "../pages/TermsPage";
import RequestServicePage from "../pages/RequestServicePage";

// [CHANGE HERE] gate para que el dashboard user sólo abra si venís con ready=1
function UserDashGate({ children }) {
  const loc = useLocation();
  const params = new URLSearchParams(loc.search);
  const ready = params.get("ready") === "1";
  if (!ready) return <Navigate to="/request" replace />;
  return children;
}

// [CHANGE HERE] importá el Provider del flujo
import { SearchProvider } from "../context/SearchContext";

function AppRoutes() {
  const { loading } = useAuth();
  const navigate = useNavigate();

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
    <>
      <ScrollToTop />

      <Routes>
        {/* Públicas con Navbar */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/oauth/google/callback" element={<GoogleCallbackPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Route>

        {/* Protegidas con Navbar */}
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
            path="/dashboard/admin/settlements"
            element={
              <PrivateRoute allowedRoles={["admin"]}>
                <SettlementsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/user"
            element={
              <PrivateRoute allowedRoles={["user"]}>
                <UserDashGate>
                  <UserDashboard />
                </UserDashGate>
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
            path="/dashboard/professional/services"
            element={
              <PrivateRoute allowedRoles={["professional"]}>
                <ProfessionalServicesPage />
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
          <Route
            path="/bookings"
            element={
              <PrivateRoute allowedRoles={["user", "professional"]}>
                <BookingsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute allowedRoles={["user", "professional", "admin"]}>
                <ProfilePage />
              </PrivateRoute>
            }
          />
          <Route
            path="/messages"
            element={
              <PrivateRoute allowedRoles={["user", "professional", "admin"]}>
                <ChatsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard/professional/messages"
            element={
              <PrivateRoute allowedRoles={["user", "professional", "admin"]}>
                <ChatsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/chats/:otherUserId?"
            element={
              <PrivateRoute allowedRoles={["user", "professional", "admin"]}>
                <ChatsPage />
              </PrivateRoute>
            }
          />

          {/* Puntos / Recompensas / Canjes */}
          <Route
            path="/points"
            element={
              <PrivateRoute allowedRoles={["user", "professional", "admin"]}>
                <PointsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/rewards"
            element={
              <PrivateRoute allowedRoles={["user", "professional", "admin"]}>
                <RewardsCatalogPage />
              </PrivateRoute>
            }
          />

          {/* [CHANGE HERE] /request envuelto por SearchProvider */}
          <Route
            path="/request"
            element={
              <PrivateRoute allowedRoles={["user"]}>
                <SearchProvider>
                  <RequestServicePage />
                </SearchProvider>
              </PrivateRoute>
            }
          />

          <Route
            path="/redemptions/:id"
            element={
              <PrivateRoute allowedRoles={["user", "professional", "admin"]}>
                <RedemptionDetailPage />
              </PrivateRoute>
            }
          />
        </Route>

        {/* Otras sin Navbar */}
        <Route path="/catalog" element={<Navigate to="/dashboard/user" replace />} />
        <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/checkout/return" element={<CheckoutReturnPage />} />
      </Routes>
    </>
  );
}

export default AppRoutes;
