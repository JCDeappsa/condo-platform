import Joi from 'joi';

export const createTicketSchema = Joi.object({
  title: Joi.string().max(255).required(),
  description: Joi.string().allow(null, ''),
  category: Joi.string().valid('plumbing', 'electrical', 'structural', 'landscape', 'general', 'security').default('general'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  location: Joi.string().max(255).allow(null, ''),
  assignedTo: Joi.string().uuid().allow(null),
  unitId: Joi.string().uuid().allow(null),
  dueDate: Joi.date().allow(null),
});

export const updateTicketSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().allow(null, ''),
  category: Joi.string().valid('plumbing', 'electrical', 'structural', 'landscape', 'general', 'security'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
  status: Joi.string().valid('open', 'in_progress', 'pending_parts', 'completed', 'cancelled'),
  location: Joi.string().max(255).allow(null, ''),
  assignedTo: Joi.string().uuid().allow(null),
  dueDate: Joi.date().allow(null),
  closingNotes: Joi.string().allow(null, ''),
  materialsUsed: Joi.string().allow(null, ''),
  laborHours: Joi.number().min(0).allow(null),
}).min(1);

export const addUpdateSchema = Joi.object({
  comment: Joi.string().allow(null, ''),
  statusChangeTo: Joi.string().valid('open', 'in_progress', 'pending_parts', 'completed', 'cancelled').allow(null),
  closingNotes: Joi.string().allow(null, ''),
});

export const reportWarningSchema = Joi.object({
  location: Joi.string().max(255).required(),
  category: Joi.string().valid('plumbing', 'electrical', 'structural', 'landscape', 'general', 'security').default('general'),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  description: Joi.string().required(),
  immediateRisk: Joi.boolean().default(false),
});
