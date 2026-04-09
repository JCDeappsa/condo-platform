import { Router } from 'express';
import { announcementsController } from './announcements.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole } from '../../common/auth.middleware';
import { createAnnouncementSchema, updateAnnouncementSchema } from './announcements.schema';

const router = Router();
router.use(authMiddleware);

// Published announcements (all roles)
router.get('/published', asyncHandler(announcementsController.findPublished));

// All announcements (admin/board)
router.get('/', requireRole('administrator', 'board_member'), asyncHandler(announcementsController.findAll));
router.get('/:id', asyncHandler(announcementsController.findById));

// Create/update/delete (admin/board)
router.post('/', requireRole('administrator', 'board_member'), validate(createAnnouncementSchema), asyncHandler(announcementsController.create));
router.patch('/:id', requireRole('administrator', 'board_member'), validate(updateAnnouncementSchema), asyncHandler(announcementsController.update));
router.delete('/:id', requireRole('administrator', 'board_member'), asyncHandler(announcementsController.delete));

export default router;
