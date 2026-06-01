import express from 'express'
import { verifyToken, verifyRol } from '../middleware/auth.js'
import {
  getBodega,
  registrarMovimiento,
  getAlertas,
  getMovimientos,
  getBodegaResumen,
  procesarConsumoDiario,
} from '../controllers/recursosController.js'

const router = express.Router()

router.get(
  '/',
  verifyToken,
  verifyRol('ADMIN', 'GESTOR_RECURSOS', 'TRABAJADOR', 'ENCARGADO_VIAJES'),
  getBodega
)
router.get('/resumen', verifyToken, verifyRol('ADMIN', 'GESTOR_RECURSOS'), getBodegaResumen)
router.post('/movimiento', verifyToken, verifyRol('GESTOR_RECURSOS'), registrarMovimiento)
router.get('/alertas', verifyToken, verifyRol('ADMIN', 'GESTOR_RECURSOS', 'TRABAJADOR'), getAlertas)
router.get('/movimientos', verifyToken, verifyRol('ADMIN', 'GESTOR_RECURSOS'), getMovimientos)
router.post('/consumo-diario', verifyToken, verifyRol('ADMIN'), procesarConsumoDiario)

export default router
