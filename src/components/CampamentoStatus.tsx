import { useIsMobile } from '../hooks/useIsMobile'

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface Metricas {
  personas: { total: number; por_estado: Record<string, number> }
  recursos: { nombre: string; cantidad_actual: number; cantidad_minima_alerta: number }[]
  alertas_activas: number
  exploraciones: Record<string, number>
  solicitudes_pendientes: number
}

interface Props {
  metricas: Metricas | null
}

// ─── LÓGICA DE NIVEL ─────────────────────────────────────────────────────────
interface Nivel {
  nivel: number
  nombre: string
  color: string
  icono: string
  descripcion: string
  xpActual: number
  xpMax: number
}

function calcularNivel(m: Metricas): Nivel {
  const sanos = m.personas.por_estado['SANO'] ?? 0
  const total = m.personas.total
  const recursos = m.recursos.length
  const sinAlertas = m.alertas_activas === 0
  const exploraciones = m.exploraciones['COMPLETADA'] ?? 0

  // XP basado en métricas reales
  let xp = 0
  xp += sanos * 10
  xp += recursos * 5
  xp += exploraciones * 20
  if (sinAlertas && recursos > 0) xp += 30
  if (total >= 10) xp += 20
  if (total >= 20) xp += 30

  const niveles = [
    {
      nivel: 1,
      nombre: 'REFUGIO',
      color: '#94a3b8',
      icono: '⛺',
      descripcion: 'Apenas sobreviviendo',
      xpMax: 100,
    },
    {
      nivel: 2,
      nombre: 'ASENTAMIENTO',
      color: '#60a5fa',
      icono: '🏕️',
      descripcion: 'Organización básica',
      xpMax: 250,
    },
    {
      nivel: 3,
      nombre: 'FORTALEZA',
      color: '#facc15',
      icono: '🏰',
      descripcion: 'Base consolidada',
      xpMax: 500,
    },
    {
      nivel: 4,
      nombre: 'BASTIÓN',
      color: '#10b981',
      icono: '🛡️',
      descripcion: 'Resistencia total',
      xpMax: 999,
    },
  ]

  let nivelActual = niveles[0]
  for (const n of niveles) {
    if (xp >= (n.nivel === 1 ? 0 : niveles[n.nivel - 2].xpMax)) {
      nivelActual = n
    }
  }

  return { ...nivelActual, xpActual: xp }
}

// ─── LOGROS ──────────────────────────────────────────────────────────────────
interface Logro {
  id: string
  icono: string
  nombre: string
  descripcion: string
  desbloqueado: boolean
  color: string
}

