import { Router } from 'express';
import { maintenanceController } from './maintenance.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole } from '../../common/auth.middleware';
import { createTicketSchema, updateTicketSchema, addUpdateSchema, reportWarningSchema } from './maintenance.schema';

const router = Router();
router.use(authMiddleware);

// My tasks (maintenance role)
router.get('/my-tasks', requireRole('maintenance'), asyncHandler(maintenanceController.findMyTasks));

// Report warning (maintenance shortcut)
router.post('/report-warning', requireRole('maintenance', 'administrator'), validate(reportWarningSchema), asyncHandler(maintenanceController.reportWarning));

// List all tickets
router.get('/', asyncHandler(maintenanceController.findAll));

// Get ticket by ID
router.get('/:id', asyncHandler(maintenanceController.findById));

// Create ticket (any authenticated user)
router.post('/', validate(createTicketSchema), asyncHandler(maintenanceController.create));

// Update ticket
router.patch('/:id', requireRole('administrator', 'maintenance'), validate(updateTicketSchema), asyncHandler(maintenanceController.update));

// Add update/comment to ticket
router.post('/:id/updates', validate(addUpdateSchema), asyncHandler(maintenanceController.addUpdate));

export default router;
