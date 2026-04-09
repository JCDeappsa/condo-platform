import { Router } from 'express';
import { residentsController } from './residents.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware } from '../../common/auth.middleware';
import {
  createOrUpdateProfileSchema,
  createHouseholdMemberSchema,
  updateHouseholdMemberSchema,
  createVehicleSchema,
  updateVehicleSchema,
} from './residents.schema';

const router = Router();

// All resident routes require authentication
router.use(authMiddleware);

// ── Profile ──────────────────────────────────────────────
router.get('/profile/:userId', asyncHandler(residentsController.getProfile));
router.put('/profile/:userId', validate(createOrUpdateProfileSchema), asyncHandler(residentsController.updateProfile));

// ── Household Members ────────────────────────────────────
router.get('/profile/:userId/household', asyncHandler(residentsController.getHouseholdMembers));
router.post('/profile/:userId/household', validate(createHouseholdMemberSchema), asyncHandler(residentsController.createHouseholdMember));
router.patch('/household/:id', asyncHandler(residentsController.updateHouseholdMember));
router.delete('/household/:id', asyncHandler(residentsController.deleteHouseholdMember));

// ── Vehicles ─────────────────────────────────────────────
router.get('/profile/:userId/vehicles', asyncHandler(residentsController.getVehicles));
router.post('/profile/:userId/vehicles', validate(createVehicleSchema), asyncHandler(residentsController.createVehicle));
router.patch('/vehicles/:id', asyncHandler(residentsController.updateVehicle));
router.delete('/vehicles/:id', asyncHandler(residentsController.deleteVehicle));

export default router;
