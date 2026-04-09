import { Router } from 'express';
import { projectsController } from './projects.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole } from '../../common/auth.middleware';
import { createProjectSchema, updateProjectSchema, addProjectUpdateSchema } from './projects.schema';

const router = Router();
router.use(authMiddleware);

// Admin creates/updates projects
router.post('/', requireRole('administrator'), validate(createProjectSchema), asyncHandler(projectsController.create));
router.get('/', requireRole('administrator', 'board_member'), asyncHandler(projectsController.findAll));
router.get('/:id', requireRole('administrator', 'board_member'), asyncHandler(projectsController.findById));
router.patch('/:id', requireRole('administrator'), validate(updateProjectSchema), asyncHandler(projectsController.update));
router.delete('/:id', requireRole('administrator'), asyncHandler(projectsController.delete));

// Project updates
router.post('/:id/updates', requireRole('administrator', 'board_member'), validate(addProjectUpdateSchema), asyncHandler(projectsController.addUpdate));

export default router;
