// src/pages/HomePage.jsx
// CHANGES: mostramos ProfileNudge si el cliente/pro tiene perfil incompleto
import React from "react";
import HeroSection from "../components/home/HeroSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import { useAuth } from "../auth/AuthContext";
import ProfileNudge from "../components/Shared/ProfileNudge";

function HomePage() {
  const { user, profileStatus } = useAuth();

  return (
    <>
      {/* CHANGES: PopApp de completitud (solo si faltan mínimos y hay user) */}
      {user && !profileStatus?.isComplete && (
        <ProfileNudge user={user} missing={profileStatus?.missing || []} />
      )}

      <HeroSection />
      <HowItWorksSection />
    </>
  );
}

export default HomePage;
