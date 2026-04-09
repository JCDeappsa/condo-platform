import Joi from 'joi';

export const createUnitSchema = Joi.object({
  unitNumber: Joi.string().max(20).required().messages({
    'any.required': 'El número de unidad es requerido',
  }),
  unitType: Joi.string()
    .valid('house', 'guard_house', 'maintenance_yard', 'clubhouse', 'visitor_parking')
    .default('house'),
  address: Joi.string().allow(null, ''),
  areaM2: Joi.number().positive().allow(null),
  ownerUserId: Joi.string().uuid().allow(null),
  residentUserId: Joi.string().uuid().allow(null),
  isOccupied: Joi.boolean().default(false),
  monthlyFee: Joi.number().min(0).required().messages({
    'any.required': 'La cuota mensual es requerida',
  }),
  notes: Joi.string().allow(null, ''),
});

export const updateUnitSchema = Joi.object({
  unitNumber: Joi.string().max(20),
  unitType: Joi.string().valid('house', 'guard_house', 'maintenance_yard', 'clubhouse', 'visitor_parking'),
  address: Joi.string().allow(null, ''),
  areaM2: Joi.number().positive().allow(null),
  ownerUserId: Joi.string().uuid().allow(null),
  residentUserId: Joi.string().uuid().allow(null),
  isOccupied: Joi.boolean(),
  monthlyFee: Joi.number().min(0),
  notes: Joi.string().allow(null, ''),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
});
