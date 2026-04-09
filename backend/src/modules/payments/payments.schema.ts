import Joi from 'joi';

export const recordPaymentSchema = Joi.object({
  unitId: Joi.string().uuid().required().messages({
    'any.required': 'La unidad es requerida',
  }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'El monto es requerido',
    'number.positive': 'El monto debe ser positivo',
  }),
  paymentDate: Joi.date().required().messages({
    'any.required': 'La fecha de pago es requerida',
  }),
  paymentMethod: Joi.string()
    .valid('bank_transfer', 'cash', 'check', 'online')
    .default('bank_transfer'),
  referenceNumber: Joi.string().max(100).allow(null, ''),
  bankReference: Joi.string().max(100).allow(null, ''),
  notes: Joi.string().allow(null, ''),
});

export const paymentQuerySchema = Joi.object({
  unitId: Joi.string().uuid(),
  from: Joi.date(),
  to: Joi.date(),
  reconciled: Joi.boolean(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});
