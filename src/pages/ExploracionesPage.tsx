import { useEffect, useState } from 'react'
import {
  getExploraciones,
  crearExploracion,
  completarExploracion,
  getCampamentos,
  crearSolicitud,
  getPersonas,
  getBodega,
  getSolicitudesEnviadas,
} from '../services/api'
import PageHeader from '../components/PageHeader'
import { sharedStyles, theme } from '../styles/theme'
import { useInactivityTimer } from '../hooks/useInactivityTimer'
import { useIsMobile } from '../hooks/useIsMobile'

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface Exploracion {
  id: number
  nombre_mision: string
  fecha_salida: string
  dias_estimados: number
  dias_extra_max: number
  estado: 'PLANIFICADA' | 'EN_CURSO' | 'COMPLETADA' | 'FALLIDA'
  descripcion_zona: string
  total_personas: number
}

interface Campamento {
  id: number
  nombre: string
  ubicacion: string
}

interface Persona {
  id: number
  nombre: string
  apellidos: string
  cargo: string
}

interface ItemBodega {
  id: number
  recurso: string
  unidad: string
}

interface Solicitud {
  id: number
  tipo_solicitud: 'RECURSOS' | 'PERSONAS'
  detalle: { descripcion?: string }
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'COMPLETADA'
  fecha_solicitud: string
  campamento_destino: string
  nota_respuesta?: string
}

const ESTADO_COLOR: Record<string, string> = {
  PLANIFICADA: '#60a5fa',
  EN_CURSO: '#facc15',
  COMPLETADA: '#4ade80',
  FALLIDA: '#f87171',
}

const ROLES_MISION = ['LIDER', 'EXPLORADOR', 'MEDICO_CAMPO']

