// src/layouts/MainLayout.jsx
import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import { socket } from "../lib/socket"; // ✅ usamos el singleton

function MainLayout() {
  const location = useLocation();
  const isChatsRoute = location.pathname.startsWith("/chats");

  useEffect(() => {
    const onConnect = () => {
      console.log("✅ socket connected", socket.id);
    };
    const onDisconnect = (reason) => {
      console.warn("⚠️ socket disconnected:", reason);
    };
    const onError = (err) => {
      console.error("❌ socket connection error:", err.message);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onError);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onError);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>

      {/* En /chats ocultamos footer en mobile y lo mostramos en desktop */}
      {isChatsRoute ? (
        <div className="hidden md:block">
          <Footer />
        </div>
      ) : (
        <Footer />
      )}
    </div>
  );
}

export default MainLayout;
