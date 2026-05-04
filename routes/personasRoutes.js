import express from "express";
import { verifyToken, verifyRol } from "../middleware/auth.js";
import {
  getPersonas,
  addPersona,
  updateEstadoPersona,
  moverPersonaRol,
  getPersonaById,
  getCargosPersona,
  asignarCargoIA,
} from "../controllers/personasController.js";

const router = express.Router();

router.get("/", verifyToken, verifyRol("ADMIN", "ENCARGADO_VIAJES"), getPersonas);
router.post("/", verifyToken, verifyRol("ADMIN"), addPersona);
router.get("/:id", verifyToken, verifyRol("ADMIN"), getPersonaById);
router.get("/:id/cargo", verifyToken, verifyRol("ADMIN"), getCargosPersona);
router.patch("/:id/estado", verifyToken, verifyRol("ADMIN"), updateEstadoPersona);
router.patch("/:id/cargo", verifyToken, verifyRol("ADMIN"), moverPersonaRol);
router.post("/:id/cargo-ia", verifyToken, verifyRol("ADMIN"), asignarCargoIA);

export default router;