// ─── MODAL CREAR EXPLORACIÓN ─────────────────────────────────────────────────
function ModalCrearExploracion({
  personas,
  onClose,
  onSuccess,
}: {
  personas: Persona[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre_mision: '',
    fecha_salida: '',
    dias_estimados: 3,
    dias_extra_max: 1,
    descripcion_zona: '',
  })
  const [equipo, setEquipo] = useState<{ persona_id: number; rol_en_mision: string }[]>([])

  const set = (field: string, value: string | number) => setForm((f) => ({ ...f, [field]: value }))

  const togglePersona = (id: number) =>
    setEquipo((prev) =>
      prev.find((p) => p.persona_id === id)
        ? prev.filter((p) => p.persona_id !== id)
        : [...prev, { persona_id: id, rol_en_mision: 'EXPLORADOR' }]
    )

  const setRol = (persona_id: number, rol_en_mision: string) =>
    setEquipo((prev) =>
      prev.map((p) => (p.persona_id === persona_id ? { ...p, rol_en_mision } : p))
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (equipo.length === 0) {
      setError('Debes agregar al menos una persona')
      return
    }
    try {
      setSaving(true)
      await crearExploracion({ ...form, personas: equipo })
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
      <div
        style={{
          ...sharedStyles.modal,
          maxWidth: 'min(560px, 95vw)',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={sharedStyles.modalHeader}>
          <span style={sharedStyles.modalTitle}>NUEVA MISIÓN</span>
          <button style={sharedStyles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        {error && (
          <div style={{ ...sharedStyles.errorBanner, margin: '16px 24px 0' }}>⚠ {error}</div>
        )}
        <form
          onSubmit={handleSubmit}
          style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div>
            <label style={sharedStyles.label}>NOMBRE DE MISIÓN</label>
            <input
              style={{ ...sharedStyles.input, marginTop: 4 }}
              placeholder="Ej: Reconocimiento Norte"
              value={form.nombre_mision}
              onChange={(e) => set('nombre_mision', e.target.value)}
              required
            />
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ flex: '2 1 160px' }}>
              <label style={sharedStyles.label}>FECHA DE SALIDA</label>
              <input
                type="datetime-local"
                style={{ ...sharedStyles.input, marginTop: 4 }}
                value={form.fecha_salida}
                onChange={(e) => set('fecha_salida', e.target.value)}
                required
              />
            </div>
            <div style={{ flex: '1 1 80px' }}>
              <label style={sharedStyles.label}>DÍAS EST.</label>
              <input
                type="number"
                min={1}
                style={{ ...sharedStyles.input, marginTop: 4 }}
                value={form.dias_estimados}
                onChange={(e) => set('dias_estimados', Number(e.target.value))}
              />
            </div>
            <div style={{ flex: '1 1 80px' }}>
              <label style={sharedStyles.label}>DÍAS EXTRA</label>
              <input
                type="number"
                min={0}
                style={{ ...sharedStyles.input, marginTop: 4 }}
                value={form.dias_extra_max}
                onChange={(e) => set('dias_extra_max', Number(e.target.value))}
              />
            </div>
          </div>
          <div>
            <label style={sharedStyles.label}>ZONA OBJETIVO</label>
            <input
              style={{ ...sharedStyles.input, marginTop: 4 }}
              placeholder="Descripción del área"
              value={form.descripcion_zona}
              onChange={(e) => set('descripcion_zona', e.target.value)}
            />
          </div>
          <div>
            <label style={{ ...sharedStyles.label, display: 'block', marginBottom: 8 }}>
              EQUIPO ({equipo.length} seleccionados)
            </label>
            <div
              style={{
                border: `1px solid ${theme.colors.border}`,
                maxHeight: 200,
                overflowY: 'auto',
              }}
            >
              {personas.map((p) => {
                const seleccionado = equipo.find((e) => e.persona_id === p.id)
                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '8px 12px',
                      background: seleccionado ? 'rgba(16,185,129,0.08)' : 'transparent',
                      borderBottom: `1px solid ${theme.colors.rowBorder}`,
                      cursor: 'pointer',
                      flexWrap: 'wrap',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!!seleccionado}
                      onChange={() => togglePersona(p.id)}
                      style={{ accentColor: theme.colors.green, cursor: 'pointer' }}
                    />
                    <span style={{ flex: 1, fontSize: 13, color: '#e2e8f0', minWidth: 100 }}>
                      {p.nombre} {p.apellidos}
                      <span style={{ fontSize: 11, color: theme.colors.textDim, marginLeft: 6 }}>
                        {p.cargo ?? 'Sin cargo'}
                      </span>
                    </span>
                    {seleccionado && (
                      <select
                        style={{ ...sharedStyles.select, fontSize: 11 }}
                        value={seleccionado.rol_en_mision}
                        onChange={(e) => {
                          e.stopPropagation()
                          setRol(p.id, e.target.value)
                        }}
                      >
                        {ROLES_MISION.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
          <button type="submit" style={sharedStyles.submitBtn} disabled={saving}>
            {saving ? 'PROCESANDO...' : 'AGENDAR MISIÓN'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── MODAL COMPLETAR EXPLORACIÓN ─────────────────────────────────────────────
function ModalCompletarExploracion({
  exploracion,
  itemsBodega,
  onClose,
  onSuccess,
}: {
  exploracion: Exploracion
  itemsBodega: ItemBodega[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [recursos, setRecursos] = useState<{ tipo_recurso_id: number; cantidad: number }[]>([])

  const agregarRecurso = () =>
    setRecursos((prev) => [...prev, { tipo_recurso_id: itemsBodega[0]?.id ?? 1, cantidad: 1 }])

  const updateRecurso = (i: number, field: string, value: number) =>
    setRecursos((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))

  const removeRecurso = (i: number) => setRecursos((prev) => prev.filter((_, idx) => idx !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await completarExploracion(exploracion.id, recursos)
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
      <div
        style={{ ...sharedStyles.modal, maxWidth: 'min(500px, 95vw)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={sharedStyles.modalHeader}>
          <span style={sharedStyles.modalTitle}>COMPLETAR MISIÓN</span>
          <button style={sharedStyles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        <div style={{ padding: '12px 24px 0', color: theme.colors.textMuted, fontSize: 13 }}>
          {exploracion.nombre_mision}
        </div>
        {error && (
          <div style={{ ...sharedStyles.errorBanner, margin: '12px 24px 0' }}>⚠ {error}</div>
        )}
        <form
          onSubmit={handleSubmit}
          style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={sharedStyles.label}>RECURSOS ENCONTRADOS</label>
            <button
              type="button"
              onClick={agregarRecurso}
              style={{ ...sharedStyles.actionBtn, padding: '4px 12px', fontSize: 11 }}
            >
              + AGREGAR
            </button>
          </div>
          {recursos.length === 0 && (
            <div
              style={{
                color: theme.colors.textDim,
                fontSize: 13,
                fontFamily: theme.fonts.mono,
                textAlign: 'center',
                padding: 12,
              }}
            >
              Sin recursos — misión sin hallazgos
            </div>
          )}
          {recursos.map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <select
                style={{ ...sharedStyles.input, flex: 2 }}
                value={r.tipo_recurso_id}
                onChange={(e) => updateRecurso(i, 'tipo_recurso_id', Number(e.target.value))}
              >
                {itemsBodega.map((ib) => (
                  <option key={ib.id} value={ib.id}>
                    {ib.recurso} ({ib.unidad})
                  </option>
                ))}
              </select>
              <input
                type="number"
                min={1}
                style={{ ...sharedStyles.input, flex: 1 }}
                value={r.cantidad}
                onChange={(e) => updateRecurso(i, 'cantidad', Number(e.target.value))}
              />
              <button
                type="button"
                onClick={() => removeRecurso(i)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: theme.colors.red,
                  cursor: 'pointer',
                  fontSize: 16,
                  padding: '0 4px',
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <button type="submit" style={sharedStyles.submitBtn} disabled={saving}>
            {saving ? 'PROCESANDO...' : 'CONFIRMAR RETORNO'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── MODAL SOLICITUD ─────────────────────────────────────────────────────────
function ModalSolicitud({
  campamentos,
  campamentoActual,
  onClose,
  onSuccess,
}: {
  campamentos: Campamento[]
  campamentoActual: number
  onClose: () => void
  onSuccess: () => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const otros = campamentos.filter((c) => c.id !== campamentoActual)
  const [form, setForm] = useState({
    campamento_destino_id: otros[0]?.id ?? 0,
    tipo_solicitud: 'RECURSOS' as 'RECURSOS' | 'PERSONAS',
    descripcion: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSaving(true)
      await crearSolicitud({
        campamento_destino_id: form.campamento_destino_id,
        tipo_solicitud: form.tipo_solicitud,
        detalle: { descripcion: form.descripcion },
      })
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
      <div
        style={{ ...sharedStyles.modal, maxWidth: 'min(480px, 95vw)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={sharedStyles.modalHeader}>
          <span style={sharedStyles.modalTitle}>NUEVA SOLICITUD</span>
          <button style={sharedStyles.modalClose} onClick={onClose}>
            ✕
          </button>
        </div>
        {error && (
          <div style={{ ...sharedStyles.errorBanner, margin: '16px 24px 0' }}>⚠ {error}</div>
        )}
        <form
          onSubmit={handleSubmit}
          style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div>
            <label style={sharedStyles.label}>CAMPAMENTO DESTINO</label>
            <select
              style={{ ...sharedStyles.input, marginTop: 4 }}
              value={form.campamento_destino_id}
              onChange={(e) =>
                setForm((f) => ({ ...f, campamento_destino_id: Number(e.target.value) }))
              }
            >
              {otros.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label style={sharedStyles.label}>TIPO DE SOLICITUD</label>
            <select
              style={{ ...sharedStyles.input, marginTop: 4 }}
              value={form.tipo_solicitud}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  tipo_solicitud: e.target.value as 'RECURSOS' | 'PERSONAS',
                }))
              }
            >
              <option value="RECURSOS">RECURSOS</option>
              <option value="PERSONAS">PERSONAS</option>
            </select>
          </div>
          <div>
            <label style={sharedStyles.label}>DESCRIPCIÓN</label>
            <input
              style={{ ...sharedStyles.input, marginTop: 4 }}
              placeholder="Detalle de lo solicitado"
              value={form.descripcion}
              onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))}
              required
            />
          </div>
          <button type="submit" style={sharedStyles.submitBtn} disabled={saving}>
            {saving ? 'ENVIANDO...' : 'ENVIAR SOLICITUD'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ─── EXPLORACIONES PAGE ───────────────────────────────────────────────────────
type Tab = 'exploraciones' | 'solicitudes'
type Modal = 'crear' | 'completar' | 'solicitud' | null

export default function ExploracionesPage() {
  useInactivityTimer()
  const isMobile = useIsMobile()
  const [exploraciones, setExploraciones] = useState<Exploracion[]>([])
  const [campamentos, setCampamentos] = useState<Campamento[]>([])
  const [personas, setPersonas] = useState<Persona[]>([])
  const [itemsBodega, setItemsBodega] = useState<ItemBodega[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('exploraciones')
  const [modal, setModal] = useState<Modal>(null)
  const [exploracionActiva, setExploracionActiva] = useState<Exploracion | null>(null)
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const campamentoActual = Number(localStorage.getItem('campamento') ?? 0)

  const cargar = async () => {
    try {
      setLoading(true)
      setError('')
      const [exps, camps, pers, bodega, sols] = await Promise.all([
        getExploraciones(),
        getCampamentos(),
        getPersonas(),
        getBodega(),
        getSolicitudesEnviadas(),
      ])
      setExploraciones(exps)
      setCampamentos(camps)
      setPersonas(pers)
      setItemsBodega(bodega)
      setSolicitudes(sols)
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      await cargar()
    }
    void fetchData()
  }, [])

  const planificadas = exploraciones.filter((e) => e.estado === 'PLANIFICADA').length
  const enCurso = exploraciones.filter((e) => e.estado === 'EN_CURSO').length
  const completadas = exploraciones.filter((e) => e.estado === 'COMPLETADA').length

  return (
    <div style={sharedStyles.root}>
      <PageHeader titulo="CENTRO DE OPERACIONES" subtitulo="Exploraciones y Comunicaciones" />

      <main style={{ ...sharedStyles.main, padding: isMobile ? '16px 12px' : '24px 32px' }}>
        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 10,
            marginBottom: 24,
          }}
        >
          {[
            { label: 'Planificadas', value: planificadas, color: '#60a5fa' },
            { label: 'En curso', value: enCurso, color: '#facc15' },
            { label: 'Completadas', value: completadas, color: '#4ade80' },
            { label: 'Total', value: exploraciones.length, color: theme.colors.textMuted },
          ].map((s) => (
            <div
              key={s.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 14px',
                border: `1px solid ${s.color}`,
                background: 'rgba(15,23,42,0.8)',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: s.color,
                  flexShrink: 0,
                  animation: 'pulse 2s ease-in-out infinite',
                }}
              />
              <div>
                <div
                  style={{
                    fontSize: isMobile ? 20 : 28,
                    fontWeight: 700,
                    color: s.color,
                    lineHeight: 1,
                  }}
                >
                  {s.value}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    color: theme.colors.textDim,
                    letterSpacing: 1,
                    marginTop: 2,
                  }}
                >
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div style={sharedStyles.errorBanner}>
            ⚠ {error}
            <button
              style={{
                background: 'none',
                border: 'none',
                color: theme.colors.red,
                cursor: 'pointer',
              }}
              onClick={() => setError('')}
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs + acciones */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${theme.colors.border}`,
            flexWrap: 'wrap',
          }}
        >
          {(['exploraciones', 'solicitudes'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: isMobile ? 10 : 12,
                letterSpacing: isMobile ? 1 : 2,
                padding: isMobile ? '8px 12px' : '10px 24px',
                background: tab === t ? 'rgba(16,185,129,0.1)' : 'transparent',
                color: tab === t ? theme.colors.green : theme.colors.textDim,
                border: 'none',
                borderBottom:
                  tab === t ? `2px solid ${theme.colors.green}` : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'uppercase' as const,
              }}
            >
              {t}
            </button>
          ))}
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            {tab === 'exploraciones' && (
              <button
                style={{
                  ...sharedStyles.actionBtn,
                  fontSize: isMobile ? 10 : 12,
                  padding: isMobile ? '6px 10px' : '8px 20px',
                }}
                onClick={() => setModal('crear')}
              >
                + {isMobile ? 'MISIÓN' : 'NUEVA MISIÓN'}
              </button>
            )}
            {tab === 'solicitudes' && (
              <button
                style={{
                  ...sharedStyles.actionBtn,
                  fontSize: isMobile ? 10 : 12,
                  padding: isMobile ? '6px 10px' : '8px 20px',
                }}
                onClick={() => setModal('solicitud')}
              >
                + {isMobile ? 'SOLICITUD' : 'SOLICITAR AYUDA'}
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div style={sharedStyles.tableWrap}>
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: 32,
                color: theme.colors.textDim,
                fontFamily: theme.fonts.mono,
                fontSize: 14,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  background: theme.colors.green,
                  borderRadius: '50%',
                  animation: 'blink 1s step-end infinite',
                  display: 'inline-block',
                }}
              />
              Escaneando operaciones...
            </div>
          ) : tab === 'exploraciones' ? (
            exploraciones.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: '#334155',
                  fontFamily: theme.fonts.mono,
                  fontSize: 14,
                }}
              >
                No hay misiones registradas
              </div>
            ) : isMobile ? (
              // ── Vista móvil: tarjetas de misión ──
              <div>
                {exploraciones.map((e, i) => (
                  <div
                    key={e.id}
                    style={{
                      padding: '14px 16px',
                      borderBottom: `1px solid rgba(30,41,59,0.8)`,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      animationDelay: `${i * 0.04}s`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                      }}
                    >
                      <div>
                        <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>
                          {e.nombre_mision}
                        </div>
                        {e.descripcion_zona && (
                          <div style={{ fontSize: 11, color: theme.colors.textDim, marginTop: 2 }}>
                            {e.descripcion_zona}
                          </div>
                        )}
                      </div>
                      <span
                        style={{
                          fontFamily: theme.fonts.mono,
                          fontSize: 10,
                          color: ESTADO_COLOR[e.estado],
                          border: `1px solid ${ESTADO_COLOR[e.estado]}`,
                          padding: '2px 6px',
                          flexShrink: 0,
                          marginLeft: 8,
                        }}
                      >
                        {e.estado}
                      </span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        gap: 16,
                        fontFamily: theme.fonts.mono,
                        fontSize: 11,
                        color: theme.colors.textDim,
                      }}
                    >
                      <span>📅 {new Date(e.fecha_salida).toLocaleDateString()}</span>
                      <span>
                        ⏱ {e.dias_estimados}d +{e.dias_extra_max}
                      </span>
                      <span style={{ color: theme.colors.green }}>👤 {e.total_personas}</span>
                    </div>
                    {e.estado === 'EN_CURSO' && (
                      <button
                        onClick={() => {
                          setExploracionActiva(e)
                          setModal('completar')
                        }}
                        style={{
                          ...sharedStyles.actionBtn,
                          padding: '6px 12px',
                          fontSize: 11,
                          alignSelf: 'flex-start',
                        }}
                      >
                        COMPLETAR MISIÓN
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // ── Vista desktop: tabla ──
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {[
                      'MISIÓN',
                      'FECHA SALIDA',
                      'DÍAS',
                      'DÍAS EXTRA',
                      'EQUIPO',
                      'ESTADO',
                      'ACCIÓN',
                    ].map((h) => (
                      <th key={h} style={sharedStyles.th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {exploraciones.map((e, i) => (
                    <tr key={e.id} style={{ animationDelay: `${i * 0.04}s` }}>
                      <td style={{ ...sharedStyles.td, color: '#e2e8f0', fontWeight: 600 }}>
                        {e.nombre_mision}
                        {e.descripcion_zona && (
                          <div style={{ fontSize: 11, color: theme.colors.textDim, marginTop: 2 }}>
                            {e.descripcion_zona}
                          </div>
                        )}
                      </td>
                      <td
                        style={{ ...sharedStyles.td, fontFamily: theme.fonts.mono, fontSize: 12 }}
                      >
                        {new Date(e.fecha_salida).toLocaleDateString()}
                      </td>
                      <td style={{ ...sharedStyles.td, textAlign: 'center' }}>
                        {e.dias_estimados}
                      </td>
                      <td
                        style={{
                          ...sharedStyles.td,
                          textAlign: 'center',
                          color: theme.colors.textDim,
                        }}
                      >
                        +{e.dias_extra_max}
                      </td>
                      <td style={{ ...sharedStyles.td, textAlign: 'center' }}>
                        <span
                          style={{
                            fontFamily: theme.fonts.mono,
                            fontSize: 13,
                            color: theme.colors.green,
                          }}
                        >
                          {e.total_personas} 👤
                        </span>
                      </td>
                      <td style={sharedStyles.td}>
                        <span
                          style={{
                            fontFamily: theme.fonts.mono,
                            fontSize: 11,
                            color: ESTADO_COLOR[e.estado],
                            border: `1px solid ${ESTADO_COLOR[e.estado]}`,
                            padding: '2px 8px',
                          }}
                        >
                          {e.estado}
                        </span>
                      </td>
                      <td style={sharedStyles.td}>
                        {e.estado === 'EN_CURSO' && (
                          <button
                            onClick={() => {
                              setExploracionActiva(e)
                              setModal('completar')
                            }}
                            style={{ ...sharedStyles.actionBtn, padding: '4px 12px', fontSize: 11 }}
                          >
                            COMPLETAR
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            // ── Tab solicitudes ──
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {(isMobile
                    ? ['DESTINO', 'TIPO', 'ESTADO']
                    : ['DESTINO', 'TIPO', 'DETALLE', 'ESTADO', 'FECHA']
                  ).map((h) => (
                    <th key={h} style={sharedStyles.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {solicitudes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={isMobile ? 3 : 5}
                      style={{
                        ...sharedStyles.td,
                        textAlign: 'center',
                        color: '#334155',
                        fontFamily: theme.fonts.mono,
                        fontSize: 14,
                        padding: 32,
                      }}
                    >
                      No hay solicitudes enviadas
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((s) => (
                    <tr key={s.id}>
                      <td style={sharedStyles.td}>{s.campamento_destino}</td>
                      <td style={sharedStyles.td}>{s.tipo_solicitud}</td>
                      {!isMobile && (
                        <td style={sharedStyles.td}>{s.detalle?.descripcion ?? '—'}</td>
                      )}
                      <td style={sharedStyles.td}>
                        <span
                          style={{
                            fontFamily: theme.fonts.mono,
                            fontSize: 11,
                            color:
                              s.estado === 'PENDIENTE'
                                ? '#facc15'
                                : s.estado === 'APROBADA'
                                  ? '#4ade80'
                                  : '#f87171',
                            border: `1px solid ${s.estado === 'PENDIENTE' ? '#facc15' : s.estado === 'APROBADA' ? '#4ade80' : '#f87171'}`,
                            padding: '2px 8px',
                          }}
                        >
                          {s.estado}
                        </span>
                      </td>
                      {!isMobile && (
                        <td
                          style={{ ...sharedStyles.td, fontFamily: theme.fonts.mono, fontSize: 12 }}
                        >
                          {new Date(s.fecha_solicitud).toLocaleDateString()}
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {modal === 'crear' && (
        <ModalCrearExploracion
          personas={personas}
          onClose={() => setModal(null)}
          onSuccess={cargar}
        />
      )}
      {modal === 'completar' && exploracionActiva && (
        <ModalCompletarExploracion
          exploracion={exploracionActiva}
          itemsBodega={itemsBodega}
          onClose={() => {
            setModal(null)
            setExploracionActiva(null)
          }}
          onSuccess={cargar}
        />
      )}
      {modal === 'solicitud' && (
        <ModalSolicitud
          campamentos={campamentos}
          campamentoActual={campamentoActual}
          onClose={() => setModal(null)}
          onSuccess={cargar}
        />
      )}
    </div>
  )
}
