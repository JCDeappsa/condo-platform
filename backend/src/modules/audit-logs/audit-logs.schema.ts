import Joi from 'joi';

export const searchAuditLogsSchema = Joi.object({
  userId: Joi.string().uuid(),
  action: Joi.string().max(100),
  entityType: Joi.string().max(100),
  entityId: Joi.string().uuid(),
  from: Joi.date(),
  to: Joi.date(),
  page: Joi.number().integer().min(1),
  limit: Joi.number().integer().min(1).max(100),
});
