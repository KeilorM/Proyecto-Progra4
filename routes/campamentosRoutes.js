import express from "express";
import { verifyToken, verifyRol } from "../middleware/auth.js";
import {
  getCampamentos,
  crearSolicitud,
  responderSolicitud,
  getExploraciones,
  crearExploracion,
  completarExploracion,
} from "../controllers/campamentosController.js";

const router = express.Router();

// cualquier usuario autenticado puede ver los campamentos
router.get("/", verifyToken, getCampamentos);

// solicitudes entre campamentos - solo ENCARGADO_VIAJES
router.post("/solicitud", verifyToken, verifyRol("ENCARGADO_VIAJES"), crearSolicitud);
router.patch("/solicitud/:id", verifyToken, verifyRol("ADMIN"), responderSolicitud);

// exploraciones - solo ENCARGADO_VIAJES
router.get("/exploraciones", verifyToken, verifyRol("ENCARGADO_VIAJES", "ADMIN"), getExploraciones);
router.post("/exploraciones", verifyToken, verifyRol("ENCARGADO_VIAJES"), crearExploracion);
router.patch("/exploraciones/:id/completar", verifyToken, verifyRol("ENCARGADO_VIAJES"), completarExploracion);

export default router;