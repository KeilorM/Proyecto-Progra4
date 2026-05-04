import { useEffect, useRef, useState } from "react";
import { getDashboardMetricas } from "../services/api";

// Chart.js se carga via CDN en index.html — declaramos el tipo global
declare const Chart: any;

interface Metricas {
  personas: { total: number; por_estado: Record<string, number> };
  recursos: { nombre: string; cantidad_actual: number; cantidad_minima_alerta: number; unidad: string }[];
  alertas_activas: number;
  exploraciones: Record<string, number>;
  solicitudes_pendientes: number;
  movimientos_semana: { dia: string; entradas: number; salidas: number }[];
}

const mono = "'JetBrains Mono','Courier New',monospace";
const dim  = "#475569";
const border = "rgba(30,41,59,0.8)";

const ESTADO_COLOR: Record<string, string> = {
  SANO: "#4ade80", HERIDO: "#fb923c", ENFERMO: "#facc15", MUERTO: "#94a3b8",
};

function MetricCard({ label, value, sub, color }: {
  label: string; value: number | string; sub: string; color: string
}) {
  return (
    <div style={{
      background: "rgba(15,23,42,0.8)",
      border: `1px solid ${border}`,
      padding: "14px 18px",
      display: "flex", flexDirection: "column", gap: 4,
    }}>
      <div style={{ fontFamily: mono, fontSize: 10, color: dim, letterSpacing: 2, textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontFamily: mono, fontSize: 32, fontWeight: 700, color, lineHeight: 1 }}>
        {value}
      </div>
      <div style={{ fontFamily: mono, fontSize: 11, color: dim }}>{sub}</div>
    </div>
  );
}

function BarChart({ label, value, max, color }: {
  label: string; value: number; max: number; color: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontFamily: mono, fontSize: 11, color: dim, width: 72, whiteSpace: "nowrap",
        overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 10, background: "rgba(30,41,59,0.6)",
        border: `1px solid ${border}`, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontFamily: mono, fontSize: 11, color: "#e2e8f0", width: 32, textAlign: "right" }}>
        {value}
      </span>
    </div>
  );
}

