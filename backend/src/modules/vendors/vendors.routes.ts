import { Router } from 'express';
import { vendorsController } from './vendors.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole } from '../../common/auth.middleware';
import { createVendorSchema, updateVendorSchema, createExpenseSchema, updateExpenseSchema } from './vendors.schema';

const router = Router();
router.use(authMiddleware);
router.use(requireRole('administrator', 'board_member'));

// ── Vendors ──
router.post('/vendors', validate(createVendorSchema), asyncHandler(vendorsController.createVendor));
router.get('/vendors', asyncHandler(vendorsController.findAllVendors));
router.get('/vendors/:id', asyncHandler(vendorsController.findVendorById));
router.patch('/vendors/:id', validate(updateVendorSchema), asyncHandler(vendorsController.updateVendor));
router.delete('/vendors/:id', asyncHandler(vendorsController.deleteVendor));

// ── Expenses ──
router.post('/expenses', validate(createExpenseSchema), asyncHandler(vendorsController.createExpense));
router.get('/expenses', asyncHandler(vendorsController.findAllExpenses));
router.get('/expenses/:id', asyncHandler(vendorsController.findExpenseById));
router.patch('/expenses/:id', validate(updateExpenseSchema), asyncHandler(vendorsController.updateExpense));
router.delete('/expenses/:id', asyncHandler(vendorsController.deleteExpense));

export default router;
