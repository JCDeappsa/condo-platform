import { Router } from 'express';
import { metersController } from './meters.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole } from '../../common/auth.middleware';
import { createMeterTypeSchema, updateMeterTypeSchema, createMeterPointSchema, updateMeterPointSchema, recordReadingSchema } from './meters.schema';

const router = Router();
router.use(authMiddleware);

// ── Meter Types (admin) ──
router.post('/types', requireRole('administrator', 'board_member'), validate(createMeterTypeSchema), asyncHandler(metersController.createMeterType));
router.get('/types', requireRole('administrator', 'maintenance'), asyncHandler(metersController.findAllMeterTypes));
router.get('/types/:id', requireRole('administrator', 'maintenance'), asyncHandler(metersController.findMeterTypeById));
router.patch('/types/:id', requireRole('administrator', 'board_member'), validate(updateMeterTypeSchema), asyncHandler(metersController.updateMeterType));
router.delete('/types/:id', requireRole('administrator', 'board_member'), asyncHandler(metersController.deleteMeterType));

// ── Meter Points (admin) ──
router.post('/points', requireRole('administrator', 'board_member'), validate(createMeterPointSchema), asyncHandler(metersController.createMeterPoint));
router.get('/points', requireRole('administrator', 'maintenance'), asyncHandler(metersController.findAllMeterPoints));
router.get('/points/:id', requireRole('administrator', 'maintenance'), asyncHandler(metersController.findMeterPointById));
router.patch('/points/:id', requireRole('administrator', 'board_member'), validate(updateMeterPointSchema), asyncHandler(metersController.updateMeterPoint));

// ── Readings (maintenance can record) ──
router.post('/readings', requireRole('administrator', 'maintenance'), validate(recordReadingSchema), asyncHandler(metersController.recordReading));
router.get('/readings', requireRole('administrator', 'maintenance'), asyncHandler(metersController.findReadings));

export default router;
