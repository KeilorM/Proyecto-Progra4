import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import { sharedStyles, theme } from '../styles/theme'
import { useInactivityTimer } from '../hooks/useInactivityTimer'
import { useIsMobile } from '../hooks/useIsMobile'
import {
  getPersonas,
  updateEstadoPersona,
  getSolicitudesRecibidas,
  responderSolicitud,
  getTraslados,
  aprobarSalidaTraslado,
  aprobarLlegadaTraslado,
} from '../services/api'

import ModalAgregarPersonaIA from '../components/AIAnalisisIngreso'
import MetricasDashboard from '../components/MetricasDashboard'

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface Solicitud {
  id: number
  tipo_solicitud: 'RECURSOS' | 'PERSONAS'
  detalle: { descripcion?: string }
  estado: 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'COMPLETADA'
  fecha_solicitud: string
  campamento_origen: string
  nota_respuesta?: string
}

type Tab = 'supervivientes' | 'solicitudes' | 'traslados'

interface Persona {
  id: number
  nombre: string
  apellidos: string
  fecha_nacimiento: string
  habilidades_combate: number
  nivel_confianza: number
  estado_salud: 'SANO' | 'HERIDO' | 'ENFERMO' | 'MUERTO'
  esta_en_campamento: boolean
  cargo: string
  es_temporal: boolean
}

const ESTADOS = ['SANO', 'HERIDO', 'ENFERMO', 'MUERTO'] as const

const ESTADO_COLOR: Record<string, string> = {
  SANO: '#4ade80',
  HERIDO: '#fb923c',
  ENFERMO: '#facc15',
  MUERTO: '#94a3b8',
}

const ESTADO_LABEL: Record<string, string> = {
  SANO: 'Sano',
  HERIDO: 'Herido',
  ENFERMO: 'Enfermo',
  MUERTO: 'Muerto',
}

interface Traslado {
  id: number
  estado: string
  campamento_origen: string
  campamento_destino: string
  campamento_origen_id: number
  campamento_destino_id: number
  fecha_salida_programada: string
  raciones_viaje: number
}

type TabTraslado = 'supervivientes' | 'solicitudes' | 'traslados'

