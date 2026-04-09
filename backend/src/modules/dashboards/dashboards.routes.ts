import { Router } from 'express';
import { dashboardsController } from './dashboards.controller';
import { asyncHandler } from '../../common/error.handler';
import { authMiddleware, requireRole } from '../../common/auth.middleware';

const router = Router();
router.use(authMiddleware);

router.get('/admin', requireRole('administrator', 'board_member'), asyncHandler(dashboardsController.adminDashboard));
router.get('/resident', requireRole('resident', 'owner', 'administrator', 'board_member'), asyncHandler(dashboardsController.residentDashboard));
router.get('/maintenance', requireRole('maintenance', 'administrator'), asyncHandler(dashboardsController.maintenanceDashboard));

export default router;
