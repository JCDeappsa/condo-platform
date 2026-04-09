import { Op } from 'sequelize';
import { AuditLog } from './audit-logs.model';
import { User } from '../users/users.model';

export class AuditLogsService {
  async createLog(data: {
    userId?: string | null;
    action: string;
    entityType: string;
    entityId?: string | null;
    oldValues?: object | null;
    newValues?: object | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    return AuditLog.create({
      userId: data.userId || null,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId || null,
      oldValues: data.oldValues || null,
      newValues: data.newValues || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    });
  }

  async search(filters: {
    userId?: string; action?: string; entityType?: string; entityId?: string;
    from?: Date; to?: Date;
  }, page: number, limit: number) {
    const where: any = {};
    if (filters.userId) where.userId = filters.userId;
    if (filters.action) where.action = filters.action;
    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId) where.entityId = filters.entityId;
    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) where.createdAt[Op.gte] = filters.from;
      if (filters.to) where.createdAt[Op.lte] = filters.to;
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await AuditLog.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email'] }],
      order: [['created_at', 'DESC']],
      limit, offset,
    });
    return { logs: rows, total: count };
  }
}

export const auditLogsService = new AuditLogsService();
