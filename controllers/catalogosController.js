import pool from '../db/connection.js'

// Lista los tipos de recurso
export const getTiposRecurso = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, unidad, es_consumo_diario, es_vital
       FROM tiporecurso
       ORDER BY nombre ASC`
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error servidor' })
  }
}

// Lista los cargos disponibles
export const getCargos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, descripcion, categoria,
              produccion_comida_diaria, produccion_agua_diaria,
              es_explorador, min_personas_requeridas
       FROM cargo
       ORDER BY categoria, nombre ASC`
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error servidor' })
  }
}

// Solicitudes recibidas por el campamento del usuario
export const getSolicitudesRecibidas = async (req, res) => {
  try {
    const campamento_id = req.user.campamento
    const { rows } = await pool.query(
      `SELECT
        sr.id,
        sr.tipo_solicitud,
        sr.detalle,
        sr.estado,
        sr.fecha_solicitud,
        sr.nota_respuesta,
        c_origen.nombre AS campamento_origen
       FROM solicitudrecurso sr
       JOIN campamento c_origen ON c_origen.id = sr.campamento_origen_id
       WHERE sr.campamento_destino_id = $1
       ORDER BY sr.fecha_solicitud DESC`,
      [campamento_id]
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error servidor' })
  }
}

// Solicitudes enviadas por el campamento del usuario
export const getSolicitudesEnviadas = async (req, res) => {
  try {
    const campamento_id = req.user.campamento
    const { rows } = await pool.query(
      `SELECT
        sr.id,
        sr.tipo_solicitud,
        sr.detalle,
        sr.estado,
        sr.fecha_solicitud,
        sr.nota_respuesta,
        c_destino.nombre AS campamento_destino
       FROM solicitudrecurso sr
       JOIN campamento c_destino ON c_destino.id = sr.campamento_destino_id
       WHERE sr.campamento_origen_id = $1
       ORDER BY sr.fecha_solicitud DESC`,
      [campamento_id]
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error servidor' })
  }
}

// Traslados del campamento
export const getTraslados = async (req, res) => {
  try {
    const campamento_id = req.user.campamento
    const { rows } = await pool.query(
      `SELECT
        t.id,
        t.estado,
        t.fecha_salida_programada,
        t.fecha_llegada_real,
        t.detalle_recursos,
        t.raciones_viaje,
        c_origen.nombre AS campamento_origen,
        c_destino.nombre AS campamento_destino
       FROM traslado t
       JOIN campamento c_origen ON c_origen.id = t.campamento_origen_id
       JOIN campamento c_destino ON c_destino.id = t.campamento_destino_id
       WHERE t.campamento_origen_id = $1 OR t.campamento_destino_id = $1
       ORDER BY t.fecha_salida_programada DESC`,
      [campamento_id]
    )
    res.json(rows)
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error servidor' })
  }
}

// Métricas del dashboard
export const getDashboard = async (req, res) => {
  try {
    const campamento_id = req.user.campamento

    const { rows: personas } = await pool.query(
      `SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN estado_salud = 'SANO' THEN 1 ELSE 0 END) AS sanos,
        SUM(CASE WHEN estado_salud = 'HERIDO' THEN 1 ELSE 0 END) AS heridos,
        SUM(CASE WHEN estado_salud = 'ENFERMO' THEN 1 ELSE 0 END) AS enfermos,
        SUM(CASE WHEN esta_en_campamento = TRUE THEN 1 ELSE 0 END) AS en_campamento
       FROM persona
       WHERE campamento_id = $1`,
      [campamento_id]
    )

    const { rows: alertas } = await pool.query(
      `SELECT COUNT(*) AS total_alertas
       FROM alertarecurso ar
       JOIN bodega b ON b.id = ar.bodega_id
       WHERE b.campamento_id = $1 AND ar.estado = 'ACTIVA'`,
      [campamento_id]
    )

    const { rows: exploraciones } = await pool.query(
      `SELECT COUNT(*) AS en_curso
       FROM exploracion
       WHERE campamento_id = $1 AND estado = 'EN_CURSO'`,
      [campamento_id]
    )

    const { rows: solicitudes } = await pool.query(
      `SELECT COUNT(*) AS pendientes
       FROM solicitudrecurso
       WHERE campamento_destino_id = $1 AND estado = 'PENDIENTE'`,
      [campamento_id]
    )

    res.json({
      personas: personas[0],
      alertas_recursos: parseInt(alertas[0].total_alertas),
      exploraciones_en_curso: parseInt(exploraciones[0].en_curso),
      solicitudes_pendientes: parseInt(solicitudes[0].pendientes),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Error servidor' })
  }
}
