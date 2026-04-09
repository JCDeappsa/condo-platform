import { Router } from 'express';
import { paymentsController } from './payments.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole, blockRole } from '../../common/auth.middleware';
import { recordPaymentSchema } from './payments.schema';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/payments:
 *   post:
 *     tags: [Pagos]
 *     summary: Registrar un pago (FIFO)
 */
router.post(
  '/',
  requireRole('administrator'),
  validate(recordPaymentSchema),
  asyncHandler(paymentsController.recordPayment)
);

/**
 * @openapi
 * /api/payments:
 *   get:
 *     tags: [Pagos]
 *     summary: Listar pagos
 */
router.get(
  '/',
  blockRole('maintenance'),
  asyncHandler(paymentsController.findAll)
);

/**
 * @openapi
 * /api/payments/{id}:
 *   get:
 *     tags: [Pagos]
 *     summary: Obtener pago por ID
 */
router.get(
  '/:id',
  blockRole('maintenance'),
  asyncHandler(paymentsController.findById)
);

/**
 * @openapi
 * /api/payments/movements/{unitId}:
 *   get:
 *     tags: [Pagos]
 *     summary: Obtener movimientos de cuenta de una unidad
 */
router.get(
  '/movements/:unitId',
  blockRole('maintenance'),
  asyncHandler(paymentsController.getMovements)
);

/**
 * @openapi
 * /api/payments/balance/{unitId}:
 *   get:
 *     tags: [Pagos]
 *     summary: Obtener saldo de una unidad
 */
router.get(
  '/balance/:unitId',
  blockRole('maintenance'),
  asyncHandler(paymentsController.getBalance)
);

// Update payment
router.patch(
  '/:id',
  requireRole('administrator'),
  asyncHandler(paymentsController.updatePayment)
);

// Delete single payment
router.delete(
  '/:id',
  requireRole('administrator'),
  asyncHandler(paymentsController.deletePayment)
);

// Bulk delete payments
router.post(
  '/bulk-delete',
  requireRole('administrator'),
  asyncHandler(paymentsController.deletePaymentsBulk)
);

export default router;
