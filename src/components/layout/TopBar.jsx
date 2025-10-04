// src/components/layout/TopBar.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import logo from "../../assets/LogoNavbar.png"; // ajusta la ruta si es distinta

function TopBar({ showBack = true }) {
  const navigate = useNavigate();

  return (
    <header className="fixed top-0 left-0 w-full bg-white border-b shadow-sm z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo + volver */}
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-100"
            >
              ← Volver
            </button>
          )}
          <img src={logo} alt="CuyIT" className="h-8" />
        </div>
      </div>
    </header>
  );
}

export default TopBar;
