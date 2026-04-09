import Joi from 'joi';

export const createPromiseSchema = Joi.object({
  unitId: Joi.string().uuid().required(),
  promisedAmount: Joi.number().positive().required(),
  promisedDate: Joi.date().required(),
  notes: Joi.string().allow(null, ''),
});

export const updatePromiseSchema = Joi.object({
  status: Joi.string().valid('fulfilled', 'broken', 'cancelled').required(),
});

export const addNoteSchema = Joi.object({
  unitId: Joi.string().uuid().required(),
  note: Joi.string().required().messages({ 'any.required': 'La nota es requerida' }),
});

export const updateRuleSchema = Joi.object({
  name: Joi.string().max(100),
  daysOverdue: Joi.number().integer().min(0),
  templateId: Joi.string().uuid(),
  cooldownHours: Joi.number().integer().min(1),
  requiresApproval: Joi.boolean(),
  isActive: Joi.boolean(),
  sortOrder: Joi.number().integer(),
}).min(1);

export const createRuleSchema = Joi.object({
  name: Joi.string().max(100).required(),
  triggerType: Joi.string().valid('days_overdue', 'payment_received', 'promise_expired').default('days_overdue'),
  daysOverdue: Joi.number().integer().min(0),
  templateId: Joi.string().uuid().required(),
  cooldownHours: Joi.number().integer().min(1).default(168),
  requiresApproval: Joi.boolean().default(false),
  isActive: Joi.boolean().default(true),
  sortOrder: Joi.number().integer().default(0),
});

export const updateTemplateSchema = Joi.object({
  name: Joi.string().max(100),
  subject: Joi.string().max(255),
  bodyHtml: Joi.string(),
  bodyText: Joi.string().allow(null, ''),
  channel: Joi.string().valid('email', 'sms', 'in_app'),
  isActive: Joi.boolean(),
}).min(1);
