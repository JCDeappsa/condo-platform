import { Router } from 'express';
import { unitsController } from './units.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole, blockRole } from '../../common/auth.middleware';
import { createUnitSchema, updateUnitSchema } from './units.schema';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/units:
 *   get:
 *     tags: [Unidades]
 *     summary: Listar todas las unidades
 */
router.get(
  '/',
  blockRole('maintenance'),
  asyncHandler(unitsController.findAll)
);

/**
 * @openapi
 * /api/units/my-unit:
 *   get:
 *     tags: [Unidades]
 *     summary: Obtener mi unidad (residente)
 */
router.get(
  '/my-unit',
  requireRole('resident', 'owner'),
  asyncHandler(unitsController.findMyUnit)
);

/**
 * @openapi
 * /api/units/{id}:
 *   get:
 *     tags: [Unidades]
 *     summary: Obtener unidad por ID
 */
router.get(
  '/:id',
  blockRole('maintenance'),
  asyncHandler(unitsController.findById)
);

/**
 * @openapi
 * /api/units:
 *   post:
 *     tags: [Unidades]
 *     summary: Crear unidad
 */
router.post(
  '/',
  requireRole('administrator', 'board_member'),
  validate(createUnitSchema),
  asyncHandler(unitsController.create)
);

/**
 * @openapi
 * /api/units/{id}:
 *   patch:
 *     tags: [Unidades]
 *     summary: Actualizar unidad
 */
router.patch(
  '/:id',
  requireRole('administrator', 'board_member'),
  validate(updateUnitSchema),
  asyncHandler(unitsController.update)
);

/**
 * @openapi
 * /api/units/{id}:
 *   delete:
 *     tags: [Unidades]
 *     summary: Eliminar unidad
 */
router.delete(
  '/:id',
  requireRole('administrator', 'board_member'),
  asyncHandler(unitsController.delete)
);

export default router;
