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
router.post('/refresh', requireRole('administrator', 'board_member'), asyncHandler(collectionsController.refreshStatuses));

// Run notification engine
router.post('/engine/run', requireRole('administrator', 'board_member'), asyncHandler(collectionsController.runEngine));

// Promises
router.post('/promises', requireRole('administrator', 'board_member'), validate(createPromiseSchema), asyncHandler(collectionsController.createPromise));
router.patch('/promises/:id', requireRole('administrator', 'board_member'), validate(updatePromiseSchema), asyncHandler(collectionsController.updatePromise));

// Notes
router.post('/notes', requireRole('administrator', 'board_member'), validate(addNoteSchema), asyncHandler(collectionsController.addNote));

// Templates
router.get('/templates', asyncHandler(collectionsController.getTemplates));
router.patch('/templates/:id', requireRole('administrator', 'board_member'), validate(updateTemplateSchema), asyncHandler(collectionsController.updateTemplate));

// Rules
router.get('/rules', asyncHandler(collectionsController.getRules));
router.post('/rules', requireRole('administrator', 'board_member'), validate(createRuleSchema), asyncHandler(collectionsController.createRule));
router.patch('/rules/:id', requireRole('administrator', 'board_member'), validate(updateRuleSchema), asyncHandler(collectionsController.updateRule));

export default router;
