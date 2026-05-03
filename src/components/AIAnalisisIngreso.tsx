import { useState } from "react";
import { addPersona } from "../services/api";

// ─── TIPOS ───────────────────────────────────────────────────────────────────
interface FormPersona {
  nombre: string;
  apellidos: string;
  fecha_nacimiento: string;
  habilidades_combate: number;
  nivel_confianza: number;
  estado_salud: string;
}

interface CriterioIA {
  criterio: string;
  valor: string;
  peso: "ALTO" | "MEDIO" | "BAJO";
  resultado: "POSITIVO" | "NEGATIVO" | "NEUTRAL";
  explicacion: string;
}

interface ReporteIA {
  decision: "ACEPTADO" | "RECHAZADO" | "REVISION";
  puntuacion: number;
  resumen: string;
  criterios: CriterioIA[];
  riesgo_zombie: "BAJO" | "MEDIO" | "ALTO";
  cargo_sugerido: string;
  advertencias: string[];
}

// ─── ESTILOS TEMÁTICOS ────────────────────────────────────────────────────────
const t = {
  green: "#10b981",
  red: "#ef4444",
  yellow: "#facc15",
  blue: "#38bdf8",
  dim: "#475569",
  border: "#1e293b",
  surface: "rgba(15,23,42,0.95)",
  mono: "'JetBrains Mono', 'Courier New', monospace",
  text: "#e2e8f0",
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.85)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 1000,
  backdropFilter: "blur(4px)",
};

const modal: React.CSSProperties = {
  background: "#0f172a",
  border: `1px solid ${t.border}`,
  width: "min(760px, 95vw)",
  maxHeight: "90vh",
  overflowY: "auto",
  position: "relative",
};

const label: React.CSSProperties = {
  fontFamily: t.mono,
  fontSize: 11,
  letterSpacing: 2,
  color: t.dim,
  textTransform: "uppercase",
};

const input: React.CSSProperties = {
  width: "100%",
  background: "rgba(30,41,59,0.8)",
  border: `1px solid ${t.border}`,
  color: t.text,
  fontFamily: t.mono,
  fontSize: 13,
  padding: "10px 12px",
  outline: "none",
  boxSizing: "border-box",
};

const btn = (color: string, bg = "transparent"): React.CSSProperties => ({
  fontFamily: t.mono,
  fontSize: 12,
  letterSpacing: 2,
  padding: "10px 20px",
  border: `1px solid ${color}`,
  background: bg,
  color,
  cursor: "pointer",
  textTransform: "uppercase",
  transition: "all 0.2s",
});

