import pool from "../db/connection.js";
import { registrarLog } from "../middleware/logger.js";

export const getCampamentos = async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, nombre, ubicacion, estado, capacidad_maxima, descripcion
       FROM campamento WHERE estado = 'ACTIVO'`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const crearSolicitud = async (req, res) => {
  try {
    const campamento_origen_id = req.user.campamento;
    const { campamento_destino_id, tipo_solicitud, detalle } = req.body;

    if (campamento_origen_id === campamento_destino_id) {
      return res.status(400).json({ error: "No podés enviar una solicitud a tu propio campamento" });
    }

    const tiposValidos = ["RECURSOS", "PERSONAS"];
    if (!tiposValidos.includes(tipo_solicitud)) {
      return res.status(400).json({ error: "tipo_solicitud debe ser RECURSOS o PERSONAS" });
    }

    const { rows } = await pool.query(
      `INSERT INTO solicitudrecurso
        (campamento_origen_id, campamento_destino_id, tipo_solicitud, detalle, estado)
       VALUES ($1, $2, $3, $4, 'PENDIENTE')
       RETURNING id`,
      [campamento_origen_id, campamento_destino_id, tipo_solicitud, JSON.stringify(detalle)]
    );

    await registrarLog({
      usuario_id: req.user.id,
      campamento_id: campamento_origen_id,
      accion: "CREAR_SOLICITUD",
      entidad_afectada: "solicitudrecurso",
      entidad_id: rows[0].id,
      detalle: { campamento_destino_id, tipo_solicitud },
      ip_origen: req.ip,
    });

    res.status(201).json({ mensaje: "Solicitud enviada", id: rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const responderSolicitud = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, nota_respuesta } = req.body;
    const usuario_id = req.user.id;
    const campamento_id = req.user.campamento;

    const estadosValidos = ["APROBADA", "RECHAZADA"];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: "estado debe ser APROBADA o RECHAZADA" });
    }

    const { rows: solicitud } = await pool.query(
      `SELECT * FROM solicitudrecurso 
       WHERE id = $1 AND campamento_destino_id = $2 AND estado = 'PENDIENTE'`,
      [id, campamento_id]
    );

    if (solicitud.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada o ya fue respondida" });
    }

    await pool.query(
      `UPDATE solicitudrecurso 
       SET estado = $1, aprobado_por_usuario_id = $2, fecha_respuesta = NOW(), nota_respuesta = $3
       WHERE id = $4`,
      [estado, usuario_id, nota_respuesta, id]
    );

    if (estado === "APROBADA") {
      await pool.query(
        `INSERT INTO traslado
          (solicitud_id, campamento_origen_id, campamento_destino_id, fecha_salida_programada, estado, detalle_recursos, raciones_viaje)
         VALUES ($1, $2, $3, NOW() + INTERVAL '1 day', 'PENDIENTE_SALIDA', $4, 0)`,
        [id, solicitud[0].campamento_origen_id, campamento_id, solicitud[0].detalle]
      );
    }

    await registrarLog({
      usuario_id,
      campamento_id,
      accion: "RESPUESTA_SOLICITUD",
      entidad_afectada: "solicitudrecurso",
      entidad_id: id,
      detalle: { estado, nota_respuesta },
      ip_origen: req.ip,
    });

    res.json({ mensaje: `Solicitud ${estado.toLowerCase()}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const getExploraciones = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;

    const { rows } = await pool.query(
      `SELECT 
        e.id,
        e.nombre_mision,
        e.fecha_salida,
        e.dias_estimados,
        e.dias_extra_max,
        e.estado,
        e.descripcion_zona,
        COUNT(pe.persona_id) AS total_personas
       FROM exploracion e
       LEFT JOIN personaexploracion pe ON pe.exploracion_id = e.id
       WHERE e.campamento_id = $1
       GROUP BY e.id
       ORDER BY e.fecha_salida DESC`,
      [campamento_id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const crearExploracion = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;
    const { nombre_mision, fecha_salida, dias_estimados, dias_extra_max, descripcion_zona, personas } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO exploracion
        (campamento_id, nombre_mision, fecha_salida, dias_estimados, dias_extra_max, estado, descripcion_zona)
       VALUES ($1, $2, $3, $4, $5, 'PLANIFICADA', $6)
       RETURNING id`,
      [campamento_id, nombre_mision, fecha_salida, dias_estimados, dias_extra_max, descripcion_zona]
    );

    const exploracion_id = rows[0].id;

    if (personas && personas.length > 0) {
      for (const p of personas) {
        await pool.query(
          `INSERT INTO personaexploracion (exploracion_id, persona_id, rol_en_mision) VALUES ($1, $2, $3)`,
          [exploracion_id, p.persona_id, p.rol_en_mision]
        );
      }
    }

    await registrarLog({
      usuario_id: req.user.id,
      campamento_id,
      accion: "CREAR_EXPLORACION",
      entidad_afectada: "exploracion",
      entidad_id: exploracion_id,
      detalle: { nombre_mision, fecha_salida, dias_estimados },
      ip_origen: req.ip,
    });

    res.status(201).json({ mensaje: "Exploración agendada", id: exploracion_id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const completarExploracion = async (req, res) => {
  try {
    const { id } = req.params;
    const campamento_id = req.user.campamento;
    const { recursos_encontrados } = req.body;

    const { rows: exploracion } = await pool.query(
      `SELECT * FROM exploracion WHERE id = $1 AND campamento_id = $2`,
      [id, campamento_id]
    );

    if (exploracion.length === 0) {
      return res.status(404).json({ error: "Exploración no encontrada" });
    }

    await pool.query(
      `UPDATE exploracion SET estado = 'COMPLETADA' WHERE id = $1`,
      [id]
    );

    if (recursos_encontrados && recursos_encontrados.length > 0) {
      const { rows: bodega } = await pool.query(
        `SELECT id FROM bodega WHERE campamento_id = $1`,
        [campamento_id]
      );

      const bodega_id = bodega[0].id;

      for (const recurso of recursos_encontrados) {
        await pool.query(
          `UPDATE itembodega SET cantidad_actual = cantidad_actual + $1
           WHERE bodega_id = $2 AND tipo_recurso_id = $3`,
          [recurso.cantidad, bodega_id, recurso.tipo_recurso_id]
        );

        await pool.query(
          `INSERT INTO movimientobodega
            (bodega_id, tipo_recurso_id, cantidad, tipo_movimiento, origen, registrado_por_usuario_id, nota)
           VALUES ($1, $2, $3, 'ENTRADA', 'EXPLORACION', $4, $5)`,
          [bodega_id, recurso.tipo_recurso_id, recurso.cantidad, req.user.id, `Recursos de exploración: ${exploracion[0].nombre_mision}`]
        );
      }
    }

    await registrarLog({
      usuario_id: req.user.id,
      campamento_id,
      accion: "COMPLETAR_EXPLORACION",
      entidad_afectada: "exploracion",
      entidad_id: id,
      detalle: { recursos_encontrados },
      ip_origen: req.ip,
    });

    res.json({ mensaje: "Exploración completada y recursos registrados" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const aprobarSalidaTraslado = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;
    const campamento_id = req.user.campamento;

    const { rows: traslado } = await pool.query(
      `SELECT * FROM traslado WHERE id = $1 AND campamento_origen_id = $2 AND estado = 'PENDIENTE_SALIDA'`,
      [id, campamento_id]
    );

    if (traslado.length === 0) {
      return res.status(404).json({ error: "Traslado no encontrado o ya fue procesado" });
    }

    await pool.query(
      `UPDATE traslado SET estado = 'EN_TRANSITO', aprobado_salida_por_id = $1 WHERE id = $2`,
      [usuario_id, id]
    );

    await registrarLog({
      usuario_id,
      campamento_id,
      accion: "APROBAR_SALIDA_TRASLADO",
      entidad_afectada: "traslado",
      entidad_id: id,
      detalle: { estado: "EN_TRANSITO" },
      ip_origen: req.ip,
    });

    res.json({ mensaje: "Salida del traslado aprobada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const aprobarLlegadaTraslado = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;
    const campamento_id = req.user.campamento;

    const { rows: traslado } = await pool.query(
      `SELECT * FROM traslado WHERE id = $1 AND campamento_destino_id = $2 AND estado = 'EN_TRANSITO'`,
      [id, campamento_id]
    );

    if (traslado.length === 0) {
      return res.status(404).json({ error: "Traslado no encontrado o ya fue procesado" });
    }

    await pool.query(
      `UPDATE traslado 
       SET estado = 'COMPLETADO', aprobado_llegada_por_id = $1, fecha_llegada_real = NOW()
       WHERE id = $2`,
      [usuario_id, id]
    );

    await registrarLog({
      usuario_id,
      campamento_id,
      accion: "APROBAR_LLEGADA_TRASLADO",
      entidad_afectada: "traslado",
      entidad_id: id,
      detalle: { estado: "COMPLETADO" },
      ip_origen: req.ip,
    });

    res.json({ mensaje: "Llegada del traslado aprobada y completada" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};