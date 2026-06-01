import express from "express";
import { verifyToken, verifyRol } from "../middleware/auth.js";
import { analizarIngreso, asignarCargo } from "../controllers/iaController.js";

const router = express.Router();

router.post("/analizar-ingreso", verifyToken, verifyRol("ADMIN"), analizarIngreso);
router.post("/analizar-ingreso", verifyToken, verifyRol("ADMIN"), analizarIngreso);
router.post("/asignar-cargo",    verifyToken, verifyRol("ADMIN"), asignarCargo);

export default router;