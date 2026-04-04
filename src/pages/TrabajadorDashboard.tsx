import { useEffect, useState } from "react"
import { getBodega, getAlertas } from "../services/api"
import PageHeader from "../components/PageHeader"
import { sharedStyles, theme } from "../styles/theme"

// ─── TIPOS ───────────────────────────────────────────────────────────────────

interface ItemBodega {
  id: number
  recurso: string
  unidad: string
  es_vital: number
  cantidad_actual: number
  cantidad_minima_alerta: number
  bajo_minimo: number
}

interface Alerta {
  id: number
  recurso: string
  es_vital: number
  cantidad_al_momento: number
  cantidad_minima: number
  fecha_generacion: string
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

export default function TrabajadorDashboard() {
  const [items, setItems]     = useState<ItemBodega[]>([])
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState("")

  const cargar = async () => {
    try {
      setLoading(true)
      setError("")
      const [bodega, als] = await Promise.all([getBodega(), getAlertas()])
      setItems(bodega)
      setAlertas(als)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  return (
    <div style={sharedStyles.root}>
      <PageHeader titulo="PUESTO DE TRABAJO" subtitulo="Vista de Suministros Asignados" />

      <main style={sharedStyles.main}>

        {/* Aviso rol */}
        <div style={{
          display: "flex", alignItems: "center", gap: 10,
          background: "rgba(16,185,129,0.05)",
          border: `1px solid ${theme.colors.greenBorder}`,
          padding: "10px 16px", marginBottom: 24,
          fontFamily: theme.fonts.mono, fontSize: 12,
          color: theme.colors.green, letterSpacing: 1,
        }}>
          ▮ MODO LECTURA — Solo el Gestor de Recursos puede autorizar cambios de inventario
        </div>

        {/* Alertas activas */}
        {alertas.length > 0 && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ ...sharedStyles.sectionTitle, marginBottom: 10 }}>
              ⚠ ALERTAS ACTIVAS
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {alertas.map(a => (
                <div key={a.id} style={{
                  padding: "10px 16px",
                  border: "1px solid #f87171",
                  background: "rgba(239,68,68,0.08)",
                  display: "flex", alignItems: "center", gap: 10,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%",
                    background: "#f87171", animation: "pulse 1.5s ease-in-out infinite" }} />
                  <div>
                    <div style={{ fontSize: 13, color: "#e2e8f0", fontWeight: 600 }}>
                      {a.recurso}
                      {a.es_vital ? (
                        <span style={{ fontSize: 10, color: "#f87171",
                          fontFamily: theme.fonts.mono, marginLeft: 6 }}>VITAL</span>
                      ) : null}
                    </div>
                    <div style={{ fontSize: 11, color: theme.colors.textDim,
                      fontFamily: theme.fonts.mono, marginTop: 2 }}>
                      {a.cantidad_al_momento} / mín {a.cantidad_minima}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={sharedStyles.errorBanner}>
            ⚠ {error}
            <button style={{ background: "none", border: "none",
              color: theme.colors.red, cursor: "pointer" }} onClick={() => setError("")}>✕</button>
          </div>
        )}

        {/* Título tabla */}
        <div style={{ ...sharedStyles.sectionTitle, marginBottom: 12 }}>
          ▮ SUMINISTROS DEL CAMPAMENTO
        </div>

        {/* Tabla */}
        <div style={sharedStyles.tableWrap}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 32,
              color: theme.colors.textDim, fontFamily: theme.fonts.mono, fontSize: 14 }}>
              <span style={{ width: 8, height: 8, background: theme.colors.green,
                borderRadius: "50%", animation: "blink 1s step-end infinite", display: "inline-block" }} />
              Cargando suministros...
            </div>
          ) : items.length === 0 ? (
            <div style={{ padding: 32, textAlign: "center", color: "#334155",
              fontFamily: theme.fonts.mono, fontSize: 14 }}>
              No hay recursos registrados
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["RECURSO", "UNIDAD", "VITAL", "CANTIDAD", "ESTADO"].map(h => (
                    <th key={h} style={sharedStyles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={item.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <td style={{ ...sharedStyles.td, color: "#e2e8f0", fontWeight: 600 }}>
                      {item.recurso}
                    </td>
                    <td style={{ ...sharedStyles.td, fontFamily: theme.fonts.mono, fontSize: 12 }}>
                      {item.unidad}
                    </td>
                    <td style={sharedStyles.td}>
                      {item.es_vital ? (
                        <span style={{ color: "#f87171", fontFamily: theme.fonts.mono, fontSize: 11 }}>
                          ⚠ VITAL
                        </span>
                      ) : (
                        <span style={{ color: theme.colors.textDim }}>—</span>
                      )}
                    </td>
                    <td style={sharedStyles.td}>
                      <span style={{ fontSize: 22, fontWeight: 700,
                        color: item.bajo_minimo ? "#f87171" : "#4ade80" }}>
                        {item.cantidad_actual}
                      </span>
                      <span style={{ fontSize: 11, color: theme.colors.textDim,
                        fontFamily: theme.fonts.mono, marginLeft: 6 }}>
                        {item.unidad}
                      </span>
                    </td>
                    <td style={sharedStyles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ flex: 1, height: 6, background: "rgba(51,65,85,0.5)",
                          borderRadius: 3, overflow: "hidden", minWidth: 100 }}>
                          <div style={{
                            height: "100%",
                            width: `${Math.min(100, (item.cantidad_actual / (item.cantidad_minima_alerta * 3)) * 100)}%`,
                            background: item.bajo_minimo ? "#f87171" : "#10b981",
                            borderRadius: 3,
                            transition: "width 0.5s ease",
                          }} />
                        </div>
                        <span style={{ fontSize: 10, fontFamily: theme.fonts.mono,
                          color: item.bajo_minimo ? "#f87171" : "#4ade80", minWidth: 50 }}>
                          {item.bajo_minimo ? "BAJO MÍN" : "OK"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  )
}
