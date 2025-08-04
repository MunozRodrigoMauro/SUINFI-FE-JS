import React from "react"
import { Outlet } from "react-router-dom" //Outlet representa el componente hijo dinámico
import Navbar from "../components/Navbar"
import Footer from "../components/Footer"
//min-h-screen asegura que el contenido cubra la pantalla
//flex-grow empuja el Footer hacia abajo.
function MainLayout() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout
