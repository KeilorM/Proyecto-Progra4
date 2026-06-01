import express from 'express'
import { verifyToken, verifyRol } from '../middleware/auth.js'
import {
  getCampamentos,
  crearSolicitud,
  responderSolicitud,
  getExploraciones,
  crearExploracion,
  completarExploracion,
  aprobarSalidaTraslado,
  aprobarLlegadaTraslado,
} from '../controllers/campamentosController.js'

const router = express.Router()

router.get('/', verifyToken, getCampamentos)
router.post('/solicitud', verifyToken, verifyRol('ADMIN', 'ENCARGADO_VIAJES'), crearSolicitud)
router.patch(
  '/solicitud/:id',
  verifyToken,
  verifyRol('ADMIN', 'ENCARGADO_VIAJES'),
  responderSolicitud
)
router.get('/exploraciones', verifyToken, verifyRol('ADMIN', 'ENCARGADO_VIAJES'), getExploraciones)
router.post('/exploraciones', verifyToken, verifyRol('ADMIN', 'ENCARGADO_VIAJES'), crearExploracion)
router.patch(
  '/exploraciones/:id/completar',
  verifyToken,
  verifyRol('ADMIN', 'ENCARGADO_VIAJES'),
  completarExploracion
)
router.patch(
  '/traslados/:id/salida',
  verifyToken,
  verifyRol('ADMIN', 'ENCARGADO_VIAJES'),
  aprobarSalidaTraslado
)
router.patch(
  '/traslados/:id/llegada',
  verifyToken,
  verifyRol('ADMIN', 'ENCARGADO_VIAJES'),
  aprobarLlegadaTraslado
)

export default router
