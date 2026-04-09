import { Router } from 'express';
import { documentsController } from './documents.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole } from '../../common/auth.middleware';
import { createDocumentSchema, updateDocumentSchema } from './documents.schema';

const router = Router();
router.use(authMiddleware);

// All authenticated users can list/read (filtered by visibility)
router.get('/', asyncHandler(documentsController.findAll));
router.get('/:id', asyncHandler(documentsController.findById));

// Admin uploads/manages
router.post('/', requireRole('administrator'), validate(createDocumentSchema), asyncHandler(documentsController.create));
router.patch('/:id', requireRole('administrator'), validate(updateDocumentSchema), asyncHandler(documentsController.update));
router.delete('/:id', requireRole('administrator'), asyncHandler(documentsController.delete));

export default router;
