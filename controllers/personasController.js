import pool from "../db/connection.js";
import { registrarLog } from "../middleware/logger.js";

export const getPersonas = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;

    const { rows } = await pool.query(
      `SELECT 
        p.id,
        p.nombre,
        p.apellidos,
        p.estado_salud,
        p.esta_en_campamento,
        p.fecha_ingreso,
        c.nombre AS cargo,
        c.categoria,
        ac.es_temporal
       FROM persona p
       LEFT JOIN asignacioncargo ac ON ac.persona_id = p.id AND ac.campamento_id = $1
       LEFT JOIN cargo c ON c.id = ac.cargo_id
       WHERE p.campamento_id = $2`,
      [campamento_id, campamento_id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const addPersona = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;
    const {
      nombre,
      apellidos,
      fecha_nacimiento,
      habilidades_combate,
      nivel_confianza,
      estado_salud,
    } = req.body;

    const { rows } = await pool.query(
      `INSERT INTO persona 
        (nombre, apellidos, fecha_nacimiento, habilidades_combate, nivel_confianza, estado_salud, esta_en_campamento, fecha_ingreso, campamento_id)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, NOW(), $7)
       RETURNING id`,
      [nombre, apellidos, fecha_nacimiento, habilidades_combate, nivel_confianza, estado_salud, campamento_id]
    );

    await registrarLog({
      usuario_id: req.user.id,
      campamento_id: campamento_id,
      accion: "INGRESO_PERSONA",
      entidad_afectada: "persona",
      entidad_id: rows[0].id,
      detalle: { nombre, apellidos, estado_salud },
      ip_origen: req.ip,
    });

    res.status(201).json({ mensaje: "Persona agregada", id: rows[0].id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const updateEstadoPersona = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado_salud } = req.body;
    const campamento_id = req.user.campamento;

    const estadosValidos = ["SANO", "HERIDO", "ENFERMO"];
    if (!estadosValidos.includes(estado_salud)) {
      return res.status(400).json({ error: "Estado no válido. Use SANO, HERIDO o ENFERMO" });
    }

    await pool.query(
      `UPDATE persona SET estado_salud = $1 
       WHERE id = $2 AND campamento_id = $3`,
      [estado_salud, id, campamento_id]
    );

    await registrarLog({
      usuario_id: req.user.id,
      campamento_id: campamento_id,
      accion: "CAMBIO_ESTADO_PERSONA",
      entidad_afectada: "persona",
      entidad_id: id,
      detalle: { estado_salud },
      ip_origen: req.ip,
    });

    res.json({ mensaje: `Estado actualizado a ${estado_salud}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const moverPersonaRol = async (req, res) => {
  try {
    const { id } = req.params;
    const { cargo_id, motivo } = req.body;
    const campamento_id = req.user.campamento;

    await pool.query(
      `UPDATE asignacioncargo 
       SET cargo_id = $1, es_temporal = TRUE, motivo = $2
       WHERE persona_id = $3 AND campamento_id = $4`,
      [cargo_id, motivo, id, campamento_id]
    );

    await registrarLog({
      usuario_id: req.user.id,
      campamento_id: campamento_id,
      accion: "CAMBIO_ROL_PERSONA",
      entidad_afectada: "asignacioncargo",
      entidad_id: id,
      detalle: { cargo_id, motivo, es_temporal: true },
      ip_origen: req.ip,
    });

    res.json({ mensaje: `Persona ${id} movida temporalmente al cargo ${cargo_id}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};