export default function MetricasDashboard() {
  const [data, setData]     = useState<Metricas | null>(null);
  const [error, setError]   = useState("");
  const chartRef            = useRef<any>(null);
  const canvasRef           = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    getDashboardMetricas()
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, []);

  // Renderizar chart de movimientos
  useEffect(() => {
    if (!data || !canvasRef.current || typeof Chart === "undefined") return;
    if (chartRef.current) chartRef.current.destroy();

    const labels = data.movimientos_semana.map(m =>
      new Date(m.dia).toLocaleDateString("es-CR", { weekday: "short" })
    );

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Entradas",
            data: data.movimientos_semana.map(m => m.entradas),
            borderColor: "#4ade80",
            backgroundColor: "rgba(74,222,128,0.06)",
            tension: 0.4, fill: true, pointRadius: 3,
          },
          {
            label: "Salidas",
            data: data.movimientos_semana.map(m => m.salidas),
            borderColor: "#f87171",
            backgroundColor: "rgba(248,113,113,0.06)",
            tension: 0.4, fill: true, pointRadius: 3,
            borderDash: [4, 3],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: "#475569", font: { size: 11, family: mono } },
            grid: { color: "rgba(30,41,59,0.5)" },
          },
          y: {
            ticks: { color: "#475569", font: { size: 11, family: mono } },
            grid: { color: "rgba(30,41,59,0.5)" },
          },
        },
      },
    });

    return () => chartRef.current?.destroy();
  }, [data]);

  if (error) return (
    <div style={{ padding: 16, fontFamily: mono, fontSize: 12, color: "#f87171",
      border: "1px solid #f87171", background: "rgba(239,68,68,0.06)" }}>
      ⚠ {error}
    </div>
  );

  if (!data) return (
    <div style={{ padding: 32, fontFamily: mono, fontSize: 13, color: dim,
      display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ display: "inline-block", width: 8, height: 8, background: "#10b981",
        borderRadius: "50%", animation: "blink 1s step-end infinite" }} />
      Cargando métricas...
    </div>
  );

  const totalPersonas = data.personas.total;
  const maxPersonas   = Math.max(...Object.values(data.personas.por_estado), 1);

  // Calcular % de recursos respecto al mínimo*2 como referencia de "lleno"
  const maxRecurso = (r: typeof data.recursos[0]) =>
    Math.max(r.cantidad_actual, r.cantidad_minima_alerta * 2, 1);

  const colorRecurso = (r: typeof data.recursos[0]) => {
    const pct = r.cantidad_actual / Math.max(r.cantidad_minima_alerta, 1);
    return pct <= 1 ? "#f87171" : pct <= 1.5 ? "#facc15" : "#4ade80";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 24 }}>
      {/* ── Tarjetas métricas ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
        <MetricCard label="Supervivientes" value={totalPersonas} sub="en base" color="#4ade80" />
        <MetricCard
          label="Alertas activas"
          value={data.alertas_activas}
          sub="recursos bajos"
          color={data.alertas_activas > 0 ? "#f87171" : "#4ade80"}
        />
        <MetricCard
          label="Exploraciones"
          value={data.exploraciones["EN_CURSO"] ?? 0}
          sub="en curso"
          color="#38bdf8"
        />
        <MetricCard
          label="Solicitudes"
          value={data.solicitudes_pendientes}
          sub="pendientes"
          color={data.solicitudes_pendientes > 0 ? "#facc15" : "#4ade80"}
        />
      </div>

      {/* ── Barras: personas + recursos ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {/* Personas por estado */}
        <div style={{ background: "rgba(15,23,42,0.8)", border: `1px solid ${border}`, padding: 16 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: dim, letterSpacing: 2,
            textTransform: "uppercase", marginBottom: 12 }}>
            Estado de personas
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(["SANO", "HERIDO", "ENFERMO", "MUERTO"] as const).map(e => (
              <BarChart
                key={e}
                label={e.charAt(0) + e.slice(1).toLowerCase()}
                value={data.personas.por_estado[e] ?? 0}
                max={maxPersonas}
                color={ESTADO_COLOR[e]}
              />
            ))}
          </div>
        </div>

        {/* Recursos */}
        <div style={{ background: "rgba(15,23,42,0.8)", border: `1px solid ${border}`, padding: 16 }}>
          <div style={{ fontFamily: mono, fontSize: 10, color: dim, letterSpacing: 2,
            textTransform: "uppercase", marginBottom: 12 }}>
            Bodega — nivel actual
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.recursos.slice(0, 6).map(r => (
              <BarChart
                key={r.nombre}
                label={r.nombre}
                value={Math.round(r.cantidad_actual)}
                max={Math.round(maxRecurso(r))}
                color={colorRecurso(r)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Gráfico de movimientos ── */}
      <div style={{ background: "rgba(15,23,42,0.8)", border: `1px solid ${border}`, padding: 16 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: dim, letterSpacing: 2,
          textTransform: "uppercase", marginBottom: 12 }}>
          Movimientos de bodega — últimos 7 días
        </div>
        {/* Leyenda manual */}
        <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
          {[{ label: "Entradas", color: "#4ade80" }, { label: "Salidas", color: "#f87171" }].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 6,
              fontFamily: mono, fontSize: 11, color: dim }}>
              <div style={{ width: 10, height: 10, background: l.color }} />
              {l.label}
            </div>
          ))}
        </div>
        <div style={{ position: "relative", height: 160 }}>
          <canvas ref={canvasRef} role="img"
            aria-label="Gráfico de líneas: entradas y salidas de bodega últimos 7 días">
            Movimientos de bodega de los últimos 7 días.
          </canvas>
        </div>
      </div>
    </div>
  );
}