import pool from "../db/connection.js";
import { registrarLog } from "../middleware/logger.js";

export const getCampamentos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT id, nombre, ubicacion, estado, capacidad_maxima, descripcion
       FROM Campamento WHERE estado = 'ACTIVO'`
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
      return res.status(400).json({ error: "tipo_solicitud debe ser RECURSOS, PERSONAS o AYUDA" });
    }

    const [result] = await pool.query(
      `INSERT INTO SolicitudRecurso
        (campamento_origen_id, campamento_destino_id, tipo_solicitud, detalle, estado)
       VALUES (?, ?, ?, ?, 'PENDIENTE')`,
      [campamento_origen_id, campamento_destino_id, tipo_solicitud, JSON.stringify(detalle)]
    );

    await registrarLog({
      usuario_id: req.user.id,
      campamento_id: campamento_origen_id,
      accion: "CREAR_SOLICITUD",
      entidad_afectada: "SolicitudRecurso",
      entidad_id: result.insertId,
      detalle: { campamento_destino_id, tipo_solicitud },
      ip_origen: req.ip,
    });

    res.status(201).json({ mensaje: "Solicitud enviada", id: result.insertId });
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

    const [solicitud] = await pool.query(
      `SELECT * FROM SolicitudRecurso 
       WHERE id = ? AND campamento_destino_id = ? AND estado = 'PENDIENTE'`,
      [id, campamento_id]
    );

    if (solicitud.length === 0) {
      return res.status(404).json({ error: "Solicitud no encontrada o ya fue respondida" });
    }

    await pool.query(
      `UPDATE SolicitudRecurso 
       SET estado = ?, aprobado_por_usuario_id = ?, fecha_respuesta = NOW(), nota_respuesta = ?
       WHERE id = ?`,
      [estado, usuario_id, nota_respuesta, id]
    );

    if (estado === "APROBADA") {
      await pool.query(
        `INSERT INTO Traslado
          (solicitud_id, campamento_origen_id, campamento_destino_id, fecha_salida_programada, estado, detalle_recursos, raciones_viaje)
         VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY), 'PENDIENTE_SALIDA', ?, 0)`,
        [id, solicitud[0].campamento_origen_id, campamento_id, solicitud[0].detalle]
      );
    }

    await registrarLog({
      usuario_id,
      campamento_id,
      accion: "RESPUESTA_SOLICITUD",
      entidad_afectada: "SolicitudRecurso",
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

    const [rows] = await pool.query(
      `SELECT 
        e.id,
        e.nombre_mision,
        e.fecha_salida,
        e.dias_estimados,
        e.dias_extra_max,
        e.estado,
        e.descripcion_zona,
        COUNT(pe.persona_id) AS total_personas
       FROM Exploracion e
       LEFT JOIN PersonaExploracion pe ON pe.exploracion_id = e.id
       WHERE e.campamento_id = ?
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
    const {
      nombre_mision,
      fecha_salida,
      dias_estimados,
      dias_extra_max,
      descripcion_zona,
      personas,
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO Exploracion
        (campamento_id, nombre_mision, fecha_salida, dias_estimados, dias_extra_max, estado, descripcion_zona)
       VALUES (?, ?, ?, ?, ?, 'PLANIFICADA', ?)`,
      [campamento_id, nombre_mision, fecha_salida, dias_estimados, dias_extra_max, descripcion_zona]
    );

    const exploracion_id = result.insertId;

    if (personas && personas.length > 0) {
      const valores = personas.map(p => [exploracion_id, p.persona_id, p.rol_en_mision]);
      await pool.query(
        `INSERT INTO PersonaExploracion (exploracion_id, persona_id, rol_en_mision) VALUES ?`,
        [valores]
      );
    }

    await registrarLog({
      usuario_id: req.user.id,
      campamento_id,
      accion: "CREAR_EXPLORACION",
      entidad_afectada: "Exploracion",
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

    const [exploracion] = await pool.query(
      `SELECT * FROM Exploracion WHERE id = ? AND campamento_id = ?`,
      [id, campamento_id]
    );

    if (exploracion.length === 0) {
      return res.status(404).json({ error: "Exploración no encontrada" });
    }

    await pool.query(
      `UPDATE Exploracion SET estado = 'COMPLETADA' WHERE id = ?`,
      [id]
    );

    if (recursos_encontrados && recursos_encontrados.length > 0) {
      const [bodega] = await pool.query(
        `SELECT id FROM Bodega WHERE campamento_id = ?`,
        [campamento_id]
      );

      const bodega_id = bodega[0].id;

      for (const recurso of recursos_encontrados) {
        await pool.query(
          `UPDATE ItemBodega SET cantidad_actual = cantidad_actual + ?
           WHERE bodega_id = ? AND tipo_recurso_id = ?`,
          [recurso.cantidad, bodega_id, recurso.tipo_recurso_id]
        );

        await pool.query(
          `INSERT INTO MovimientoBodega
            (bodega_id, tipo_recurso_id, cantidad, tipo_movimiento, origen, registrado_por_usuario_id, nota)
           VALUES (?, ?, ?, 'ENTRADA', 'EXPLORACION', ?, ?)`,
          [bodega_id, recurso.tipo_recurso_id, recurso.cantidad, req.user.id, `Recursos de exploración: ${exploracion[0].nombre_mision}`]
        );
      }
    }

    await registrarLog({
      usuario_id: req.user.id,
      campamento_id,
      accion: "COMPLETAR_EXPLORACION",
      entidad_afectada: "Exploracion",
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