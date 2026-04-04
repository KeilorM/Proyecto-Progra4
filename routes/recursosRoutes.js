import express from "express";
import { verifyToken, verifyRol } from "../middleware/auth.js";
import {
  getBodega,
  registrarMovimiento,
  getAlertas,
  getMovimientos,
} from "../controllers/recursosController.js";

const router = express.Router();

// GESTOR_RECURSOS y ADMIN pueden ver la bodega
router.get("/", verifyToken, verifyRol("ADMIN", "GESTOR_RECURSOS"), getBodega);

// solo GESTOR_RECURSOS registra entradas y salidas
router.post("/movimiento", verifyToken, verifyRol("GESTOR_RECURSOS"), registrarMovimiento);

// alertas de recursos bajo mínimo
router.get("/alertas", verifyToken, verifyRol("ADMIN", "GESTOR_RECURSOS"), getAlertas);

// historial de movimientos de la bodega
router.get("/movimientos", verifyToken, verifyRol("ADMIN", "GESTOR_RECURSOS"), getMovimientos);

export default router;