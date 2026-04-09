import { Router } from 'express';
import { collectionsController } from './collections.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole, blockRole } from '../../common/auth.middleware';
import { createPromiseSchema, updatePromiseSchema, addNoteSchema, createRuleSchema, updateRuleSchema, updateTemplateSchema } from './collections.schema';

const router = Router();

router.use(authMiddleware);
router.use(blockRole('maintenance'));

// Collection statuses
router.get('/status', asyncHandler(collectionsController.getStatuses));
router.get('/unit/:unitId', asyncHandler(collectionsController.getUnitTimeline));

// Refresh statuses
router.post('/refresh', requireRole('administrator'), asyncHandler(collectionsController.refreshStatuses));

// Run notification engine
router.post('/engine/run', requireRole('administrator'), asyncHandler(collectionsController.runEngine));

// Promises
router.post('/promises', requireRole('administrator'), validate(createPromiseSchema), asyncHandler(collectionsController.createPromise));
router.patch('/promises/:id', requireRole('administrator'), validate(updatePromiseSchema), asyncHandler(collectionsController.updatePromise));

// Notes
router.post('/notes', requireRole('administrator'), validate(addNoteSchema), asyncHandler(collectionsController.addNote));

// Templates
router.get('/templates', asyncHandler(collectionsController.getTemplates));
router.patch('/templates/:id', requireRole('administrator'), validate(updateTemplateSchema), asyncHandler(collectionsController.updateTemplate));

// Rules
router.get('/rules', asyncHandler(collectionsController.getRules));
router.post('/rules', requireRole('administrator'), validate(createRuleSchema), asyncHandler(collectionsController.createRule));
router.patch('/rules/:id', requireRole('administrator'), validate(updateRuleSchema), asyncHandler(collectionsController.updateRule));

export default router;
