import express from "express";
import { verifyToken, verifyRol } from "../middleware/auth.js";
import { analizarIngreso } from "../controllers/iaController.js";

const router = express.Router();

router.post("/analizar-ingreso", verifyToken, verifyRol("ADMIN"), analizarIngreso);

export default router;
