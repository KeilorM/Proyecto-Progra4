import express from "express";
import { verifyToken, verifyRol } from "../middleware/auth.js";
import {
  getPersonas,
  addPersona,
  updateEstadoPersona,
  moverPersonaRol,
} from "../controllers/personasController.js";

const router = express.Router();


router.get("/", verifyToken, verifyRol("ADMIN"), getPersonas);
router.post("/", verifyToken, verifyRol("ADMIN"), addPersona);


router.patch("/:id/estado", verifyToken, verifyRol("ADMIN"), updateEstadoPersona);

router.patch("/:id/cargo", verifyToken, verifyRol("ADMIN"), moverPersonaRol);

export default router;