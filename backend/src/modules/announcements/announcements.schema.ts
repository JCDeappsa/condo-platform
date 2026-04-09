import Joi from 'joi';

export const createAnnouncementSchema = Joi.object({
  title: Joi.string().max(255).required().messages({
    'any.required': 'El título es requerido',
  }),
  body: Joi.string().required().messages({
    'any.required': 'El contenido es requerido',
  }),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent').default('normal'),
  publishAt: Joi.date().required().messages({
    'any.required': 'La fecha de publicación es requerida',
  }),
  expiresAt: Joi.date().allow(null),
});

export const updateAnnouncementSchema = Joi.object({
  title: Joi.string().max(255),
  body: Joi.string(),
  priority: Joi.string().valid('low', 'normal', 'high', 'urgent'),
  publishAt: Joi.date(),
  expiresAt: Joi.date().allow(null),
}).min(1);
