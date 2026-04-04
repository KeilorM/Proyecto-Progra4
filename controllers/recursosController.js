import pool from "../db/connection.js";
import { registrarLog } from "../middleware/logger.js";

export const getBodega = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;

    const [rows] = await pool.query(
      `SELECT 
        ib.id,
        tr.nombre AS recurso,
        tr.unidad,
        tr.es_vital,
        ib.cantidad_actual,
        ib.cantidad_minima_alerta,
        CASE 
          WHEN ib.cantidad_actual <= ib.cantidad_minima_alerta 
          THEN 1 ELSE 0 
        END AS bajo_minimo
       FROM ItemBodega ib
       JOIN TipoRecurso tr ON tr.id = ib.tipo_recurso_id
       JOIN Bodega b ON b.id = ib.bodega_id
       WHERE b.campamento_id = ?`,
      [campamento_id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const registrarMovimiento = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;
    const usuario_id = req.user.id;
    const { tipo_recurso_id, cantidad, tipo_movimiento, origen, nota } = req.body;

    const tiposValidos = ["ENTRADA", "SALIDA"];
    if (!tiposValidos.includes(tipo_movimiento)) {
      return res.status(400).json({ error: "tipo_movimiento debe ser ENTRADA o SALIDA" });
    }

    const origenesValidos = ["CONSUMO_DIARIO", "PRODUCCION", "EXPLORACION", "TRASLADO_ENVIADO", "TRASLADO_RECIBIDO"];
    if (!origenesValidos.includes(origen)) {
      return res.status(400).json({ error: "origen no válido" });
    }

    const [bodega] = await pool.query(
      `SELECT id FROM Bodega WHERE campamento_id = ?`,
      [campamento_id]
    );

    if (bodega.length === 0) {
      return res.status(404).json({ error: "Bodega no encontrada" });
    }

    const bodega_id = bodega[0].id;

    if (tipo_movimiento === "SALIDA") {
      const [item] = await pool.query(
        `SELECT cantidad_actual FROM ItemBodega 
         WHERE bodega_id = ? AND tipo_recurso_id = ?`,
        [bodega_id, tipo_recurso_id]
      );

      if (item.length === 0 || item[0].cantidad_actual < cantidad) {
        return res.status(400).json({ error: "Stock insuficiente" });
      }
    }

    await pool.query(
      `INSERT INTO MovimientoBodega 
        (bodega_id, tipo_recurso_id, cantidad, tipo_movimiento, origen, registrado_por_usuario_id, nota)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [bodega_id, tipo_recurso_id, cantidad, tipo_movimiento, origen, usuario_id, nota]
    );

    const operacion = tipo_movimiento === "ENTRADA" ? "+" : "-";
    await pool.query(
      `UPDATE ItemBodega SET cantidad_actual = cantidad_actual ${operacion} ?
       WHERE bodega_id = ? AND tipo_recurso_id = ?`,
      [cantidad, bodega_id, tipo_recurso_id]
    );

    const [itemActualizado] = await pool.query(
      `SELECT cantidad_actual, cantidad_minima_alerta 
       FROM ItemBodega 
       WHERE bodega_id = ? AND tipo_recurso_id = ?`,
      [bodega_id, tipo_recurso_id]
    );

    if (itemActualizado[0].cantidad_actual <= itemActualizado[0].cantidad_minima_alerta) {
      await pool.query(
        `INSERT INTO AlertaRecurso 
          (bodega_id, tipo_recurso_id, cantidad_al_momento, cantidad_minima, estado)
         VALUES (?, ?, ?, ?, 'ACTIVA')`,
        [bodega_id, tipo_recurso_id, itemActualizado[0].cantidad_actual, itemActualizado[0].cantidad_minima_alerta]
      );
    }

    await registrarLog({
      usuario_id,
      campamento_id,
      accion: tipo_movimiento === "ENTRADA" ? "ENTRADA_RECURSO" : "SALIDA_RECURSO",
      entidad_afectada: "ItemBodega",
      entidad_id: bodega_id,
      detalle: { tipo_recurso_id, cantidad, origen, nota },
      ip_origen: req.ip,
    });

    res.status(201).json({ mensaje: "Movimiento registrado correctamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const getAlertas = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;

    const [rows] = await pool.query(
      `SELECT 
        ar.id,
        tr.nombre AS recurso,
        tr.unidad,
        tr.es_vital,
        ar.cantidad_al_momento,
        ar.cantidad_minima,
        ar.estado,
        ar.fecha_generacion
       FROM AlertaRecurso ar
       JOIN ItemBodega ib ON ib.bodega_id = ar.bodega_id
       JOIN TipoRecurso tr ON tr.id = ar.tipo_recurso_id
       JOIN Bodega b ON b.id = ar.bodega_id
       WHERE b.campamento_id = ? AND ar.estado = 'ACTIVA'
       GROUP BY ar.id`,
      [campamento_id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const getMovimientos = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;

    const [rows] = await pool.query(
      `SELECT 
        mb.id,
        tr.nombre AS recurso,
        mb.cantidad,
        mb.tipo_movimiento,
        mb.origen,
        mb.nota,
        mb.fecha,
        u.username AS registrado_por
       FROM MovimientoBodega mb
       JOIN TipoRecurso tr ON tr.id = mb.tipo_recurso_id
       JOIN Bodega b ON b.id = mb.bodega_id
       LEFT JOIN Usuario u ON u.id = mb.registrado_por_usuario_id
       WHERE b.campamento_id = ?
       ORDER BY mb.fecha DESC`,
      [campamento_id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};