import pool from "../db/connection.js";
import { registrarLog } from "../middleware/logger.js";

export const getBodega = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;

    const { rows } = await pool.query(
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
       FROM itembodega ib
       JOIN tiporecurso tr ON tr.id = ib.tipo_recurso_id
       JOIN bodega b ON b.id = ib.bodega_id
       WHERE b.campamento_id = $1`,
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

    const { rows: bodegaRows } = await pool.query(
      `SELECT id FROM bodega WHERE campamento_id = $1`,
      [campamento_id]
    );

    if (bodegaRows.length === 0) {
      return res.status(404).json({ error: "Bodega no encontrada" });
    }

    const bodega_id = bodegaRows[0].id;

    if (tipo_movimiento === "SALIDA") {
      const { rows: itemRows } = await pool.query(
        `SELECT cantidad_actual FROM itembodega 
         WHERE bodega_id = $1 AND tipo_recurso_id = $2`,
        [bodega_id, tipo_recurso_id]
      );

      if (itemRows.length === 0 || itemRows[0].cantidad_actual < cantidad) {
        return res.status(400).json({ error: "Stock insuficiente" });
      }
    }

    await pool.query(
      `INSERT INTO movimientobodega 
        (bodega_id, tipo_recurso_id, cantidad, tipo_movimiento, origen, registrado_por_usuario_id, nota)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [bodega_id, tipo_recurso_id, cantidad, tipo_movimiento, origen, usuario_id, nota]
    );

    const operador = tipo_movimiento === "ENTRADA" ? "+" : "-";
    await pool.query(
      `UPDATE itembodega SET cantidad_actual = cantidad_actual ${operador} $1
       WHERE bodega_id = $2 AND tipo_recurso_id = $3`,
      [cantidad, bodega_id, tipo_recurso_id]
    );

    const { rows: itemActualizado } = await pool.query(
      `SELECT cantidad_actual, cantidad_minima_alerta 
       FROM itembodega 
       WHERE bodega_id = $1 AND tipo_recurso_id = $2`,
      [bodega_id, tipo_recurso_id]
    );

    if (itemActualizado[0].cantidad_actual <= itemActualizado[0].cantidad_minima_alerta) {
      await pool.query(
        `INSERT INTO alertarecurso 
          (bodega_id, tipo_recurso_id, cantidad_al_momento, cantidad_minima, estado)
         VALUES ($1, $2, $3, $4, 'ACTIVA')`,
        [bodega_id, tipo_recurso_id, itemActualizado[0].cantidad_actual, itemActualizado[0].cantidad_minima_alerta]
      );
    }

    await registrarLog({
      usuario_id,
      campamento_id,
      accion: tipo_movimiento === "ENTRADA" ? "ENTRADA_RECURSO" : "SALIDA_RECURSO",
      entidad_afectada: "itembodega",
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

    const { rows } = await pool.query(
      `SELECT 
        ar.id,
        tr.nombre AS recurso,
        tr.unidad,
        tr.es_vital,
        ar.cantidad_al_momento,
        ar.cantidad_minima,
        ar.estado,
        ar.fecha_generacion
       FROM alertarecurso ar
       JOIN itembodega ib ON ib.bodega_id = ar.bodega_id
       JOIN tiporecurso tr ON tr.id = ar.tipo_recurso_id
       JOIN bodega b ON b.id = ar.bodega_id
       WHERE b.campamento_id = $1 AND ar.estado = 'ACTIVA'
       GROUP BY ar.id, tr.nombre, tr.unidad, tr.es_vital, ar.cantidad_al_momento, ar.cantidad_minima, ar.estado, ar.fecha_generacion`,
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

    const { rows } = await pool.query(
      `SELECT 
        mb.id,
        tr.nombre AS recurso,
        mb.cantidad,
        mb.tipo_movimiento,
        mb.origen,
        mb.nota,
        mb.fecha,
        u.username AS registrado_por
       FROM movimientobodega mb
       JOIN tiporecurso tr ON tr.id = mb.tipo_recurso_id
       JOIN bodega b ON b.id = mb.bodega_id
       LEFT JOIN usuario u ON u.id = mb.registrado_por_usuario_id
       WHERE b.campamento_id = $1
       ORDER BY mb.fecha DESC`,
      [campamento_id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const getBodegaResumen = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;

    const { rows } = await pool.query(
      `SELECT
        tr.nombre AS recurso,
        tr.unidad,
        tr.es_vital,
        ib.cantidad_actual,
        ib.cantidad_minima_alerta,
        CASE
          WHEN ib.cantidad_actual <= ib.cantidad_minima_alerta
          THEN true ELSE false
        END AS bajo_minimo
       FROM itembodega ib
       JOIN tiporecurso tr ON tr.id = ib.tipo_recurso_id
       JOIN bodega b ON b.id = ib.bodega_id
       WHERE b.campamento_id = $1
       ORDER BY tr.es_vital DESC, tr.nombre ASC`,
      [campamento_id]
    );

    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};

export const procesarConsumoDiario = async (req, res) => {
  try {
    const campamento_id = req.user.campamento;

    const { rows: bodega } = await pool.query(
      `SELECT id FROM bodega WHERE campamento_id = $1`,
      [campamento_id]
    );

    if (bodega.length === 0) {
      return res.status(404).json({ error: "Bodega no encontrada" });
    }

    const bodega_id = bodega[0].id;

    const { rows: produccion } = await pool.query(
      `SELECT
        COALESCE(SUM(c.produccion_comida_diaria), 0) AS comida,
        COALESCE(SUM(c.produccion_agua_diaria), 0) AS agua
       FROM asignacioncargo ac
       JOIN cargo c ON c.id = ac.cargo_id
       JOIN persona p ON p.id = ac.persona_id
       WHERE ac.campamento_id = $1
         AND ac.fecha_fin IS NULL
         AND p.estado_salud = 'SANO'
         AND p.esta_en_campamento = TRUE`,
      [campamento_id]
    );

    const { rows: countPersonas } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM persona
       WHERE campamento_id = $1 AND esta_en_campamento = TRUE AND estado_salud != 'MUERTO'`,
      [campamento_id]
    );

    const totalPersonas = parseInt(countPersonas[0].total);
    const comidaProducida = parseFloat(produccion[0].comida);
    const aguaProducida = parseFloat(produccion[0].agua);

    const { rows: tipoComida } = await pool.query(
      `SELECT ib.tipo_recurso_id FROM itembodega ib
       JOIN tiporecurso tr ON tr.id = ib.tipo_recurso_id
       WHERE ib.bodega_id = $1 AND tr.nombre ILIKE '%comida%' LIMIT 1`,
      [bodega_id]
    );

    const { rows: tipoAgua } = await pool.query(
      `SELECT ib.tipo_recurso_id FROM itembodega ib
       JOIN tiporecurso tr ON tr.id = ib.tipo_recurso_id
       WHERE ib.bodega_id = $1 AND tr.nombre ILIKE '%agua%' LIMIT 1`,
      [bodega_id]
    );

<<<<<<< HEAD
   // solucionar antes en la bd, para que actualice los datos de la bodega
=======
    if (tipoComida.length > 0 && comidaProducida > 0) {
      await pool.query(
        `UPDATE itembodega SET cantidad_actual = cantidad_actual + $1
        WHERE bodega_id = $2 AND tipo_recurso_id = $3`,
        [comidaProducida, bodega_id, tipoComida[0].tipo_recurso_id]
      );
    }
>>>>>>> main

    if (tipoAgua.length > 0 && aguaProducida > 0) {
      await pool.query(
        `UPDATE itembodega SET cantidad_actual = cantidad_actual + $1
        WHERE bodega_id = $2 AND tipo_recurso_id = $3`,
        [aguaProducida, bodega_id, tipoAgua[0].tipo_recurso_id]
      );
    }

    if (tipoComida.length > 0 && totalPersonas > 0) {
      await pool.query(
        `UPDATE itembodega SET cantidad_actual = GREATEST(0, cantidad_actual - $1)
        WHERE bodega_id = $2 AND tipo_recurso_id = $3`,
        [totalPersonas, bodega_id, tipoComida[0].tipo_recurso_id]
      );
    }
    res.json({
      mensaje: "Consumo diario procesado correctamente",
      produccion: { comida: comidaProducida, agua: aguaProducida },
      consumo: { personas: totalPersonas },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error servidor" });
  }
};