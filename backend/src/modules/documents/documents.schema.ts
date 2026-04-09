import Joi from 'joi';

export const createDocumentSchema = Joi.object({
  title: Joi.string().max(255).required().messages({
    'any.required': 'El título es requerido',
  }),
  description: Joi.string().allow(null, ''),
  category: Joi.string().max(100).required().messages({
    'any.required': 'La categoría es requerida',
  }),
  fileUrl: Joi.string().uri().required().messages({
    'any.required': 'La URL del archivo es requerida',
  }),
  fileName: Joi.string().max(255).required().messages({
    'any.required': 'El nombre del archivo es requerido',
  }),
  fileSizeBytes: Joi.number().integer().positive().allow(null),
  visibility: Joi.string().valid('all', 'board', 'admin').default('all'),
});

export const updateDocumentSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().allow(null, ''),
  category: Joi.string().max(100),
  fileUrl: Joi.string().uri(),
  fileName: Joi.string().max(255),
  fileSizeBytes: Joi.number().integer().positive().allow(null),
  visibility: Joi.string().valid('all', 'board', 'admin'),
}).min(1);
