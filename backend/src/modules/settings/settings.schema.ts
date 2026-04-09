import Joi from 'joi';

export const createChargeConceptSchema = Joi.object({
  name: Joi.string().max(100).required(),
  description: Joi.string().allow(null, '').optional(),
  defaultAmount: Joi.number().min(0).required(),
  isPercentage: Joi.boolean().optional().default(false),
  percentageValue: Joi.number().min(0).max(100).allow(null).optional(),
  frequency: Joi.string().valid('monthly', 'one_time', 'annual', 'on_demand').required(),
  sortOrder: Joi.number().integer().min(0).optional().default(0),
});

export const updateChargeConceptSchema = Joi.object({
  name: Joi.string().max(100).optional(),
  description: Joi.string().allow(null, '').optional(),
  defaultAmount: Joi.number().min(0).optional(),
  isPercentage: Joi.boolean().optional(),
  percentageValue: Joi.number().min(0).max(100).allow(null).optional(),
  frequency: Joi.string().valid('monthly', 'one_time', 'annual', 'on_demand').optional(),
  isActive: Joi.boolean().optional(),
  sortOrder: Joi.number().integer().min(0).optional(),
}).min(1);
