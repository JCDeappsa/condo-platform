import { Router } from 'express';
import { billingController } from './billing.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole, blockRole } from '../../common/auth.middleware';
import { generateChargesSchema, createSpecialChargeSchema, updateChargeSchema, deleteChargesBulkSchema } from './billing.schema';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/billing/generate:
 *   post:
 *     tags: [Cobros]
 *     summary: Generar cobros mensuales en lote
 */
router.post(
  '/generate',
  requireRole('administrator', 'board_member'),
  validate(generateChargesSchema),
  asyncHandler(billingController.generateCharges)
);

/**
 * @openapi
 * /api/billing/special:
 *   post:
 *     tags: [Cobros]
 *     summary: Crear cobro extraordinario
 */
router.post(
  '/special',
  requireRole('administrator', 'board_member'),
  validate(createSpecialChargeSchema),
  asyncHandler(billingController.createSpecialCharge)
);

/**
 * @openapi
 * /api/billing/charges:
 *   get:
 *     tags: [Cobros]
 *     summary: Listar cobros
 */
router.get(
  '/charges',
  blockRole('maintenance'),
  asyncHandler(billingController.findCharges)
);

/**
 * @openapi
 * /api/billing/charges/{id}:
 *   get:
 *     tags: [Cobros]
 *     summary: Obtener cobro por ID
 */
router.get(
  '/charges/:id',
  blockRole('maintenance'),
  asyncHandler(billingController.findChargeById)
);

/**
 * @openapi
 * /api/billing/charges/{id}:
 *   patch:
 *     tags: [Cobros]
 *     summary: Actualizar cobro
 */
router.patch(
  '/charges/:id',
  requireRole('administrator', 'board_member'),
  validate(updateChargeSchema),
  asyncHandler(billingController.updateCharge)
);

/**
 * @openapi
 * /api/billing/mark-overdue:
 *   post:
 *     tags: [Cobros]
 *     summary: Marcar cobros vencidos
 */
router.post(
  '/mark-overdue',
  requireRole('administrator', 'board_member'),
  asyncHandler(billingController.markOverdue)
);

// Delete single charge
router.delete(
  '/charges/:id',
  requireRole('administrator', 'board_member'),
  asyncHandler(billingController.deleteCharge)
);

// Delete multiple charges
router.post(
  '/charges/bulk-delete',
  requireRole('administrator', 'board_member'),
  validate(deleteChargesBulkSchema),
  asyncHandler(billingController.deleteChargesBulk)
);

export default router;
