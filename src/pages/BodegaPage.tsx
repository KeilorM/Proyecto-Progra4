import { useEffect, useState } from "react"
import { getBodega, getAlertas, getMovimientos, registrarMovimiento } from "../services/api"
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
  unidad: string
  es_vital: number
  cantidad_al_momento: number
  cantidad_minima: number
  estado: string
  fecha_generacion: string
}

interface Movimiento {
  id: number
  recurso: string
  cantidad: number
  tipo_movimiento: "ENTRADA" | "SALIDA"
  origen: string
  nota: string
  fecha: string
  registrado_por: string
}

const ORIGENES = ["CONSUMO_DIARIO", "PRODUCCION", "EXPLORACION", "TRASLADO_ENVIADO", "TRASLADO_RECIBIDO"]

// ─── MODAL MOVIMIENTO ─────────────────────────────────────────────────────────

function ModalMovimiento({
  items,
  onClose,
  onSuccess,
}: {
  items: ItemBodega[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState("")
  const [form, setForm]     = useState({
    tipo_recurso_id: items[0]?.id ?? 0,
    cantidad: 1,
    tipo_movimiento: "ENTRADA" as "ENTRADA" | "SALIDA",
    origen: "PRODUCCION",
    nota: "",
  })

  const set = (field: string, value: string | number) =>
    setForm(f => ({ ...f, [field]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await registrarMovimiento({ ...form, cantidad: Number(form.cantidad) })
      onClose()
      await onSuccess()
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
          <span style={sharedStyles.modalTitle}>REGISTRAR MOVIMIENTO</span>
          <button style={sharedStyles.modalClose} onClick={onClose}>✕</button>
        </div>

        {error && (
          <div style={{ ...sharedStyles.errorBanner, margin: "16px 24px 0" }}>⚠ {error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={sharedStyles.label}>RECURSO</label>
            <select style={{ ...sharedStyles.input, marginTop: 4 }}
              value={form.tipo_recurso_id}
              onChange={e => set("tipo_recurso_id", Number(e.target.value))}>
              {items.map(i => (
                <option key={i.id} value={i.id}>{i.recurso} ({i.unidad})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={sharedStyles.label}>TIPO</label>
              <select style={{ ...sharedStyles.input, marginTop: 4,
                color: form.tipo_movimiento === "ENTRADA" ? "#4ade80" : "#f87171" }}
                value={form.tipo_movimiento}
                onChange={e => set("tipo_movimiento", e.target.value)}>
                <option value="ENTRADA">ENTRADA</option>
                <option value="SALIDA">SALIDA</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={sharedStyles.label}>CANTIDAD</label>
              <input type="number" min={1} style={{ ...sharedStyles.input, marginTop: 4 }}
                value={form.cantidad}
                onChange={e => set("cantidad", Number(e.target.value))} required />
            </div>
          </div>

          <div>
            <label style={sharedStyles.label}>ORIGEN</label>
            <select style={{ ...sharedStyles.input, marginTop: 4 }}
              value={form.origen}
              onChange={e => set("origen", e.target.value)}>
              {ORIGENES.map(o => <option key={o} value={o}>{o.replace(/_/g, " ")}</option>)}
            </select>
          </div>

          <div>
            <label style={sharedStyles.label}>NOTA (opcional)</label>
            <input style={{ ...sharedStyles.input, marginTop: 4 }} placeholder="Descripción del movimiento"
              value={form.nota} onChange={e => set("nota", e.target.value)} />
          </div>

          <button type="submit" style={sharedStyles.submitBtn} disabled={saving}>
            {saving ? "PROCESANDO..." : "CONFIRMAR MOVIMIENTO"}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── BODEGA PAGE ──────────────────────────────────────────────────────────────

type Tab = "inventario" | "alertas" | "historial"

export default function BodegaPage() {
  const [items, setItems]           = useState<ItemBodega[]>([])
  const [alertas, setAlertas]       = useState<Alerta[]>([])
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState("")
  const [tab, setTab]               = useState<Tab>("inventario")
  const [modalOpen, setModal]       = useState(false)

  const cargar = async () => {
    try {
      setLoading(true)
      setError("")
      const [bodega, als, movs] = await Promise.all([
        getBodega(),
        getAlertas(),
        getMovimientos(),
      ])
      setItems(bodega)
      setAlertas(als)
      setMovimientos(movs)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { cargar() }, [])

  const totalVital    = items.filter(i => i.es_vital).reduce((s, i) => s + i.cantidad_actual, 0)
  const totalBajoMin  = items.filter(i => i.bajo_minimo).length

  return (
    <div style={sharedStyles.root}>
      <PageHeader titulo="ALMACÉN CENTRAL" subtitulo="Control de Recursos y Suministros" />

      <main style={sharedStyles.main}>

        {/* Stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
          {[
            { label: "Recursos", value: items.length, color: theme.colors.green },
            { label: "Vitales", value: items.filter(i => i.es_vital).length, color: "#60a5fa" },
            { label: "Bajo mínimo", value: totalBajoMin, color: totalBajoMin > 0 ? "#f87171" : theme.colors.green },
            { label: "Alertas activas", value: alertas.length, color: alertas.length > 0 ? "#facc15" : theme.colors.green },
            { label: "Total vital", value: totalVital, color: "#a78bfa" },
          ].map(s => (
            <div key={s.label} style={{ display: "flex", alignItems: "center", gap: 12,
              padding: "12px 20px", border: `1px solid ${s.color}`,
              background: "rgba(15,23,42,0.8)", minWidth: 130 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%",
                background: s.color, animation: "pulse 2s ease-in-out infinite" }} />
              <div>
                <div style={{ fontSize: 28, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: theme.colors.textDim, letterSpacing: 2, marginTop: 2 }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
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
        <div style={{ display: "flex", gap: 0, marginBottom: 0,
          borderBottom: `1px solid ${theme.colors.border}` }}>
          {(["inventario", "alertas", "historial"] as Tab[]).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              fontFamily: theme.fonts.mono,
              fontSize: 12,
              letterSpacing: 2,
              padding: "10px 24px",
              background: tab === t ? "rgba(16,185,129,0.1)" : "transparent",
              color: tab === t ? theme.colors.green : theme.colors.textDim,
              border: "none",
              borderBottom: tab === t ? `2px solid ${theme.colors.green}` : "2px solid transparent",
              cursor: "pointer",
              textTransform: "uppercase" as const,
            }}>
              {t}
              {t === "alertas" && alertas.length > 0 && (
                <span style={{ marginLeft: 6, background: "#f87171",
                  color: "#fff", fontSize: 10, padding: "1px 5px", borderRadius: 8 }}>
                  {alertas.length}
                </span>
              )}
            </button>
          ))}
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
            <button style={sharedStyles.actionBtn} onClick={() => setModal(true)}>
              + MOVIMIENTO
            </button>
          </div>
        </div>

        {/* Contenido tabs */}
        <div style={sharedStyles.tableWrap}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 32,
              color: theme.colors.textDim, fontFamily: theme.fonts.mono, fontSize: 14 }}>
              <span style={{ width: 8, height: 8, background: theme.colors.green,
                borderRadius: "50%", animation: "blink 1s step-end infinite", display: "inline-block" }} />
              Cargando suministros...
            </div>
          ) : tab === "inventario" ? (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {["RECURSO", "UNIDAD", "VITAL", "CANTIDAD", "MÍNIMO", "ESTADO"].map(h => (
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
                        <span style={{ color: theme.colors.textDim, fontSize: 11 }}>—</span>
                      )}
                    </td>
                    <td style={sharedStyles.td}>
                      <span style={{ fontSize: 20, fontWeight: 700,
                        color: item.bajo_minimo ? "#f87171" : "#4ade80" }}>
                        {item.cantidad_actual}
                      </span>
                    </td>
                    <td style={{ ...sharedStyles.td, color: theme.colors.textDim }}>
                      {item.cantidad_minima_alerta}
                    </td>
                    <td style={sharedStyles.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ flex: 1, height: 6, background: "rgba(51,65,85,0.5)",
                          borderRadius: 3, overflow: "hidden", minWidth: 80 }}>
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
          ) : tab === "alertas" ? (
            alertas.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: "#334155",
                fontFamily: theme.fonts.mono, fontSize: 14 }}>
                ✓ Sin alertas activas
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["RECURSO", "VITAL", "CANTIDAD ACTUAL", "MÍNIMO", "FECHA"].map(h => (
                      <th key={h} style={sharedStyles.th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {alertas.map((a, i) => (
                    <tr key={a.id} style={{ animationDelay: `${i * 0.04}s` }}>
                      <td style={{ ...sharedStyles.td, color: "#e2e8f0", fontWeight: 600 }}>{a.recurso}</td>
                      <td style={sharedStyles.td}>
                        {a.es_vital ? <span style={{ color: "#f87171", fontFamily: theme.fonts.mono, fontSize: 11 }}>⚠ VITAL</span> : "—"}
                      </td>
                      <td style={{ ...sharedStyles.td, color: "#f87171", fontSize: 20, fontWeight: 700 }}>
                        {a.cantidad_al_momento}
                      </td>
                      <td style={{ ...sharedStyles.td, color: theme.colors.textDim }}>{a.cantidad_minima}</td>
                      <td style={{ ...sharedStyles.td, fontFamily: theme.fonts.mono, fontSize: 12 }}>
                        {new Date(a.fecha_generacion).toLocaleDateString()}
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
                  {["RECURSO", "TIPO", "CANTIDAD", "ORIGEN", "REGISTRADO POR", "FECHA", "NOTA"].map(h => (
                    <th key={h} style={sharedStyles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {movimientos.map((m, i) => (
                  <tr key={m.id} style={{ animationDelay: `${i * 0.04}s` }}>
                    <td style={{ ...sharedStyles.td, color: "#e2e8f0", fontWeight: 600 }}>{m.recurso}</td>
                    <td style={sharedStyles.td}>
                      <span style={{ fontFamily: theme.fonts.mono, fontSize: 11,
                        color: m.tipo_movimiento === "ENTRADA" ? "#4ade80" : "#f87171",
                        border: `1px solid ${m.tipo_movimiento === "ENTRADA" ? "#4ade80" : "#f87171"}`,
                        padding: "2px 8px" }}>
                        {m.tipo_movimiento === "ENTRADA" ? "▲ ENTRADA" : "▼ SALIDA"}
                      </span>
                    </td>
                    <td style={{ ...sharedStyles.td, fontSize: 18, fontWeight: 700,
                      color: m.tipo_movimiento === "ENTRADA" ? "#4ade80" : "#f87171" }}>
                      {m.tipo_movimiento === "ENTRADA" ? "+" : "-"}{m.cantidad}
                    </td>
                    <td style={{ ...sharedStyles.td, fontFamily: theme.fonts.mono, fontSize: 11 }}>
                      {m.origen.replace(/_/g, " ")}
                    </td>
                    <td style={{ ...sharedStyles.td, color: theme.colors.textMuted }}>{m.registrado_por}</td>
                    <td style={{ ...sharedStyles.td, fontFamily: theme.fonts.mono, fontSize: 12 }}>
                      {new Date(m.fecha).toLocaleString()}
                    </td>
                    <td style={{ ...sharedStyles.td, color: theme.colors.textDim, fontSize: 13 }}>
                      {m.nota ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </main>

      {modalOpen && (
        <ModalMovimiento
          items={items}
          onClose={() => setModal(false)}
          onSuccess={cargar}
        />
      )}

    </div>
  )
}
