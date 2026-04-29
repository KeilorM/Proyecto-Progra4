const calcularEdad = (fechaNac) => {
  const hoy = new Date();
  const nac = new Date(fechaNac);
  let edad = hoy.getFullYear() - nac.getFullYear();
  const m = hoy.getMonth() - nac.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
  return edad;
};

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
- Edad: ${edad} anos
- Habilidad de combate: ${habilidades_combate}/10
- Nivel de confianza: ${nivel_confianza}/10
- Estado de salud: ${estado_salud}

REGLAS DEL CAMPAMENTO:
1. Se necesitan personas de entre 15 y 65 anos para trabajar activamente.
2. Nivel de confianza minimo requerido: 4/10 (personas no confiables son un riesgo).
3. Personas con confianza 0-3 son rechazadas automaticamente por riesgo a la seguridad.
4. Estado ENFERMO implica revision medica obligatoria antes de ingresar.
5. Habilidad de combate alta (7+) es muy valorada para defensa del campamento.
6. Se prefieren personas sanas o con heridas menores que puedan recuperarse.
7. La puntuacion total es sobre 100 y se calcula segun todos los criterios ponderados.

CARGOS DISPONIBLES: Explorador, Guardia, Medico, Agricultor, Ingeniero, Cocinero, Estratega.

Responde UNICAMENTE con un JSON valido con esta estructura exacta, sin markdown, sin texto adicional, sin bloques de codigo:
{"decision":"ACEPTADO","puntuacion":75,"resumen":"frase corta","riesgo_zombie":"BAJO","cargo_sugerido":"Guardia","advertencias":["advertencia si aplica"],"criterios":[{"criterio":"Edad","valor":"25 anos","peso":"ALTO","resultado":"POSITIVO","explicacion":"explicacion breve"}]}

Los valores posibles son:
- decision: "ACEPTADO", "RECHAZADO" o "REVISION"
- riesgo_zombie: "BAJO", "MEDIO" o "ALTO"  
- peso: "ALTO", "MEDIO" o "BAJO"
- resultado: "POSITIVO", "NEGATIVO" o "NEUTRAL"

Incluye entre 4 y 6 criterios de evaluacion.`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: "Eres un sistema de evaluacion de campamento zombie. Respondes UNICAMENTE con JSON valido, sin markdown ni texto adicional.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 1000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Groq API error:", data);
      return res.status(500).json({ error: "Error al conectar con el servicio de IA." });
    }

    const texto = data.choices?.[0]?.message?.content ?? "";
    const clean = texto.replace(/```json|```/g, "").trim();
    const reporte = JSON.parse(clean);

    return res.json(reporte);
  } catch (err) {
    console.error("Error IA analisis ingreso:", err);
    return res.status(500).json({ error: "Error al procesar el analisis con IA." });
  }
};
