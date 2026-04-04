import { useEffect, useState } from "react"
import { getPersonas, updateEstadoPersona, addPersona} from "../services/api"
import PageHeader from "../components/PageHeader"
import { sharedStyles, theme } from "../styles/theme"

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface Persona {
  id: number
  nombre: string
  apellidos: string
  fecha_nacimiento: string
  habilidades_combate: number
  nivel_confianza: number
  estado_salud: "SANO" | "HERIDO" | "ENFERMO" | "MUERTO"
  esta_en_campamento: number
  cargo: string
  es_temporal: number
}

const ESTADOS = ["SANO", "HERIDO", "ENFERMO", "MUERTO"] as const

const ESTADO_COLOR: Record<string, string> = {
  SANO:    "#4ade80",
  HERIDO:  "#fb923c",
  ENFERMO: "#facc15",
  MUERTO:  "#94a3b8",
}

const ESTADO_LABEL: Record<string, string> = {
  SANO:    "Operativo",
  HERIDO:  "Herido",
  ENFERMO: "Enfermo",
  MUERTO:  "Caído",
}

// ─── MODAL AGREGAR ───────────────────────────────────────────────────────────

function ModalAgregarPersona({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")
  const [form, setForm]     = useState({
    nombre: "", apellidos: "", fecha_nacimiento: "",
    habilidades_combate: 5, nivel_confianza: 5, estado_salud: "SANO",
  })

  const set = (field: string, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await addPersona(form)
      onSuccess()
      onClose()
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div style={sharedStyles.modalOverlay} onClick={onClose}>
      <div style={sharedStyles.modal} onClick={e => e.stopPropagation()}>
        <div style={sharedStyles.modalHeader}>
          <span style={sharedStyles.modalTitle}>NUEVO SUPERVIVIENTE</span>
          <button style={sharedStyles.modalClose} onClick={onClose}>✕</button>
        </div>
        {error && (
          <div style={{ ...sharedStyles.errorBanner, margin: "16px 24px 0" }}>⚠ {error}</div>
        )}
        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={sharedStyles.label}>NOMBRE</label>
              <input style={{ ...sharedStyles.input, marginTop: 4 }} placeholder="Nombre"
                value={form.nombre} onChange={e => set("nombre", e.target.value)} required />
            </div>
            <div style={{ flex: 1 }}>
              <label style={sharedStyles.label}>APELLIDOS</label>
              <input style={{ ...sharedStyles.input, marginTop: 4 }} placeholder="Apellidos"
                value={form.apellidos} onChange={e => set("apellidos", e.target.value)} required />
            </div>
          </div>
          <div>
            <label style={sharedStyles.label}>FECHA DE NACIMIENTO</label>
            <input type="date" style={{ ...sharedStyles.input, marginTop: 4 }}
              value={form.fecha_nacimiento} onChange={e => set("fecha_nacimiento", e.target.value)} required />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={sharedStyles.label}>HAB. COMBATE (0-10)</label>
              <input type="number" min={0} max={10} style={{ ...sharedStyles.input, marginTop: 4 }}
                value={form.habilidades_combate} onChange={e => set("habilidades_combate", Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={sharedStyles.label}>CONFIANZA (0-10)</label>
              <input type="number" min={0} max={10} style={{ ...sharedStyles.input, marginTop: 4 }}
                value={form.nivel_confianza} onChange={e => set("nivel_confianza", Number(e.target.value))} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={sharedStyles.label}>ESTADO</label>
              <select style={{ ...sharedStyles.input, marginTop: 4 }}
                value={form.estado_salud} onChange={e => set("estado_salud", e.target.value)}>
                {["SANO","HERIDO","ENFERMO"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button type="submit" style={sharedStyles.submitBtn} disabled={saving}>
            {saving ? "PROCESANDO..." : "INCORPORAR AL CAMPAMENTO"}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")
  const [modalOpen, setModal]   = useState(false)

  const cargar = async () => {
    try {
      setLoading(true)
      setError("")
      const data = await getPersonas()
      setPersonas(data)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const handleEstado = async (id: number, estado_salud: string) => {
    try {
      await updateEstadoPersona(id, estado_salud)
      await cargar()
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    }
  }

  /*const handleCargo = async (id: number, cargo_id: number) => {
    try {
      await moverPersonaRol(id, cargo_id, "Reasignación manual")
      await cargar()
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    }
  }*/

  return (
    <div style={sharedStyles.root}>
      <PageHeader titulo="COMANDO CENTRAL" subtitulo="Gestión de Supervivientes" />

      <main style={sharedStyles.main}>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {ESTADOS.map(e => {
            const count = personas.filter(p => p.estado_salud === e).length
            return (
              <div key={e} style={{ display: "flex", alignItems: "center", gap: 12,
                padding: "12px 20px", border: `1px solid ${ESTADO_COLOR[e]}`,
                background: "rgba(15,23,42,0.8)", minWidth: 120 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%",
                  background: ESTADO_COLOR[e], animation: "pulse 2s ease-in-out infinite" }} />
                <div>
                  <div style={{ fontSize: 28, fontWeight: 700, color: ESTADO_COLOR[e], lineHeight: 1 }}>
                    {count}
                  </div>
                  <div style={{ fontSize: 11, color: theme.colors.textDim, letterSpacing: 2, marginTop: 2 }}>
                    {ESTADO_LABEL[e]}
                  </div>
                </div>
              </div>
            )
          })}
          <div style={{ display: "flex", alignItems: "center", gap: 12,
            padding: "12px 20px", border: `1px solid ${theme.colors.red}`,
            background: "rgba(15,23,42,0.8)", minWidth: 120, marginLeft: "auto" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%",
              background: theme.colors.red, animation: "pulse 2s ease-in-out infinite" }} />
            <div>
              <div style={{ fontSize: 28, fontWeight: 700, color: theme.colors.red, lineHeight: 1 }}>
                {personas.length}
              </div>
              <div style={{ fontSize: 11, color: theme.colors.textDim, letterSpacing: 2, marginTop: 2 }}>
                Total
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={sharedStyles.errorBanner}>
            ⚠ {error}
            <button style={{ background: "none", border: "none",
              color: theme.colors.red, cursor: "pointer" }} onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* Encabezado tabla */}
        <div style={{ display: "flex", alignItems: "center",
          justifyContent: "space-between", marginBottom: 12 }}>
          <div style={sharedStyles.sectionTitle}>▮ REGISTRO DE SUPERVIVIENTES</div>
          <button style={sharedStyles.actionBtn} onClick={() => setModal(true)}>+ INCORPORAR</button>
        </div>

        {/* Tabla */}
        <div style={sharedStyles.tableWrap}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 32,
              color: theme.colors.textDim, fontFamily: theme.fonts.mono, fontSize: 14 }}>
              <span style={{ width: 8, height: 8, background: theme.colors.green,
                borderRadius: "50%", animation: "blink 1s step-end infinite", display: "inline-block" }} />
              Escaneando base de datos...
            </div>
          ) : personas.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#334155",
              fontFamily: theme.fonts.mono, fontSize: 14 }}>
              No hay supervivientes registrados
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["ID", "NOMBRE", "CARGO", "COMBATE", "CONFIANZA", "ESTADO", "UBICACIÓN"].map(h => (
                    <th key={h} style={sharedStyles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {personas.map((p, i) => (
                  <tr key={p.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <td style={sharedStyles.td}>
                      <span style={{ fontFamily: theme.fonts.mono, fontSize: 12,
                        color: "#334155", background: "rgba(51,65,85,0.3)", padding: "2px 8px" }}>
                        #{p.id}
                      </span>
                    </td>
                    <td style={{ ...sharedStyles.td, color: "#e2e8f0", fontWeight: 600 }}>
                      {p.nombre} {p.apellidos}
                      {p.es_temporal ? (
                        <span style={{ fontSize: 10, color: "#fb923c", marginLeft: 6,
                          fontFamily: theme.fonts.mono }}>TEMP</span>
                      ) : null}
                    </td>
                    <td style={{ ...sharedStyles.td, fontFamily: theme.fonts.mono, fontSize: 12 }}>
                      {p.cargo ?? "—"}
                    </td>
                    <td style={sharedStyles.td}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} style={{ width: 6, height: 12,
                            background: i < p.habilidades_combate ? "#f87171" : "rgba(51,65,85,0.4)" }} />
                        ))}
                      </div>
                    </td>
                    <td style={sharedStyles.td}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div key={i} style={{ width: 6, height: 12,
                            background: i < p.nivel_confianza ? "#10b981" : "rgba(51,65,85,0.4)" }} />
                        ))}
                      </div>
                    </td>
                    <td style={sharedStyles.td}>
                      <select style={{ ...sharedStyles.select, color: ESTADO_COLOR[p.estado_salud] }}
                        value={p.estado_salud}
                        onChange={e => handleEstado(p.id, e.target.value)}>
                        {ESTADOS.map(s => (
                          <option key={s} value={s}>{ESTADO_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td style={sharedStyles.td}>
                      <span style={{ fontSize: 11, fontFamily: theme.fonts.mono,
                        color: p.esta_en_campamento ? "#4ade80" : "#94a3b8" }}>
                        {p.esta_en_campamento ? "EN BASE" : "FUERA"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {modalOpen && (
        <ModalAgregarPersona onClose={() => setModal(false)} onSuccess={cargar} />
      )}
    </div>
  )
}