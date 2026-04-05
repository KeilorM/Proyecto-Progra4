import pool from "../db/connection.js";

export const registrarLog = async ({ usuario_id, campamento_id, accion, entidad_afectada, entidad_id, detalle, ip_origen }) => {
  try {
    await pool.query(
      `INSERT INTO logactividad
        (usuario_id, campamento_id, accion, entidad_afectada, entidad_id, detalle, ip_origen)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [usuario_id, campamento_id, accion, entidad_afectada, entidad_id, JSON.stringify(detalle), ip_origen]
    );
  } catch (error) {
    console.error("Error al registrar log:", error);
  }
};