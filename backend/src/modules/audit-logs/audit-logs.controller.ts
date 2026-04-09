import { Request, Response } from 'express';
import { auditLogsService } from './audit-logs.service';
import { toAuditLogListDTO } from './audit-logs.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';

export class AuditLogsController {
  async search(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const filters = {
      userId: req.query.userId as string | undefined,
      action: req.query.action as string | undefined,
      entityType: req.query.entityType as string | undefined,
      entityId: req.query.entityId as string | undefined,
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: req.query.to ? new Date(req.query.to as string) : undefined,
    };
    const { logs, total } = await auditLogsService.search(filters, page, limit);
    res.json(buildPaginatedResponse(toAuditLogListDTO(logs), total, { page, limit, offset: (page - 1) * limit }));
  }
}

export const auditLogsController = new AuditLogsController();