// ─── TARJETA MÓVIL DE PERSONA ─────────────────────────────────────────────────
function PersonaCard({
  p,
  onEstado,
}: {
  p: Persona
  onEstado: (id: number, estado: string) => void
}) {
  return (
    <div
      style={{
        padding: '14px 16px',
        borderBottom: `1px solid rgba(30,41,59,0.8)`,
        background: 'rgba(15,23,42,0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14 }}>
            {p.nombre} {p.apellidos}
            {p.es_temporal && (
              <span
                style={{
                  fontSize: 10,
                  color: '#fb923c',
                  marginLeft: 6,
                  fontFamily: theme.fonts.mono,
                }}
              >
                TEMP
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 11,
              color: theme.colors.textDim,
              marginTop: 2,
            }}
          >
            {p.cargo ?? 'Sin cargo'} · #{p.id}
          </div>
        </div>
        <span
          style={{
            fontSize: 11,
            fontFamily: theme.fonts.mono,
            color: p.esta_en_campamento ? '#4ade80' : '#94a3b8',
          }}
        >
          {p.esta_en_campamento ? 'EN BASE' : 'FUERA'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 9,
              color: theme.colors.textDim,
              marginBottom: 3,
            }}
          >
            COMBATE
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 6,
                  background: i < Number(p.habilidades_combate) ? '#f87171' : 'rgba(51,65,85,0.4)',
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: theme.fonts.mono,
              fontSize: 9,
              color: theme.colors.textDim,
              marginBottom: 3,
            }}
          >
            CONFIANZA
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 6,
                  background: i < Number(p.nivel_confianza) ? '#10b981' : 'rgba(51,65,85,0.4)',
                }}
              />
            ))}
          </div>
        </div>
        <select
          style={{ ...sharedStyles.select, color: ESTADO_COLOR[p.estado_salud], fontSize: 11 }}
          value={p.estado_salud}
          onChange={(e) => onEstado(p.id, e.target.value)}
        >
          {ESTADOS.map((s) => (
            <option key={s} value={s}>
              {ESTADO_LABEL[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// ─── DASHBOARD ───────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  useInactivityTimer()
  const isMobile = useIsMobile()
  const [personas, setPersonas] = useState<Persona[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModal] = useState(false)
  const [tab, setTab] = useState<Tab>('supervivientes')
  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([])
  const [traslados, setTraslados] = useState<Traslado[]>([])

  const cargar = async () => {
    try {
      setLoading(true)
      setError('')
      const [data, sols, trals] = await Promise.all([
        getPersonas(),
        getSolicitudesRecibidas(),
        getTraslados(),
      ])
      setPersonas(data)
      setSolicitudes(sols)
      setTraslados(trals)
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

  const handleEstado = async (id: number, estado_salud: string) => {
    try {
      await updateEstadoPersona(id, estado_salud)
      await cargar()
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    }
  }

  const handleResponder = async (id: number, estado: 'APROBADA' | 'RECHAZADA') => {
    try {
      await responderSolicitud(id, estado)
      await cargar()
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message)
    }
  }

  const handleSalida = async (id: number) => {
  try {
    await aprobarSalidaTraslado(id)
    await cargar()
  } catch (err: unknown) {
    if (err instanceof Error) setError(err.message)
  }
}

const handleLlegada = async (id: number) => {
  try {
    await aprobarLlegadaTraslado(id)
    await cargar()
  } catch (err: unknown) {
    if (err instanceof Error) setError(err.message)
  }
}

return (
    <div style={sharedStyles.root}>
      <PageHeader titulo="COMANDO CENTRAL" subtitulo="Gestión de Supervivientes" />

      <main style={{ ...sharedStyles.main, padding: isMobile ? '16px 12px' : '24px 32px' }}>
        {/* Dashboard métricas + gamificación */}
        <MetricasDashboard />

        {/* Stats */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(5, 1fr)',
            gap: 10,
            marginBottom: 24,
          }}
        >
          {ESTADOS.map((e) => {
            const count = personas.filter((p) => p.estado_salud === e).length
            return (
              <div
                key={e}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 16px',
                  border: `1px solid ${ESTADO_COLOR[e]}`,
                  background: 'rgba(15,23,42,0.8)',
                }}
              >
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: ESTADO_COLOR[e],
                    flexShrink: 0,
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: isMobile ? 22 : 28,
                      fontWeight: 700,
                      color: ESTADO_COLOR[e],
                      lineHeight: 1,
                    }}
                  >
                    {count}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: theme.colors.textDim,
                      letterSpacing: 1,
                      marginTop: 2,
                    }}
                  >
                    {ESTADO_LABEL[e]}
                  </div>
                </div>
              </div>
            )
          })}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '12px 16px',
              border: `1px solid ${theme.colors.red}`,
              background: 'rgba(15,23,42,0.8)',
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: theme.colors.red,
                flexShrink: 0,
                animation: 'pulse 2s ease-in-out infinite',
              }}
            />
            <div>
              <div
                style={{
                  fontSize: isMobile ? 22 : 28,
                  fontWeight: 700,
                  color: theme.colors.red,
                  lineHeight: 1,
                }}
              >
                {personas.length}
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: theme.colors.textDim,
                  letterSpacing: 1,
                  marginTop: 2,
                }}
              >
                Total
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
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

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: `1px solid ${theme.colors.border}`,
            marginBottom: 0,
            flexWrap: 'wrap',
            gap: isMobile ? 0 : undefined,
          }}
        >
          {(['supervivientes', 'solicitudes', 'traslados'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                fontFamily: theme.fonts.mono,
                fontSize: isMobile ? 10 : 12,
                letterSpacing: isMobile ? 1 : 2,
                padding: isMobile ? '8px 14px' : '10px 24px',
                background: tab === t ? 'rgba(16,185,129,0.1)' : 'transparent',
                color: tab === t ? theme.colors.green : theme.colors.textDim,
                border: 'none',
                borderBottom:
                  tab === t ? `2px solid ${theme.colors.green}` : '2px solid transparent',
                cursor: 'pointer',
                textTransform: 'uppercase' as const,
              }}
            >
              {t === 'solicitudes' &&
                solicitudes.filter((s) => s.estado === 'PENDIENTE').length > 0 && (
                  <span
                    style={{
                      marginRight: 6,
                      background: '#f87171',
                      color: '#fff',
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 8,
                    }}
                  >
                    {solicitudes.filter((s) => s.estado === 'PENDIENTE').length}
                  </span>
                )}
              {t}
            </button>
          ))}
          {tab === 'supervivientes' && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <button
                style={{
                  ...sharedStyles.actionBtn,
                  fontSize: isMobile ? 10 : 12,
                  padding: isMobile ? '6px 12px' : '8px 20px',
                }}
                onClick={() => setModal(true)}
              >
                {isMobile ? '+ AÑADIR' : '+ INCORPORAR'}
              </button>
            </div>
          )}
        </div>

        {/* Contenido */}
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
              Escaneando base de datos...
            </div>
          ) : tab === 'supervivientes' ? (
            personas.length === 0 ? (
              <div
                style={{
                  padding: 32,
                  textAlign: 'center',
                  color: '#334155',
                  fontFamily: theme.fonts.mono,
                  fontSize: 14,
                }}
              >
                No hay supervivientes registrados
              </div>
            ) : isMobile ? (
              <div>
                {personas.map((p) => (
                  <PersonaCard key={p.id} p={p} onEstado={handleEstado} />
                ))}
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    {['ID', 'NOMBRE', 'CARGO', 'COMBATE', 'CONFIANZA', 'ESTADO', 'UBICACIÓN'].map(
                      (h) => (
                        <th key={h} style={sharedStyles.th}>
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {personas.map((p, i) => (
                    <tr key={p.id} style={{ animationDelay: `${i * 0.04}s` }}>
                      <td style={sharedStyles.td}>
                        <span
                          style={{
                            fontFamily: theme.fonts.mono,
                            fontSize: 12,
                            color: '#334155',
                            background: 'rgba(51,65,85,0.3)',
                            padding: '2px 8px',
                          }}
                        >
                          #{p.id}
                        </span>
                      </td>
                      <td style={{ ...sharedStyles.td, color: '#e2e8f0', fontWeight: 600 }}>
                        {p.nombre} {p.apellidos}
                        {p.es_temporal && (
                          <span
                            style={{
                              fontSize: 10,
                              color: '#fb923c',
                              marginLeft: 6,
                              fontFamily: theme.fonts.mono,
                            }}
                          >
                            TEMP
                          </span>
                        )}
                      </td>
                      <td style={{ ...sharedStyles.td, fontFamily: theme.fonts.mono, fontSize: 12 }}>
                        {p.cargo ?? '—'}
                      </td>
                      <td style={sharedStyles.td}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              style={{
                                width: 6,
                                height: 12,
                                background:
                                  i < Number(p.habilidades_combate)
                                    ? '#f87171'
                                    : 'rgba(51,65,85,0.4)',
                              }}
                            />
                          ))}
                        </div>
                      </td>
                      <td style={sharedStyles.td}>
                        <div style={{ display: 'flex', gap: 2 }}>
                          {Array.from({ length: 10 }).map((_, i) => (
                            <div
                              key={i}
                              style={{
                                width: 6,
                                height: 12,
                                background:
                                  i < Number(p.nivel_confianza) ? '#10b981' : 'rgba(51,65,85,0.4)',
                              }}
                            />
                          ))}
                        </div>
                      </td>
                      <td style={sharedStyles.td}>
                        <select
                          style={{ ...sharedStyles.select, color: ESTADO_COLOR[p.estado_salud] }}
                          value={p.estado_salud}
                          onChange={(e) => handleEstado(p.id, e.target.value)}
                        >
                          {ESTADOS.map((s) => (
                            <option key={s} value={s}>
                              {ESTADO_LABEL[s]}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td style={sharedStyles.td}>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: theme.fonts.mono,
                            color: p.esta_en_campamento ? '#4ade80' : '#94a3b8',
                          }}
                        >
                          {p.esta_en_campamento ? 'EN BASE' : 'FUERA'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : tab === 'solicitudes' ? (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {(isMobile
                    ? ['ORIGEN', 'TIPO', 'ESTADO', 'ACCIÓN']
                    : ['ORIGEN', 'TIPO', 'DETALLE', 'ESTADO', 'FECHA', 'ACCIÓN']
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
                      colSpan={isMobile ? 4 : 6}
                      style={{
                        ...sharedStyles.td,
                        textAlign: 'center',
                        color: '#334155',
                        fontFamily: theme.fonts.mono,
                        fontSize: 14,
                        padding: 32,
                      }}
                    >
                      No hay solicitudes recibidas
                    </td>
                  </tr>
                ) : (
                  solicitudes.map((s) => (
                    <tr key={s.id}>
                      <td style={sharedStyles.td}>{s.campamento_origen}</td>
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
                        <td style={{ ...sharedStyles.td, fontFamily: theme.fonts.mono, fontSize: 12 }}>
                          {new Date(s.fecha_solicitud).toLocaleDateString()}
                        </td>
                      )}
                      <td style={sharedStyles.td}>
                        {s.estado === 'PENDIENTE' && (
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => handleResponder(s.id, 'APROBADA')}
                              style={{
                                ...sharedStyles.actionBtn,
                                padding: '4px 10px',
                                fontSize: 10,
                                background: 'rgba(16,185,129,0.15)',
                              }}
                            >
                              ✓ {isMobile ? 'OK' : 'APROBAR'}
                            </button>
                            <button
                              onClick={() => handleResponder(s.id, 'RECHAZADA')}
                              style={{
                                ...sharedStyles.actionBtn,
                                padding: '4px 10px',
                                fontSize: 10,
                                background: 'rgba(239,68,68,0.15)',
                                borderColor: '#f87171',
                                color: '#f87171',
                              }}
                            >
                              ✕ {isMobile ? 'NO' : 'RECHAZAR'}
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : (
            // Tab traslados
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['ID', 'ORIGEN', 'DESTINO', 'ESTADO', 'FECHA', 'RACIONES', 'ACCIÓN'].map((h) => (
                    <th key={h} style={sharedStyles.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {traslados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        ...sharedStyles.td,
                        textAlign: 'center',
                        color: '#334155',
                        fontFamily: theme.fonts.mono,
                        fontSize: 14,
                        padding: 32,
                      }}
                    >
                      No hay traslados registrados
                    </td>
                  </tr>
                ) : (
                  traslados.map((t) => (
                    <tr key={t.id}>
                      <td style={sharedStyles.td}>
                        <span
                          style={{
                            fontFamily: theme.fonts.mono,
                            fontSize: 12,
                            color: '#334155',
                            background: 'rgba(51,65,85,0.3)',
                            padding: '2px 8px',
                          }}
                        >
                          #{t.id}
                        </span>
                      </td>
                      <td style={sharedStyles.td}>{t.campamento_origen}</td>
                      <td style={sharedStyles.td}>{t.campamento_destino}</td>
                      <td style={sharedStyles.td}>
                        <span
                          style={{
                            fontFamily: theme.fonts.mono,
                            fontSize: 11,
                            color:
                              t.estado === 'COMPLETADO'
                                ? '#4ade80'
                                : t.estado === 'EN_TRANSITO'
                                  ? '#facc15'
                                  : '#60a5fa',
                            border: `1px solid ${t.estado === 'COMPLETADO' ? '#4ade80' : t.estado === 'EN_TRANSITO' ? '#facc15' : '#60a5fa'}`,
                            padding: '2px 8px',
                          }}
                        >
                          {t.estado}
                        </span>
                      </td>
                      <td style={{ ...sharedStyles.td, fontFamily: theme.fonts.mono, fontSize: 12 }}>
                        {new Date(t.fecha_salida_programada).toLocaleDateString()}
                      </td>
                      <td style={sharedStyles.td}>{t.raciones_viaje}</td>
                      <td style={sharedStyles.td}>
                       <div style={{ display: 'flex', gap: 6 }}>
                        {t.estado === 'PENDIENTE_SALIDA' && t.campamento_origen_id === Number(localStorage.getItem('campamento')) && (
                          <button
                            onClick={() => handleSalida(t.id)}
                            style={{
                              ...sharedStyles.actionBtn,
                              padding: '4px 10px',
                              fontSize: 11,
                              background: 'rgba(16,185,129,0.15)',
                            }}
                          >
                            ✓ APROBAR SALIDA
                          </button>
                        )}
                        {t.estado === 'PENDIENTE_SALIDA' && t.campamento_origen_id !== Number(localStorage.getItem('campamento')) && (
                          <span style={{ fontFamily: theme.fonts.mono, fontSize: 11, color: '#94a3b8' }}>
                            ⏳ ESPERANDO SALIDA
                          </span>
                        )}
                        {t.estado === 'EN_TRANSITO' && t.campamento_destino_id === Number(localStorage.getItem('campamento')) && (
                          <button
                            onClick={() => handleLlegada(t.id)}
                            style={{
                              ...sharedStyles.actionBtn,
                              padding: '4px 10px',
                              fontSize: 11,
                              background: 'rgba(250,204,21,0.15)',
                              borderColor: '#facc15',
                              color: '#facc15',
                            }}
                          >
                            ✓ APROBAR LLEGADA
                          </button>
                        )}
                        {t.estado === 'EN_TRANSITO' && t.campamento_destino_id !== Number(localStorage.getItem('campamento')) && (
                          <span style={{ fontFamily: theme.fonts.mono, fontSize: 11, color: '#94a3b8' }}>
                            ⏳ EN TRÁNSITO
                          </span>
                        )}
                        {t.estado === 'COMPLETADO' && (
                          <span style={{ fontFamily: theme.fonts.mono, fontSize: 11, color: '#4ade80' }}>
                            ✓ COMPLETADO
                          </span>
                        )}
                      </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {modalOpen && <ModalAgregarPersonaIA onClose={() => setModal(false)} onSuccess={cargar} />}
    </div>
  )
}