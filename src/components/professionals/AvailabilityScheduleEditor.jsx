import React, { useMemo } from "react"

const DAYS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
]

/**
 * AvailabilityScheduleEditor
 * - value: objeto { monday: {from,to}, tuesday: {from,to}, ... }
 * - onChange: (next) => void
 */
function AvailabilityScheduleEditor({ value = {}, onChange }) {
  const schedule = useMemo(() => {
    const base = {}
    DAYS.forEach(d => { base[d.key] = value?.[d.key] || { from: "", to: "" } })
    return base
  }, [value])

  const update = (dayKey, field, val) => {
    const next = { ...schedule, [dayKey]: { ...schedule[dayKey], [field]: val } }
    onChange?.(next)
  }

  const clearDay = (dayKey) => {
    const next = { ...schedule, [dayKey]: { from: "", to: "" } }
    onChange?.(next)
  }

  return (
    <div className="space-y-3">
      {DAYS.map(({ key, label }) => (
        <div key={key} className="grid grid-cols-12 items-center gap-3 border rounded-lg p-3">
          <div className="col-span-12 sm:col-span-3 font-medium">{label}</div>

          <div className="col-span-6 sm:col-span-3">
            <label className="block text-xs text-gray-500 mb-1">Desde</label>
            <input
              type="time"
              value={schedule[key].from}
              onChange={(e) => update(key, "from", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="col-span-6 sm:col-span-3">
            <label className="block text-xs text-gray-500 mb-1">Hasta</label>
            <input
              type="time"
              value={schedule[key].to}
              onChange={(e) => update(key, "to", e.target.value)}
              className="w-full border rounded-lg px-3 py-2"
            />
          </div>

          <div className="col-span-12 sm:col-span-3 flex items-end justify-start sm:justify-end">
            <button
              type="button"
              onClick={() => clearDay(key)}
              className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg"
            >
              Limpiar
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default AvailabilityScheduleEditor