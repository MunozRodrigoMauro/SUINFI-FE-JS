import React, { useState } from "react"
import { updateAvailabilityNow } from "../api/professionalService"
import { socket } from "../lib/socket";

export default function AvailabilityNowToggle({ initial = false, onChange }) {
  const [isOn, setIsOn] = useState(Boolean(initial))
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState("")

  const toggleNow = async () => {
    try {
      setLoading(true)
      const next = !isOn
      setIsOn(next) // optimista
      const res = await updateAvailabilityNow(next) // { message, isAvailableNow }
      socket.emit("heartbeat"); // ⬅️ marca actividad inmediata
      setMsg(res?.message || (next ? "Ahora estás disponible" : "Disponibilidad desactivada"))
      onChange?.(res?.isAvailableNow ?? next)
    } catch (e) {
      // revertir si falla
      setIsOn((prev) => !prev)
      setMsg("No se pudo actualizar la disponibilidad")
      console.error(e)
    } finally {
      setLoading(false)
      setTimeout(() => setMsg(""), 2500)
    }
  }

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={toggleNow}
        disabled={loading}
        className={`relative inline-flex h-9 w-16 items-center rounded-full transition ${
          isOn ? "bg-green-600" : "bg-gray-300"
        } ${loading ? "opacity-70 cursor-not-allowed" : "cursor-pointer"}`}
        aria-pressed={isOn}
        aria-label="Disponible ahora"
        title="Disponible ahora"
      >
        <span
          className={`inline-block h-7 w-7 transform rounded-full bg-white transition ${
            isOn ? "translate-x-8" : "translate-x-1"
          }`}
        />
      </button>
      <span className="text-sm text-gray-700">
        {isOn ? "Disponible ahora" : "No disponible"}
      </span>
      {msg && <span className="text-xs text-gray-500">· {msg}</span>}
    </div>
  )
}