function calcularLogros(m: Metricas): Logro[] {
  const sanos = m.personas.por_estado['SANO'] ?? 0
  const total = m.personas.total
  const sinAlertas = m.alertas_activas === 0
  const explorComp = m.exploraciones['COMPLETADA'] ?? 0
  const recursos = m.recursos.length
  const todosSobMin = m.recursos.every((r) => r.cantidad_actual >= r.cantidad_minima_alerta)

  return [
    {
      id: 'primer_superviviente',
      icono: '👤',
      nombre: 'Primer superviviente',
      descripcion: 'Registrar la primera persona',
      desbloqueado: total >= 1,
      color: '#4ade80',
    },
    {
      id: 'equipo',
      icono: '👥',
      nombre: 'Equipo formado',
      descripcion: '10 supervivientes en base',
      desbloqueado: total >= 10,
      color: '#60a5fa',
    },
    {
      id: 'bodega_segura',
      icono: '📦',
      nombre: 'Bodega segura',
      descripcion: 'Todos los recursos sobre el mínimo',
      desbloqueado: todosSobMin && recursos > 0,
      color: '#facc15',
    },
    {
      id: 'sin_alertas',
      icono: '✅',
      nombre: 'Sin alertas',
      descripcion: 'Ningún recurso en estado crítico',
      desbloqueado: sinAlertas && recursos > 0,
      color: '#10b981',
    },
    {
      id: 'exploradores',
      icono: '🗺️',
      nombre: 'Exploradores',
      descripcion: 'Primera exploración completada',
      desbloqueado: explorComp >= 1,
      color: '#a78bfa',
    },
    {
      id: 'veteranos',
      icono: '⚔️',
      nombre: 'Veteranos',
      descripcion: '5 exploraciones completadas',
      desbloqueado: explorComp >= 5,
      color: '#f87171',
    },
    {
      id: 'supervivencia',
      icono: '💚',
      nombre: 'Supervivencia',
      descripcion: '80% de personas sanas',
      desbloqueado: total > 0 && sanos / total >= 0.8,
      color: '#4ade80',
    },
    {
      id: 'fortaleza',
      icono: '🏰',
      nombre: 'Fortaleza',
      descripcion: '20 supervivientes en base',
      desbloqueado: total >= 20,
      color: '#fb923c',
    },
  ]
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
const mono = "'Share Tech Mono', monospace"

export default function CampamentoStatus({ metricas }: Props) {
  const isMobile = useIsMobile()

  if (!metricas) return null

  const nivel = calcularNivel(metricas)
  const logros = calcularLogros(metricas)
  const pct = Math.min(100, Math.round((nivel.xpActual / nivel.xpMax) * 100))
  const sanos = metricas.personas.por_estado['SANO'] ?? 0
  const total = metricas.personas.total
  const saludPct = total > 0 ? Math.round((sanos / total) * 100) : 0

  const saludColor = saludPct >= 80 ? '#4ade80' : saludPct >= 50 ? '#facc15' : '#f87171'

  return (
    <div style={{ marginBottom: 24 }}>
      {/* ── Encabezado de sección ── */}
      <div
        style={{
          fontFamily: mono,
          fontSize: 10,
          color: '#475569',
          letterSpacing: 3,
          textTransform: 'uppercase',
          marginBottom: 12,
        }}
      >
        ▮ estado del campamento
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
          gap: 12,
          marginBottom: 12,
        }}
      >
        {/* ── Tarjeta de nivel ── */}
        <div
          style={{
            background: 'rgba(15,23,42,0.8)',
            border: `1px solid ${nivel.color}`,
            padding: '16px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Fondo decorativo */}
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              fontSize: 80,
              opacity: 0.06,
              pointerEvents: 'none',
              lineHeight: 1,
            }}
          >
            {nivel.icono}
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
            <div
              style={{
                fontSize: 36,
                lineHeight: 1,
                filter: 'drop-shadow(0 0 8px ' + nivel.color + ')',
                animation: 'pulse 3s ease-in-out infinite',
              }}
            >
              {nivel.icono}
            </div>
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  color: '#475569',
                  letterSpacing: 2,
                  marginBottom: 2,
                }}
              >
                NIVEL {nivel.nivel}
              </div>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 20,
                  fontWeight: 700,
                  color: nivel.color,
                  letterSpacing: 2,
                }}
              >
                {nivel.nombre}
              </div>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  color: '#475569',
                  marginTop: 2,
                }}
              >
                {nivel.descripcion}
              </div>

              {/* Barra XP */}
              <div style={{ marginTop: 10 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: mono,
                    fontSize: 10,
                    color: '#475569',
                    marginBottom: 4,
                  }}
                >
                  <span>XP: {nivel.xpActual}</span>
                  <span>{pct}%</span>
                </div>
                <div
                  style={{
                    height: 6,
                    background: 'rgba(30,41,59,0.8)',
                    border: `1px solid rgba(30,41,59,0.8)`,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${pct}%`,
                      background: nivel.color,
                      transition: 'width 1s ease',
                      boxShadow: `0 0 8px ${nivel.color}`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Salud del campamento ── */}
        <div
          style={{
            background: 'rgba(15,23,42,0.8)',
            border: `1px solid rgba(30,41,59,0.8)`,
            padding: '16px 20px',
          }}
        >
          <div
            style={{
              fontFamily: mono,
              fontSize: 10,
              color: '#475569',
              letterSpacing: 2,
              marginBottom: 12,
            }}
          >
            SALUD DEL CAMPAMENTO
          </div>

          {/* Círculo de salud */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{ position: 'relative', width: 80, height: 80, flexShrink: 0 }}>
              <svg
                viewBox="0 0 80 80"
                style={{ transform: 'rotate(-90deg)', width: 80, height: 80 }}
              >
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke="rgba(30,41,59,0.8)"
                  strokeWidth="8"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  fill="none"
                  stroke={saludColor}
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 34}`}
                  strokeDashoffset={`${2 * Math.PI * 34 * (1 - saludPct / 100)}`}
                  strokeLinecap="round"
                  style={{
                    transition: 'stroke-dashoffset 1s ease',
                    filter: `drop-shadow(0 0 4px ${saludColor})`,
                  }}
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: mono,
                  fontSize: 16,
                  fontWeight: 700,
                  color: saludColor,
                }}
              >
                {saludPct}%
              </div>
            </div>

            <div style={{ flex: 1 }}>
              {[
                {
                  label: 'Sanos',
                  value: metricas.personas.por_estado['SANO'] ?? 0,
                  color: '#4ade80',
                },
                {
                  label: 'Heridos',
                  value: metricas.personas.por_estado['HERIDO'] ?? 0,
                  color: '#fb923c',
                },
                {
                  label: 'Enfermos',
                  value: metricas.personas.por_estado['ENFERMO'] ?? 0,
                  color: '#facc15',
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontFamily: mono,
                    fontSize: 11,
                    color: '#475569',
                    marginBottom: 4,
                  }}
                >
                  <span style={{ color: item.color }}>{item.label}</span>
                  <span style={{ color: '#e2e8f0' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Logros ── */}
      <div
        style={{
          background: 'rgba(15,23,42,0.8)',
          border: '1px solid rgba(30,41,59,0.8)',
          padding: '14px 16px',
        }}
      >
        <div
          style={{
            fontFamily: mono,
            fontSize: 10,
            color: '#475569',
            letterSpacing: 2,
            marginBottom: 12,
          }}
        >
          LOGROS — {logros.filter((l) => l.desbloqueado).length}/{logros.length} DESBLOQUEADOS
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: 8,
          }}
        >
          {logros.map((logro) => (
            <div
              key={logro.id}
              style={{
                border: `1px solid ${logro.desbloqueado ? logro.color : 'rgba(30,41,59,0.8)'}`,
                background: logro.desbloqueado
                  ? `rgba(${logro.color === '#4ade80' ? '74,222,128' : logro.color === '#60a5fa' ? '96,165,250' : logro.color === '#facc15' ? '250,204,21' : logro.color === '#10b981' ? '16,185,129' : logro.color === '#a78bfa' ? '167,139,250' : logro.color === '#f87171' ? '248,113,113' : logro.color === '#fb923c' ? '251,146,60' : '74,222,128'},0.08)`
                  : 'rgba(15,23,42,0.3)',
                padding: '10px 12px',
                opacity: logro.desbloqueado ? 1 : 0.4,
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column' as const,
                gap: 4,
              }}
            >
              <div style={{ fontSize: 20, lineHeight: 1 }}>{logro.icono}</div>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  fontWeight: 700,
                  color: logro.desbloqueado ? logro.color : '#475569',
                  lineHeight: 1.3,
                }}
              >
                {logro.nombre}
              </div>
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 9,
                  color: '#475569',
                  lineHeight: 1.3,
                }}
              >
                {logro.descripcion}
              </div>
              {logro.desbloqueado && (
                <div
                  style={{
                    fontFamily: mono,
                    fontSize: 9,
                    color: logro.color,
                    marginTop: 2,
                  }}
                >
                  ✓ DESBLOQUEADO
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
