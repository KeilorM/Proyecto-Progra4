import pool from "../db/connection.js";

export const getMetricas = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;

    const [personas, recursos, alertas, exploraciones, solicitudes, movimientos] =
      await Promise.all([

        pool.query(
          `SELECT estado_salud, COUNT(*) as total
           FROM persona
           WHERE campamento_id = $1
           GROUP BY estado_salud`,
          [campamento_id]
        ),

        pool.query(
          `SELECT tr.nombre, tr.unidad, ib.cantidad_actual, ib.cantidad_minima_alerta
           FROM itembodega ib
           JOIN bodega b ON b.id = ib.bodega_id
           JOIN tiporecurso tr ON tr.id = ib.tipo_recurso_id
           WHERE b.campamento_id = $1`,
          [campamento_id]
        ),

        pool.query(
          `SELECT COUNT(*) as total
           FROM alertarecurso ar
           JOIN bodega b ON b.id = ar.bodega_id
           WHERE b.campamento_id = $1 AND ar.estado = 'ACTIVA'`,
          [campamento_id]
        ),

        pool.query(
          `SELECT estado, COUNT(*) as total
           FROM exploracion
           WHERE campamento_id = $1
           GROUP BY estado`,
          [campamento_id]
        ),

        pool.query(
          `SELECT COUNT(*) as total
           FROM solicitudrecurso
           WHERE campamento_destino_id = $1 AND estado = 'PENDIENTE'`,
          [campamento_id]
        ),

        pool.query(
          `SELECT DATE(fecha) as dia,
                  SUM(CASE WHEN tipo_movimiento = 'ENTRADA' THEN cantidad ELSE 0 END) as entradas,
                  SUM(CASE WHEN tipo_movimiento = 'SALIDA'  THEN cantidad ELSE 0 END) as salidas
           FROM movimientobodega mb
           JOIN bodega b ON b.id = mb.bodega_id
           WHERE b.campamento_id = $1
             AND mb.fecha >= NOW() - INTERVAL '7 days'
           GROUP BY DATE(fecha)
           ORDER BY dia ASC`,
          [campamento_id]
        ),
      ]);

    const personasPorEstado = {};
    for (const row of personas.rows) {
      personasPorEstado[row.estado_salud] = Number(row.total);
    }

    const exploByEstado = {};
    for (const row of exploraciones.rows) {
      exploByEstado[row.estado] = Number(row.total);
    }

    res.json({
      personas: {
        total: Object.values(personasPorEstado).reduce((a, b) => a + b, 0),
        por_estado: personasPorEstado,
      },
      recursos: recursos.rows,
      alertas_activas: Number(alertas.rows[0].total),
      exploraciones: exploByEstado,
      solicitudes_pendientes: Number(solicitudes.rows[0].total),
      movimientos_semana: movimientos.rows,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};