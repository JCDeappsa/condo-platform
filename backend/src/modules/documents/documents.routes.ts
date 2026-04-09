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
router.post('/', requireRole('administrator', 'board_member'), validate(createDocumentSchema), asyncHandler(documentsController.create));
router.patch('/:id', requireRole('administrator', 'board_member'), validate(updateDocumentSchema), asyncHandler(documentsController.update));
router.delete('/:id', requireRole('administrator', 'board_member'), asyncHandler(documentsController.delete));

export default router;
