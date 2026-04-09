import Joi from 'joi';

export const createMeterTypeSchema = Joi.object({
  name: Joi.string().max(100).required().messages({
    'any.required': 'El nombre del tipo de medidor es requerido',
  }),
  unitOfMeasure: Joi.string().max(50).required().messages({
    'any.required': 'La unidad de medida es requerida',
  }),
  anomalyThresholdPct: Joi.number().min(0).max(1000).default(50),
});

export const updateMeterTypeSchema = Joi.object({
  name: Joi.string().max(100),
  unitOfMeasure: Joi.string().max(50),
  anomalyThresholdPct: Joi.number().min(0).max(1000),
}).min(1);

export const createMeterPointSchema = Joi.object({
  unitId: Joi.string().uuid().required().messages({
    'any.required': 'La unidad es requerida',
  }),
  meterTypeId: Joi.string().uuid().required().messages({
    'any.required': 'El tipo de medidor es requerido',
  }),
  meterSerial: Joi.string().max(100).required().messages({
    'any.required': 'El serial del medidor es requerido',
  }),
  locationDescription: Joi.string().max(255).allow(null, ''),
  isActive: Joi.boolean().default(true),
});

export const updateMeterPointSchema = Joi.object({
  meterSerial: Joi.string().max(100),
  locationDescription: Joi.string().max(255).allow(null, ''),
  isActive: Joi.boolean(),
}).min(1);

export const recordReadingSchema = Joi.object({
  meterPointId: Joi.string().uuid().required().messages({
    'any.required': 'El punto de medición es requerido',
  }),
  readingValue: Joi.number().min(0).required().messages({
    'any.required': 'El valor de lectura es requerido',
  }),
  readingDate: Joi.date().required().messages({
    'any.required': 'La fecha de lectura es requerida',
  }),
  photoUrl: Joi.string().uri().allow(null, ''),
  anomalyNotes: Joi.string().allow(null, ''),
});
