const BASE_URL = "" // ← vacío, usa el proxy de Vite

export function getToken(): string {
  return localStorage.getItem("token") ?? ""
}

export function getRol(): string {
  return localStorage.getItem("rol") ?? ""
}

export function authHeaders() {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${getToken()}`,
  }
}

// ─── AUTH ────────────────────────────────────────────────────────────────────

export async function login(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al iniciar sesión")
  return data
}

// ─── PERSONAS ────────────────────────────────────────────────────────────────

export async function getPersonas() {
  const res = await fetch(`${BASE_URL}/api/v1/personas`, { headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al obtener personas")
  return data
}

export async function addPersona(persona: {
  nombre: string
  apellidos: string
  fecha_nacimiento: string
  habilidades_combate: number
  nivel_confianza: number
  estado_salud: string
}) {
  const res = await fetch(`${BASE_URL}/api/v1/personas`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(persona),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al agregar persona")
  return data
}

export async function updateEstadoPersona(id: number, estado_salud: string) {
  const res = await fetch(`${BASE_URL}/api/v1/personas/${id}/estado`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ estado_salud }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al actualizar estado")
  return data
}

export async function moverPersonaRol(id: number, cargo_id: number, motivo: string) {
  const res = await fetch(`${BASE_URL}/api/v1/personas/${id}/cargo`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ cargo_id, motivo }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al mover persona de rol")
  return data
}

// ─── RECURSOS ────────────────────────────────────────────────────────────────

export async function getBodega() {
  const res = await fetch(`${BASE_URL}/api/v1/recursos`, { headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al obtener bodega")
  return data
}

export async function registrarMovimiento(movimiento: {
  tipo_recurso_id: number
  cantidad: number
  tipo_movimiento: "ENTRADA" | "SALIDA"
  origen: string
  nota?: string
}) {
  const res = await fetch(`${BASE_URL}/api/v1/recursos/movimiento`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(movimiento),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al registrar movimiento")
  return data
}

export async function getAlertas() {
  const res = await fetch(`${BASE_URL}/api/v1/recursos/alertas`, { headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al obtener alertas")
  return data
}

export async function getMovimientos() {
  const res = await fetch(`${BASE_URL}/api/v1/recursos/movimientos`, { headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al obtener movimientos")
  return data
}

// ─── CAMPAMENTOS ─────────────────────────────────────────────────────────────

export async function getCampamentos() {
  const res = await fetch(`${BASE_URL}/api/v1/campamentos`, { headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al obtener campamentos")
  return data
}

export async function crearSolicitud(solicitud: {
  campamento_destino_id: number
  tipo_solicitud: "RECURSOS" | "PERSONAS"
  detalle: object
}) {
  const res = await fetch(`${BASE_URL}/api/v1/campamentos/solicitud`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(solicitud),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al crear solicitud")
  return data
}

export async function responderSolicitud(id: number, estado: "APROBADA" | "RECHAZADA", nota_respuesta?: string) {
  const res = await fetch(`${BASE_URL}/api/v1/campamentos/solicitud/${id}`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ estado, nota_respuesta }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al responder solicitud")
  return data
}

export async function getExploraciones() {
  const res = await fetch(`${BASE_URL}/api/v1/campamentos/exploraciones`, { headers: authHeaders() })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al obtener exploraciones")
  return data
}

export async function crearExploracion(exploracion: {
  nombre_mision: string
  fecha_salida: string
  dias_estimados: number
  dias_extra_max: number
  descripcion_zona?: string
  personas: { persona_id: number; rol_en_mision: string }[]
}) {
  const res = await fetch(`${BASE_URL}/api/v1/campamentos/exploraciones`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(exploracion),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al crear exploración")
  return data
}

export async function completarExploracion(
  id: number,
  recursos_encontrados: { tipo_recurso_id: number; cantidad: number }[]
) {
  const res = await fetch(`${BASE_URL}/api/v1/campamentos/exploraciones/${id}/completar`, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify({ recursos_encontrados }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || "Error al completar exploración")
  return data
}