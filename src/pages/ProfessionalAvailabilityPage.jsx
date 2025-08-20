import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../auth/AuthContext"
import {
  updateAvailabilitySchedule,
  getProfessionals,
} from "../api/professionalService"

// Claves en español para coincidir con tu backend/seed
const DAYS = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miércoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sábado", label: "Sábado" },
  { key: "domingo", label: "Domingo" },
]

// Row reutilizable
function DayRow({ label, active, from, to, onToggle, onChangeFrom, onChangeTo }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border rounded-xl bg-white">
      <div className="flex items-center gap-3 min-w-[130px]">
        <input
          id={`chk-${label}`}
          type="checkbox"
          checked={active}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-5 w-5"
        />
        <label htmlFor={`chk-${label}`} className="font-medium">
          {label}
        </label>
      </div>

      <div className="flex items-center gap-3 sm:ml-auto">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">De</span>
          <input
            type="time"
            step="900"
            value={from}
            disabled={!active}
            onChange={(e) => onChangeFrom(e.target.value)}
            className={`border rounded-lg px-3 py-2 text-sm ${
              active ? "bg-white" : "bg-gray-100 text-gray-400"
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">a</span>
          <input
            type="time"
            step="900"
            value={to}
            disabled={!active}
            onChange={(e) => onChangeTo(e.target.value)}
            className={`border rounded-lg px-3 py-2 text-sm ${
              active ? "bg-white" : "bg-gray-100 text-gray-400"
            }`}
          />
        </div>
      </div>
    </div>
  )
}

export default function ProfessionalAvailabilityPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Estado de la agenda
  const [rows, setRows] = useState(() =>
    DAYS.map((d) => ({ key: d.key, active: false, from: "09:00", to: "18:00" }))
  )

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState("")

  // Prefill de la agenda: como no hay /professionals/me, traemos todos y filtramos por usuario
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const list = await getProfessionals()
        if (!mounted) return
        const mine =
          list.find((p) => p?.user?._id === user?.id || p?.user?._id === user?._id) || null

        if (mine?.availabilitySchedule && typeof mine.availabilitySchedule === "object") {
          const map = mine.availabilitySchedule
          setRows((prev) =>
            prev.map((r) => {
              const val = map[r.key]
              if (!val) return { ...r, active: false }
              const from = typeof val.from === "string" ? val.from : "09:00"
              const to = typeof val.to === "string" ? val.to : "18:00"
              return { ...r, active: true, from, to }
            })
          )
        }
      } catch (e) {
        console.error("No se pudo prefetchar agenda:", e)
      } finally {
        setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [user?.id, user?._id])

  // util para validar rangos
  const invalids = useMemo(() => {
    const bad = []
    rows.forEach((r) => {
      if (!r.active) return
      if (!r.from || !r.to) bad.push(r.key)
      else if (r.from >= r.to) bad.push(r.key)
    })
    return bad
  }, [rows])

  const onToggle = (idx, val) =>
    setRows((arr) => arr.map((r, i) => (i === idx ? { ...r, active: val } : r)))

  const onChangeFrom = (idx, value) =>
    setRows((arr) => arr.map((r, i) => (i === idx ? { ...r, from: value } : r)))

  const onChangeTo = (idx, value) =>
    setRows((arr) => arr.map((r, i) => (i === idx ? { ...r, to: value } : r)))

  const onSave = async () => {
    setMsg("")
    // validaciones simples
    if (invalids.length > 0) {
      setMsg("Revisá los horarios: la hora de inicio debe ser menor que la de fin.")
      return
    }

    // construir payload sólo con días activos
    const schedule = rows.reduce((acc, r) => {
      if (r.active) acc[r.key] = { from: r.from, to: r.to }
      return acc
    }, {})

    try {
      setSaving(true)
      const res = await updateAvailabilitySchedule(schedule)
      setMsg("✅ Agenda guardada correctamente.")
      // sincronizamos UI con lo que devolvió el backend
      if (res?.availabilitySchedule && typeof res.availabilitySchedule === "object") {
        const map = res.availabilitySchedule
        setRows((prev) =>
          prev.map((r) => {
            const val = map[r.key]
            if (!val) return { ...r, active: false }
            const from = typeof val.from === "string" ? val.from : "09:00"
            const to = typeof val.to === "string" ? val.to : "18:00"
            return { ...r, active: true, from, to }
          })
        )
      }
      // feedback que se autodesvanece
      setTimeout(() => setMsg(""), 2500)
    } catch (e) {
      console.error(e)
      setMsg("No se pudo guardar la agenda. Intentá nuevamente.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="min-h-screen bg-white text-[#0a0e17] py-24 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Header + Back */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">🗓️ Disponibilidad semanal</h1>
            <p className="text-gray-600">Definí tu agenda por día con horarios de atención.</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="text-sm bg-white border px-3 py-2 rounded-lg hover:bg-gray-50"
          >
            ← Volver
          </button>
        </div>

        {/* Alertas de validación */}
        {invalids.length > 0 && (
          <div className="mb-4 text-sm bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-lg">
            Hay días con horario inválido (inicio debe ser menor que fin).
          </div>
        )}
        {msg && (
          <div
            className={`mb-4 text-sm px-3 py-2 rounded-lg ${
              msg.startsWith("✅")
                ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
                : "bg-rose-50 border border-rose-200 text-rose-700"
            }`}
          >
            {msg}
          </div>
        )}

        {/* Cargador */}
        {loading ? (
          <p className="text-gray-600">Cargando tu agenda…</p>
        ) : (
          <div className="space-y-3">
            {DAYS.map((d, idx) => (
              <DayRow
                key={d.key}
                label={d.label}
                active={rows[idx].active}
                from={rows[idx].from}
                to={rows[idx].to}
                onToggle={(val) => onToggle(idx, val)}
                onChangeFrom={(val) => onChangeFrom(idx, val)}
                onChangeTo={(val) => onChangeTo(idx, val)}
              />
            ))}
          </div>
        )}

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={() =>
              setRows(DAYS.map((d) => ({ key: d.key, active: false, from: "09:00", to: "18:00" })))
            }
            className="text-sm bg-white border px-4 py-2 rounded-lg hover:bg-gray-50"
          >
            Restablecer
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="text-sm bg-[#0a0e17] text-white px-5 py-2 rounded-lg hover:bg-black/80 disabled:opacity-60"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </section>
  )
}