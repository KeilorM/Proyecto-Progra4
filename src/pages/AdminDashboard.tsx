import { useEffect, useState } from "react"
import PageHeader from "../components/PageHeader"
import { sharedStyles, theme } from "../styles/theme"
import { useInactivityTimer } from "../hooks/useInactivityTimer"
import { getPersonas, updateEstadoPersona, addPersona, getSolicitudesRecibidas, responderSolicitud } from "../services/api"

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface Solicitud {
  id: number
  tipo_solicitud: "RECURSOS" | "PERSONAS"
  detalle: { descripcion?: string }
  estado: "PENDIENTE" | "APROBADA" | "RECHAZADA" | "COMPLETADA"
  fecha_solicitud: string
  campamento_origen: string
  nota_respuesta?: string
}

type Tab = "supervivientes" | "solicitudes"

interface Persona {
  id: number
  nombre: string
  apellidos: string
  fecha_nacimiento: string
  habilidades_combate: number
  nivel_confianza: number
  estado_salud: "SANO" | "HERIDO" | "ENFERMO" | "MUERTO"
  esta_en_campamento: boolean
  cargo: string
  es_temporal: boolean
}

const ESTADOS = ["SANO", "HERIDO", "ENFERMO", "MUERTO"] as const

const ESTADO_COLOR: Record<string, string> = {
  SANO:    "#4ade80",
  HERIDO:  "#fb923c",
  ENFERMO: "#facc15",
  MUERTO:  "#94a3b8",
}

const ESTADO_LABEL: Record<string, string> = {
  SANO:    "Sano",
  HERIDO:  "Herido",
  ENFERMO: "Enfermo",
  MUERTO:  "Muerto",
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
  useInactivityTimer()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState("")
  const [modalOpen, setModal]   = useState(false)
  const [tab, setTab] = useState<Tab>("supervivientes")
 const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])

  const cargar = async () => {
    try {
      setLoading(true)
      setError("")
      const [data, sols] = await Promise.all([
        getPersonas(),
        getSolicitudesRecibidas(),
      ])
      setPersonas(data)
      setSolicitudes(sols)
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

  const handleResponder = async (id: number, estado: "APROBADA" | "RECHAZADA") => {
  try {
    await responderSolicitud(id, estado)
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

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: `1px solid ${theme.colors.border}`, marginBottom: 0 }}>
          {(["supervivientes", "solicitudes"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontFamily: theme.fonts.mono, fontSize: 12, letterSpacing: 2,
              padding: "10px 24px", background: tab === t ? "rgba(16,185,129,0.1)" : "transparent",
              color: tab === t ? theme.colors.green : theme.colors.textDim,
              border: "none", borderBottom: tab === t ? `2px solid ${theme.colors.green}` : "2px solid transparent",
              cursor: "pointer", textTransform: "uppercase" as const,
            }}>
              {t === "solicitudes" && solicitudes.filter(s => s.estado === "PENDIENTE").length > 0 && (
                <span style={{ marginRight: 6, background: "#f87171",
                  color: "#fff", fontSize: 10, padding: "1px 5px", borderRadius: 8 }}>
                  {solicitudes.filter(s => s.estado === "PENDIENTE").length}
                </span>
              )}
              {t}
            </button>
          ))}
          {tab === "supervivientes" && (
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
              <button style={sharedStyles.actionBtn} onClick={() => setModal(true)}>+ INCORPORAR</button>
            </div>
          )}
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
          ) : tab === "supervivientes" ? (
            personas.length === 0 ? (
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
                              background: i < Number(p.habilidades_combate) ? "#f87171" : "rgba(51,65,85,0.4)" }} />
                          ))}
                        </div>
                      </td>
                      <td style={sharedStyles.td}>
                        <div style={{ display: "flex", gap: 2 }}>
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div key={i} style={{ width: 6, height: 12,
                              background: i < Number(p.nivel_confianza) ? "#10b981" : "rgba(51,65,85,0.4)" }} />
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
            )
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["ORIGEN", "TIPO", "DETALLE", "ESTADO", "FECHA", "ACCIÓN"].map(h => (
                    <th key={h} style={sharedStyles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {solicitudes.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ ...sharedStyles.td, textAlign: "center",
                      color: "#334155", fontFamily: theme.fonts.mono, fontSize: 14, padding: 32 }}>
                      No hay solicitudes recibidas
                    </td>
                  </tr>
                ) : (
                  solicitudes.map(s => (
                    <tr key={s.id}>
                      <td style={sharedStyles.td}>{s.campamento_origen}</td>
                      <td style={sharedStyles.td}>{s.tipo_solicitud}</td>
                      <td style={sharedStyles.td}>{s.detalle?.descripcion ?? "—"}</td>
                      <td style={sharedStyles.td}>
                        <span style={{ fontFamily: theme.fonts.mono, fontSize: 11,
                          color: s.estado === "PENDIENTE" ? "#facc15" :
                                s.estado === "APROBADA" ? "#4ade80" : "#f87171",
                          border: `1px solid ${s.estado === "PENDIENTE" ? "#facc15" :
                                s.estado === "APROBADA" ? "#4ade80" : "#f87171"}`,
                          padding: "2px 8px" }}>
                          {s.estado}
                        </span>
                      </td>
                      <td style={{ ...sharedStyles.td, fontFamily: theme.fonts.mono, fontSize: 12 }}>
                        {new Date(s.fecha_solicitud).toLocaleDateString()}
                      </td>
                      <td style={sharedStyles.td}>
                        {s.estado === "PENDIENTE" && (
                          <div style={{ display: "flex", gap: 6 }}>
                            <button onClick={() => handleResponder(s.id, "APROBADA")}
                              style={{ ...sharedStyles.actionBtn, padding: "4px 10px",
                                fontSize: 11, background: "rgba(16,185,129,0.15)" }}>
                              ✓ APROBAR
                            </button>
                            <button onClick={() => handleResponder(s.id, "RECHAZADA")}
                              style={{ ...sharedStyles.actionBtn, padding: "4px 10px",
                                fontSize: 11, background: "rgba(239,68,68,0.15)",
                                borderColor: "#f87171", color: "#f87171" }}>
                              ✕ RECHAZAR
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
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