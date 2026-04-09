import { Router } from 'express';
import { auditLogsController } from './audit-logs.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole } from '../../common/auth.middleware';
import { searchAuditLogsSchema } from './audit-logs.schema';

const router = Router();
router.use(authMiddleware);

router.get('/', requireRole('administrator', 'board_member'), validate(searchAuditLogsSchema, 'query'), asyncHandler(auditLogsController.search));

export default router;
