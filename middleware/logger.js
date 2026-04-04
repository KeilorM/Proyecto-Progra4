import pool from "../db/connection.js";

export const registrarLog = async ({ usuario_id, campamento_id, accion, entidad_afectada, entidad_id, detalle, ip_origen }) => {
  try {
    await pool.query(
      `INSERT INTO LogActividad 
        (usuario_id, campamento_id, accion, entidad_afectada, entidad_id, detalle, ip_origen)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [usuario_id, campamento_id, accion, entidad_afectada, entidad_id, JSON.stringify(detalle), ip_origen]
    );
  } catch (error) {
    // el log nunca debe romper el flujo principal
    console.error("Error al registrar log:", error);
  }
};