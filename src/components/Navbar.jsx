import React, { useEffect, useState } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import logo from "../assets/LogoNavbar.png"

function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [scrolled, setScrolled] = useState(false)

  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? "bg-gradient-to-b from-[#0a0e17]/80 to-[#0a0e17]/80 backdrop-blur" // navbar transparente oscuro
          : "bg-gradient-to-b from-[#0a0e17] to-[#0a0e17]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center h-14 md:h-16">
        <Link to="/" className="flex items-center">
          <img
            src={logo}
            alt="SUINFI logo"
            className="h-6 md:h-6 object-contain"
          />
        </Link>

        <div className="space-x-4 text-sm font-medium">
          {user ? (
            <>
              <span className="text-white">Hola, {user.email.split('@')[0]}</span>
              <button
                onClick={() => {
                  logout()
                  navigate('/login')
                }}
                className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
              >
                Salir
              </button> 
            </>
          ) : (
            <>
              {location.pathname !== "/login" && (
                <Link
                  to="/login"
                  className="text-white hover:text-gray-300 transition"
                >
                  Iniciar sesión
                </Link>
              )}
              {location.pathname !== "/register" && (
                <Link
                  to="/register"
                  className="border border-white text-white px-4 py-2 rounded-md hover:bg-white hover:text-black transition"
                >
                  Registrate
                </Link>
              )}
            </>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
