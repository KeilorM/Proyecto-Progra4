import express from "express";
import { verifyToken, verifyRol } from "../middleware/auth.js";
import { getMetricas } from "../controllers/dashboardController.js";

const router = express.Router();
router.get("/metricas", verifyToken, verifyRol("ADMIN", "GESTOR_RECURSOS"), getMetricas);
export default router;