// ─── PASO 1: FORMULARIO ───────────────────────────────────────────────────────
function FormularioIngreso({
  form,
  setForm,
  onAnalizar,
  analizando,
}: {
  form: FormPersona;
  setForm: (f: FormPersona) => void;
  onAnalizar: () => void;
  analizando: boolean;
}) {
  const set = (field: keyof FormPersona, value: string | number) =>
    setForm({ ...form, [field]: value });

  return (
    <div
      style={{ padding: 28, display: "flex", flexDirection: "column", gap: 16 }}
    >
      {/* Aviso IA */}
      <div
        style={{
          border: `1px solid rgba(16,185,129,0.3)`,
          background: "rgba(16,185,129,0.05)",
          padding: "10px 14px",
          display: "flex",
          gap: 10,
          alignItems: "flex-start",
        }}
      >
        <span style={{ color: t.green, fontFamily: t.mono, fontSize: 11 }}>
          ◈ IA
        </span>
        <span
          style={{
            fontFamily: t.mono,
            fontSize: 11,
            color: "#94a3b8",
            lineHeight: 1.5,
          }}
        >
          Los datos serán analizados por inteligencia artificial antes de
          confirmar el ingreso. Se generará un reporte con criterios
          transparentes que usted podrá aceptar o corregir.
        </span>
      </div>

      {/* Nombre y apellidos */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={label}>Nombre</label>
          <input
            style={{ ...input, marginTop: 4 }}
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            required
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={label}>Apellidos</label>
          <input
            style={{ ...input, marginTop: 4 }}
            placeholder="Apellidos"
            value={form.apellidos}
            onChange={(e) => set("apellidos", e.target.value)}
            required
          />
        </div>
      </div>

      {/* Fecha nacimiento */}
      <div>
        <label style={label}>Fecha de Nacimiento</label>
        <input
          type="date"
          style={{ ...input, marginTop: 4 }}
          value={form.fecha_nacimiento}
          onChange={(e) => set("fecha_nacimiento", e.target.value)}
          required
        />
      </div>

      {/* Habilidades */}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <label style={label}>Hab. Combate (0-10)</label>
          <input
            type="number"
            min={0}
            max={10}
            style={{ ...input, marginTop: 4 }}
            value={form.habilidades_combate}
            onChange={(e) => set("habilidades_combate", Number(e.target.value))}
          />
          <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  background:
                    i < form.habilidades_combate
                      ? "#ef4444"
                      : "rgba(51,65,85,0.5)",
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={label}>Nivel Confianza (0-10)</label>
          <input
            type="number"
            min={0}
            max={10}
            style={{ ...input, marginTop: 4 }}
            value={form.nivel_confianza}
            onChange={(e) => set("nivel_confianza", Number(e.target.value))}
          />
          <div style={{ display: "flex", gap: 2, marginTop: 6 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 4,
                  background:
                    i < form.nivel_confianza ? t.green : "rgba(51,65,85,0.5)",
                }}
              />
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <label style={label}>Estado de Salud</label>
          <select
            style={{ ...input, marginTop: 4 }}
            value={form.estado_salud}
            onChange={(e) => set("estado_salud", e.target.value)}
          >
            {["SANO", "HERIDO", "ENFERMO"].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Botón analizar */}
      <button
        onClick={onAnalizar}
        disabled={
          analizando ||
          !form.nombre ||
          !form.apellidos ||
          !form.fecha_nacimiento
        }
        style={{
          ...btn(
            t.green,
            analizando ? "rgba(16,185,129,0.1)" : "rgba(16,185,129,0.15)",
          ),
          marginTop: 8,
          opacity:
            !form.nombre || !form.apellidos || !form.fecha_nacimiento ? 0.5 : 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {analizando ? (
          <>
            <span
              style={{
                display: "inline-block",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: t.green,
                animation: "blink 1s step-end infinite",
              }}
            />
            ANALIZANDO CON IA...
          </>
        ) : (
          "◈  ANALIZAR CON IA"
        )}
      </button>
    </div>
  );
}

// ─── PASO 2: REPORTE IA ───────────────────────────────────────────────────────
function ReporteAnalisis({
  reporte,
  form,
  onAceptar,
  onRechazar,
  onEditar,
  guardando,
}: {
  reporte: ReporteIA;
  form: FormPersona;
  onAceptar: () => void;
  onRechazar: () => void;
  onEditar: () => void;
  guardando: boolean;
}) {
  const decisionColor =
    reporte.decision === "ACEPTADO"
      ? t.green
      : reporte.decision === "RECHAZADO"
        ? t.red
        : t.yellow;

  const riesgoColor =
    reporte.riesgo_zombie === "BAJO"
      ? t.green
      : reporte.riesgo_zombie === "MEDIO"
        ? t.yellow
        : t.red;

  const pesoColor = (p: string) =>
    p === "ALTO" ? "#f87171" : p === "MEDIO" ? t.yellow : "#94a3b8";

  const resultadoIcon = (r: string) =>
    r === "POSITIVO" ? "▲" : r === "NEGATIVO" ? "▼" : "◆";

  const resultadoColor = (r: string) =>
    r === "POSITIVO" ? t.green : r === "NEGATIVO" ? t.red : t.dim;

  return (
    <div
      style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}
    >
      {/* Encabezado decisión */}
      <div
        style={{
          border: `2px solid ${decisionColor}`,
          padding: 20,
          background: `rgba(${
            reporte.decision === "ACEPTADO"
              ? "16,185,129"
              : reporte.decision === "RECHAZADO"
                ? "239,68,68"
                : "250,204,21"
          },0.06)`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 11,
              color: t.dim,
              letterSpacing: 2,
              marginBottom: 4,
            }}
          >
            DECISIÓN IA — {form.nombre} {form.apellidos}
          </div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 26,
              fontWeight: 700,
              color: decisionColor,
            }}
          >
            {reporte.decision}
          </div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 12,
              color: "#94a3b8",
              marginTop: 6,
              maxWidth: 380,
              lineHeight: 1.5,
            }}
          >
            {reporte.resumen}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 11,
              color: t.dim,
              letterSpacing: 2,
            }}
          >
            PUNTUACIÓN
          </div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 48,
              fontWeight: 700,
              color: decisionColor,
              lineHeight: 1,
            }}
          >
            {reporte.puntuacion}
          </div>
          <div style={{ fontFamily: t.mono, fontSize: 10, color: t.dim }}>
            /100
          </div>
        </div>
      </div>

      {/* Métricas rápidas */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}
      >
        <div
          style={{
            border: `1px solid ${t.border}`,
            padding: "10px 14px",
            background: "rgba(15,23,42,0.6)",
          }}
        >
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.dim,
              letterSpacing: 2,
            }}
          >
            RIESGO ZOMBIE
          </div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 16,
              color: riesgoColor,
              marginTop: 4,
              fontWeight: 700,
            }}
          >
            {reporte.riesgo_zombie}
          </div>
        </div>
        <div
          style={{
            border: `1px solid ${t.border}`,
            padding: "10px 14px",
            background: "rgba(15,23,42,0.6)",
          }}
        >
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.dim,
              letterSpacing: 2,
            }}
          >
            CARGO SUGERIDO
          </div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 13,
              color: t.blue,
              marginTop: 4,
              fontWeight: 700,
            }}
          >
            {reporte.cargo_sugerido}
          </div>
        </div>
        <div
          style={{
            border: `1px solid ${t.border}`,
            padding: "10px 14px",
            background: "rgba(15,23,42,0.6)",
          }}
        >
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 10,
              color: t.dim,
              letterSpacing: 2,
            }}
          >
            COMBATE / CONFIANZA
          </div>
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 16,
              color: t.text,
              marginTop: 4,
              fontWeight: 700,
            }}
          >
            {form.habilidades_combate} / {form.nivel_confianza}
          </div>
        </div>
      </div>

      {/* Criterios detallados */}
      <div>
        <div
          style={{
            fontFamily: t.mono,
            fontSize: 11,
            color: t.dim,
            letterSpacing: 2,
            marginBottom: 10,
          }}
        >
          CRITERIOS DE EVALUACIÓN
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {reporte.criterios.map((c, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${t.border}`,
                padding: "10px 14px",
                background: "rgba(15,23,42,0.5)",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
              }}
            >
              <span
                style={{
                  color: resultadoColor(c.resultado),
                  fontFamily: t.mono,
                  fontSize: 14,
                  minWidth: 14,
                  marginTop: 1,
                }}
              >
                {resultadoIcon(c.resultado)}
              </span>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 3,
                  }}
                >
                  <span
                    style={{
                      fontFamily: t.mono,
                      fontSize: 12,
                      color: t.text,
                      fontWeight: 600,
                    }}
                  >
                    {c.criterio}
                  </span>
                  <span
                    style={{
                      fontFamily: t.mono,
                      fontSize: 10,
                      color: pesoColor(c.peso),
                      border: `1px solid ${pesoColor(c.peso)}`,
                      padding: "1px 6px",
                      opacity: 0.8,
                    }}
                  >
                    {c.peso}
                  </span>
                  <span
                    style={{
                      fontFamily: t.mono,
                      fontSize: 11,
                      color: "#64748b",
                      marginLeft: "auto",
                    }}
                  >
                    {c.valor}
                  </span>
                </div>
                <div
                  style={{
                    fontFamily: t.mono,
                    fontSize: 11,
                    color: "#64748b",
                    lineHeight: 1.5,
                  }}
                >
                  {c.explicacion}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advertencias */}
      {reporte.advertencias.length > 0 && (
        <div
          style={{
            border: `1px solid rgba(250,204,21,0.3)`,
            background: "rgba(250,204,21,0.04)",
            padding: "12px 16px",
          }}
        >
          <div
            style={{
              fontFamily: t.mono,
              fontSize: 11,
              color: t.yellow,
              letterSpacing: 2,
              marginBottom: 8,
            }}
          >
            ⚠ ADVERTENCIAS
          </div>
          {reporte.advertencias.map((a, i) => (
            <div
              key={i}
              style={{
                fontFamily: t.mono,
                fontSize: 11,
                color: "#94a3b8",
                paddingLeft: 12,
                borderLeft: `2px solid ${t.yellow}`,
                marginBottom: 4,
                lineHeight: 1.5,
              }}
            >
              {a}
            </div>
          ))}
        </div>
      )}

      {/* Nota disclaimer */}
      <div
        style={{
          fontFamily: t.mono,
          fontSize: 10,
          color: "#334155",
          textAlign: "center",
          lineHeight: 1.6,
        }}
      >
        Este análisis fue generado por IA con base en los datos proporcionados.
        <br />
        El administrador tiene la decisión final de aceptar o rechazar el
        ingreso.
      </div>

      {/* Acciones */}
      <div style={{ display: "flex", gap: 10, paddingTop: 4 }}>
        <button onClick={onEditar} style={btn(t.dim)} disabled={guardando}>
          ← EDITAR DATOS
        </button>
        <button
          onClick={onRechazar}
          style={{ ...btn(t.red, "rgba(239,68,68,0.1)"), flex: 1 }}
          disabled={guardando}
        >
          ✕ RECHAZAR INGRESO
        </button>
        <button
          onClick={onAceptar}
          style={{ ...btn(t.green, "rgba(16,185,129,0.15)"), flex: 2 }}
          disabled={guardando}
        >
          {guardando ? "REGISTRANDO..." : "✓ CONFIRMAR INGRESO AL CAMPAMENTO"}
        </button>
      </div>
    </div>
  );
}

// ─── COMPONENTE PRINCIPAL ─────────────────────────────────────────────────────
export default function ModalAgregarPersonaIA({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [paso, setPaso] = useState<
    "formulario" | "analizando" | "reporte" | "rechazado"
  >("formulario");
  const [form, setForm] = useState<FormPersona>({
    nombre: "",
    apellidos: "",
    fecha_nacimiento: "",
    habilidades_combate: 5,
    nivel_confianza: 5,
    estado_salud: "SANO",
  });
  const [reporte, setReporte] = useState<ReporteIA | null>(null);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // ── Llamar al backend para análisis IA ──
  const analizarConIA = async () => {
    setError("");

    if (form.habilidades_combate < 0 || form.habilidades_combate > 10) {
      setError("Habilidades de combate debe estar entre 0 y 10");
      return;
    }
    if (form.nivel_confianza < 0 || form.nivel_confianza > 10) {
      setError("Nivel de confianza debe estar entre 0 y 10");
      return;
    }
    const edad =
      new Date().getFullYear() - new Date(form.fecha_nacimiento).getFullYear();
    if (edad < 5 || edad > 100) {
      setError("Fecha de nacimiento no válida");
      return;
    }

    setPaso("analizando");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/v1/ia/analizar-ingreso", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error ?? "Error del servidor");
      }

      const reporte: ReporteIA = await response.json();
      setReporte(reporte);
      setPaso("reporte");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Error al conectar con la IA. Intente de nuevo.",
      );
      setPaso("formulario");
    }
  };

  // ── Confirmar ingreso ──
  const confirmarIngreso = async () => {
    if (!reporte) return;
    try {
      setGuardando(true);
      await addPersona(form);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // ── Rechazar manualmente ──
  const rechazarIngreso = () => {
    setPaso("rechazado");
  };

  return (
    <div style={overlay} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: `1px solid ${t.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "rgba(15,23,42,0.9)",
          }}
        >
          <div>
            <span
              style={{
                fontFamily: t.mono,
                fontSize: 14,
                letterSpacing: 3,
                color: "#e2e8f0",
              }}
            >
              INGRESO DE SUPERVIVIENTE
            </span>
            <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
              {["formulario", "analizando", "reporte"].map((p, i) => (
                <div
                  key={p}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}
                >
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: "50%",
                      border: `1px solid`,
                      borderColor:
                        paso === p || (paso === "rechazado" && p === "reporte")
                          ? t.green
                          : ["formulario", "analizando", "reporte"].indexOf(
                                paso,
                              ) > i
                            ? t.green
                            : t.border,
                      background: paso === p ? t.green : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {["formulario", "analizando", "reporte"].indexOf(paso) >
                      i && (
                      <span
                        style={{
                          color: "#0f172a",
                          fontSize: 8,
                          fontWeight: 900,
                        }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                  <span
                    style={{
                      fontFamily: t.mono,
                      fontSize: 9,
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      color: paso === p ? t.green : t.dim,
                    }}
                  >
                    {p === "analizando" ? "análisis IA" : p}
                  </span>
                  {i < 2 && (
                    <span style={{ color: t.border, fontSize: 10 }}>—</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: t.dim,
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Error global */}
        {error && (
          <div
            style={{
              margin: "12px 24px 0",
              padding: "10px 14px",
              border: `1px solid ${t.red}`,
              background: "rgba(239,68,68,0.08)",
              fontFamily: t.mono,
              fontSize: 12,
              color: t.red,
              display: "flex",
              gap: 8,
            }}
          >
            ⚠ {error}
            <button
              onClick={() => setError("")}
              style={{
                marginLeft: "auto",
                background: "none",
                border: "none",
                color: t.red,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Paso: Formulario */}
        {paso === "formulario" && (
          <FormularioIngreso
            form={form}
            setForm={setForm}
            onAnalizar={analizarConIA}
            analizando={false}
          />
        )}

        {/* Paso: Analizando */}
        {paso === "analizando" && (
          <div
            style={{
              padding: 60,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <div style={{ position: "relative", width: 80, height: 80 }}>
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `2px solid rgba(16,185,129,0.2)`,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: "50%",
                  border: `2px solid transparent`,
                  borderTopColor: t.green,
                  animation: "spin 1s linear infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "30%",
                  borderRadius: "50%",
                  background: t.green,
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            </div>
            <div
              style={{
                fontFamily: t.mono,
                fontSize: 14,
                letterSpacing: 3,
                color: t.green,
              }}
            >
              ANALIZANDO PERFIL
            </div>
            <div
              style={{
                fontFamily: t.mono,
                fontSize: 11,
                color: t.dim,
                textAlign: "center",
                lineHeight: 1.8,
              }}
            >
              Evaluando criterios de seguridad...
              <br />
              Calculando riesgo de infección...
              <br />
              Determinando cargo óptimo...
            </div>
            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              @keyframes pulse { 0%,100% { opacity:0.4; transform:scale(0.8); } 50% { opacity:1; transform:scale(1.2); } }
              @keyframes blink { 0%,100% { opacity:1; } 50% { opacity:0; } }
            `}</style>
          </div>
        )}

        {/* Paso: Reporte */}
        {paso === "reporte" && reporte && (
          <ReporteAnalisis
            reporte={reporte}
            form={form}
            onAceptar={confirmarIngreso}
            onRechazar={rechazarIngreso}
            onEditar={() => setPaso("formulario")}
            guardando={guardando}
          />
        )}

        {/* Paso: Rechazado manualmente */}
        {paso === "rechazado" && (
          <div
            style={{
              padding: 48,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 16,
              textAlign: "center",
            }}
          >
            <div style={{ fontFamily: t.mono, fontSize: 48, color: t.red }}>
              ✕
            </div>
            <div
              style={{
                fontFamily: t.mono,
                fontSize: 18,
                color: t.red,
                letterSpacing: 2,
              }}
            >
              INGRESO DENEGADO
            </div>
            <div
              style={{
                fontFamily: t.mono,
                fontSize: 12,
                color: t.dim,
                maxWidth: 340,
                lineHeight: 1.7,
              }}
            >
              El administrador ha decidido no permitir el ingreso de{" "}
              <span style={{ color: t.text }}>
                {form.nombre} {form.apellidos}
              </span>{" "}
              al campamento. Esta decisión ha sido registrada.
            </div>
            <button onClick={onClose} style={{ ...btn(t.dim), marginTop: 12 }}>
              CERRAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
