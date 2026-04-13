import express from "express";
import { verifyToken, verifyRol } from "../middleware/auth.js";
import {
  getTiposRecurso,
  getCargos,
  getSolicitudesRecibidas,
  getSolicitudesEnviadas,
  getTraslados,
  getDashboard,
} from "../controllers/catalogosController.js";

const router = express.Router();

router.get("/tipos-recurso", verifyToken, getTiposRecurso);
router.get("/cargos", verifyToken, getCargos);
router.get("/dashboard", verifyToken, verifyRol("ADMIN", "GESTOR_RECURSOS"), getDashboard);
router.get("/solicitudes/recibidas", verifyToken, verifyRol("ADMIN", "ENCARGADO_VIAJES"), getSolicitudesRecibidas);
router.get("/solicitudes/enviadas", verifyToken, verifyRol("ADMIN", "ENCARGADO_VIAJES"), getSolicitudesEnviadas);
router.get("/traslados", verifyToken, verifyRol("ADMIN", "ENCARGADO_VIAJES", "GESTOR_RECURSOS"), getTraslados);

export default router;