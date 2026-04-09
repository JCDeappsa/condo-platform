import Joi from 'joi';

export const generateChargesSchema = Joi.object({
  period: Joi.string()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
    .required()
    .messages({
      'string.pattern.base': 'El período debe tener el formato YYYY-MM',
      'any.required': 'El período es requerido',
    }),
  dueDate: Joi.date().required().messages({
    'any.required': 'La fecha de vencimiento es requerida',
  }),
  description: Joi.string().max(255).default('Cuota Mensual'),
  amountOverride: Joi.number().positive().allow(null),
});

export const createSpecialChargeSchema = Joi.object({
  unitId: Joi.string().uuid().required().messages({
    'any.required': 'La unidad es requerida',
  }),
  period: Joi.string()
    .pattern(/^\d{4}-(0[1-9]|1[0-2])$/)
    .required(),
  description: Joi.string().max(255).required().messages({
    'any.required': 'La descripción es requerida',
  }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'El monto es requerido',
  }),
  dueDate: Joi.date().required(),
});

export const updateChargeSchema = Joi.object({
  amount: Joi.number().positive(),
  description: Joi.string().max(255),
  dueDate: Joi.date(),
  status: Joi.string().valid('pending', 'partial', 'paid', 'overdue', 'cancelled'),
}).min(1);

export const deleteChargesBulkSchema = Joi.object({
  ids: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.min': 'Debe seleccionar al menos un cobro',
    'any.required': 'Los IDs son requeridos',
  }),
});
