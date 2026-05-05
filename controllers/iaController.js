const calcularEdad = (fechaNac) => {
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

// ─── ANALIZAR INGRESO (sigue usando IA para el reporte completo)
export const analizarIngreso = async (req, res) => {
  const { nombre, apellidos, fecha_nacimiento, habilidades_combate, nivel_confianza, estado_salud } = req.body;

  if (!nombre || !apellidos || !fecha_nacimiento) {
    return res.status(400).json({ error: "Faltan datos obligatorios del superviviente." });
  }

  const edad = calcularEdad(fecha_nacimiento);

  const prompt = `Eres el sistema de evaluacion de ingreso de un campamento de supervivientes en un apocalipsis zombie.
Debes analizar si una persona debe ser aceptada o rechazada en el campamento, con criterios claros y transparentes.

DATOS DEL SOLICITANTE:
- Nombre: ${nombre} ${apellidos}
- Edad: ${edad} anios
- Habilidad de combate: ${habilidades_combate}/10
- Nivel de confianza: ${nivel_confianza}/10
- Estado de salud: ${estado_salud}

REGLAS DEL CAMPAMENTO:
1. Se necesitan personas de entre 15 y 65 anios para trabajar activamente.
2. Nivel de confianza minimo requerido: 4/10.
3. Personas con confianza 0-3 son rechazadas automaticamente.
4. Estado ENFERMO implica revision medica obligatoria antes de ingresar.
5. Habilidad de combate alta (7+) es muy valorada para defensa del campamento.
6. Se prefieren personas sanas o con heridas menores que puedan recuperarse.
7. La puntuacion total es sobre 100.

IMPORTANTE: Solo puedes sugerir cargos de esta lista exacta:
["Explorador","Guardia","Medico","Lider","Tecnico de Logistica","Cocinero","Recolector de Agua"]

Responde UNICAMENTE con JSON valido sin markdown:
{"decision":"ACEPTADO","puntuacion":75,"resumen":"frase corta","riesgo_zombie":"BAJO","cargo_sugerido":"Guardia","advertencias":[],"criterios":[{"criterio":"Edad","valor":"25 anios","peso":"ALTO","resultado":"POSITIVO","explicacion":"explicacion breve"}]}

decision: "ACEPTADO", "RECHAZADO" o "REVISION"
riesgo_zombie: "BAJO", "MEDIO" o "ALTO"
peso: "ALTO", "MEDIO" o "BAJO"
resultado: "POSITIVO", "NEGATIVO" o "NEUTRAL"
Incluye entre 4 y 6 criterios.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: "Eres un sistema de evaluacion de campamento zombie. Respondes UNICAMENTE con JSON valido, sin markdown ni texto adicional." },
          { role: "user", content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: "Error al conectar con el servicio de IA." });

    const texto = data.choices?.[0]?.message?.content ?? "";
    const clean = texto.trim().replace(/```json|```/g, "");
    const reporte = JSON.parse(clean);

    const c = Number(habilidades_combate);
    const n = Number(nivel_confianza);
    const herido = estado_salud === "ENFERMO" || estado_salud === "HERIDO";

    if (c >= 9 && n >= 9) reporte.cargo_sugerido = "Líder";
    else if (c >= 8 && n >= 5 && !herido) reporte.cargo_sugerido = "Explorador";
    else if (c >= 8 && herido) reporte.cargo_sugerido = "Técnico de Logística";
    else if (c <= 4 && n >= 8) reporte.cargo_sugerido = "Médico";
    else if (c <= 4 && n >= 6) reporte.cargo_sugerido = "Cocinero";
    else if (c >= 6 && n >= 4 && !herido) reporte.cargo_sugerido = "Guardia";
    else if (c <= 5 && n >= 5) reporte.cargo_sugerido = "Técnico de Logística";
    else reporte.cargo_sugerido = "Recolector de Agua";

    return res.json(reporte);
  } catch (err) {
    console.error("Error IA analisis ingreso:", err);
    return res.status(500).json({ error: "Error al procesar el analisis con IA." });
  }
};

// ─── ASIGNAR CARGO (lógica JS determinista, IA solo explica)
export const asignarCargo = async (req, res) => {
  const { nombre, apellidos, habilidades_combate, nivel_confianza, estado_salud, edad } = req.body;

  const c = Number(habilidades_combate);
  const n = Number(nivel_confianza);
  const s = String(estado_salud).toUpperCase();
  const herido = s === "ENFERMO" || s === "HERIDO";

  // ── Lógica determinista — el cargo se decide aquí, NO la IA ──
  let cargo_id, cargo_nombre, categoria;

  if (c >= 9 && n >= 9) {
    cargo_id = 1; cargo_nombre = "Líder"; categoria = "LIDERAZGO";
  } else if (c >= 8 && n >= 5 && !herido) {
    cargo_id = 3; cargo_nombre = "Explorador"; categoria = "COMBATE";
  } else if (c >= 8 && n >= 5 && herido) {
    // herido con alto combate → Técnico mientras se recupera
    cargo_id = 7; cargo_nombre = "Técnico de Logística"; categoria = "LOGISTICA";
  } else if (c <= 4 && n >= 8) {
    cargo_id = 2; cargo_nombre = "Médico"; categoria = "SALUD";
  } else if (c <= 4 && n >= 6) {
    cargo_id = 5; cargo_nombre = "Cocinero"; categoria = "RECOLECCION";
  } else if (c >= 6 && n >= 4 && !herido) {
    cargo_id = 6; cargo_nombre = "Guardia"; categoria = "COMBATE";
  } else if (c <= 5 && n >= 5) {
    cargo_id = 7; cargo_nombre = "Técnico de Logística"; categoria = "LOGISTICA";
  } else {
    cargo_id = 4; cargo_nombre = "Recolector de Agua"; categoria = "RECOLECCION";
  }

  // ── IA solo genera la explicación en lenguaje natural ──
  const prompt = `En 1 oracion explica por que ${nombre} ${apellidos} con combate=${c}/10, confianza=${n}/10 y salud=${s} fue asignado como ${cargo_nombre} en un campamento zombie. Solo la oracion, sin JSON.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
        max_tokens: 80,
      }),
    });

    const data = await response.json();
    const razon = data.choices?.[0]?.message?.content?.trim()
      ?? `Asignado como ${cargo_nombre} según perfil de combate=${c} y confianza=${n}.`;

    return res.json({
      cargo_id,
      cargo_nombre,
      categoria,
      razon,
      reglas_aplicadas: [`combate=${c}`, `confianza=${n}`, `salud=${s}`],
    });
  } catch (err) {
    // Si falla la IA igual devuelve el cargo calculado
    return res.json({
      cargo_id,
      cargo_nombre,
      categoria,
      razon: `Asignado como ${cargo_nombre} según perfil de combate=${c} y confianza=${n}.`,
      reglas_aplicadas: [`combate=${c}`, `confianza=${n}`, `salud=${s}`],
    });
  }
};