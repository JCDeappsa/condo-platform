import { Router } from 'express';
import { settingsController } from './settings.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole } from '../../common/auth.middleware';
import { createChargeConceptSchema, updateChargeConceptSchema } from './settings.schema';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/settings/charge-concepts:
 *   get:
 *     tags: [Configuracion]
 *     summary: Listar conceptos de cobro
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de conceptos de cobro
 */
router.get(
  '/charge-concepts',
  requireRole('administrator', 'board_member'),
  asyncHandler(settingsController.listChargeConcepts)
);

/**
 * @openapi
 * /api/settings/charge-concepts:
 *   post:
 *     tags: [Configuracion]
 *     summary: Crear concepto de cobro
 */
router.post(
  '/charge-concepts',
  requireRole('administrator', 'board_member'),
  validate(createChargeConceptSchema),
  asyncHandler(settingsController.createChargeConcept)
);

/**
 * @openapi
 * /api/settings/charge-concepts/{id}:
 *   patch:
 *     tags: [Configuracion]
 *     summary: Actualizar concepto de cobro
 */
router.patch(
  '/charge-concepts/:id',
  requireRole('administrator', 'board_member'),
  validate(updateChargeConceptSchema),
  asyncHandler(settingsController.updateChargeConcept)
);

/**
 * @openapi
 * /api/settings/charge-concepts/{id}:
 *   delete:
 *     tags: [Configuracion]
 *     summary: Desactivar concepto de cobro
 */
router.delete(
  '/charge-concepts/:id',
  requireRole('administrator', 'board_member'),
  asyncHandler(settingsController.deleteChargeConcept)
);

export default router;
