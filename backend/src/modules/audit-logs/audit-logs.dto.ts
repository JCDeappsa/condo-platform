import { AuditLog } from './audit-logs.model';

export function toAuditLogDTO(log: AuditLog) {
  return {
    id: log.id,
    userId: log.userId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    oldValues: log.oldValues,
    newValues: log.newValues,
    ipAddress: log.ipAddress,
    userAgent: log.userAgent,
    user: log.user ? { id: log.user.id, firstName: log.user.firstName, lastName: log.user.lastName, email: log.user.email } : null,
    createdAt: log.createdAt,
  };
}

export function toAuditLogListDTO(logs: AuditLog[]) {
  return logs.map(toAuditLogDTO);
}
