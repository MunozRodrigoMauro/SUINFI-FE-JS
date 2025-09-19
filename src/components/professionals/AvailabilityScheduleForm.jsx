import React, { useMemo, useState } from "react"
import { updateAvailabilitySchedule } from "../api/professionalService"

// Estructura esperada por el BE: { lunes: {from:"09:00", to:"17:00"}, ... }
const DAYS = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
]

// Utilidad simple para validar rangos HH:MM
const isValidRange = (from, to) => {
  if (!from || !to) return false
  return from < to
}

export default function AvailabilityScheduleForm({
  initialSchedule = {}, // si más adelante traés el perfil, lo inyectás acá
}) {
  // estado local editable
  const [schedule, setSchedule] = useState(() => {
    // normalizamos: si no viene el día, lo dejamos vacío
    const base = {}
    DAYS.forEach(({ key }) => {
      const d = initialSchedule?.[key]
      base[key] = d ? { from: d.from || "", to: d.to || "" } : { from: "", to: "" }
    })
    return base
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  const hasAnySlot = useMemo(
    () => DAYS.some(({ key }) => schedule[key].from && schedule[key].to),
    [schedule]
  )

  const handleChange = (dayKey, field, value) => {
    setSchedule((prev) => ({
      ...prev,
      [dayKey]: { ...prev[dayKey], [field]: value },
    }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setMsg("")

    // Validación rápida: si cargaste un día, el rango debe ser válido
    for (const { key, label } of DAYS) {
      const { from, to } = schedule[key]
      if ((from || to) && !isValidRange(from, to)) {
        setMsg(`Revisá el rango de ${label}: "desde" debe ser menor a "hasta".`)
        return
      }
    }

    // Armamos objeto final omitiendo días vacíos
    const payload = {}
    DAYS.forEach(({ key }) => {
      const { from, to } = schedule[key]
      if (from && to) payload[key] = { from, to }
    })

    try {
      setSaving(true)
      const res = await updateAvailabilitySchedule(payload)
      setMsg(res?.message || "✅ Agenda actualizada")
      // Podés actualizar el estado con lo que devolvió el BE si querés:
      // if (res?.availabilitySchedule) { setSchedule(normalizado) }
    } catch (e) {
      console.error(e)
      setMsg("No se pudo guardar la agenda")
    } finally {
      setSaving(false)
      setTimeout(() => setMsg(""), 2500)
    }
  }

  const clearDay = (key) =>
    setSchedule((prev) => ({ ...prev, [key]: { from: "", to: "" } }))

  const clearAll = () => {
    const empty = {}
    DAYS.forEach(({ key }) => (empty[key] = { from: "", to: "" }))
    setSchedule(empty)
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DAYS.map(({ key, label }) => {
          const { from, to } = schedule[key]
          const hasRange = from && to
          return (
            <div key={key} className="border rounded-xl p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium">{label}</h4>
                {hasRange && (
                  <button
                    type="button"
                    onClick={() => clearDay(key)}
                    className="text-xs text-red-600 hover:underline"
                    aria-label={`Limpiar ${label}`}
                  >
                    Limpiar
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Desde</label>
                  <input
                    type="time"
                    value={from}
                    onChange={(e) => handleChange(key, "from", e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Hasta</label>
                  <input
                    type="time"
                    value={to}
                    onChange={(e) => handleChange(key, "to", e.target.value)}
                    className="w-full border rounded-md px-3 py-2"
                  />
                </div>
              </div>
              {hasRange && !isValidRange(from, to) && (
                <p className="text-xs text-red-600 mt-2">Rango inválido</p>
              )}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {hasAnySlot ? "Tenés horarios cargados" : "Aún no cargaste horarios"}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={clearAll}
            className="px-4 py-2 rounded-lg border text-gray-700 hover:bg-gray-50 cursor-pointer"
          >
            Limpiar todo
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#0a0e17] text-white hover:bg-black/80 disabled:opacity-60 cursor-pointer"
          >
            {saving ? "Guardando..." : "Guardar agenda"}
          </button>
        </div>
      </div>

      {msg && (
        <p className={`text-sm ${msg.startsWith("✅") ? "text-green-600" : "text-red-600"}`}>
          {msg}
        </p>
      )}
    </form>
  )
}