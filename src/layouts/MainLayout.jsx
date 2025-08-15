import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { socket } from "../lib/socket"; // ✅ usamos el singleton

function MainLayout() {
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
      <Footer />
    </div>
  );
}

export default MainLayout;