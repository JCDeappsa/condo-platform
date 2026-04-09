import Joi from 'joi';

export const createProjectSchema = Joi.object({
  title: Joi.string().max(255).required().messages({
    'any.required': 'El título del proyecto es requerido',
  }),
  description: Joi.string().allow(null, ''),
  status: Joi.string().valid('proposed', 'approved', 'in_progress', 'completed', 'cancelled').default('proposed'),
  budget: Joi.number().positive().allow(null),
  startDate: Joi.date().allow(null),
  targetEndDate: Joi.date().allow(null),
});

export const updateProjectSchema = Joi.object({
  title: Joi.string().max(255),
  description: Joi.string().allow(null, ''),
  status: Joi.string().valid('proposed', 'approved', 'in_progress', 'completed', 'cancelled'),
  budget: Joi.number().positive().allow(null),
  startDate: Joi.date().allow(null),
  targetEndDate: Joi.date().allow(null),
  actualEndDate: Joi.date().allow(null),
}).min(1);

export const addProjectUpdateSchema = Joi.object({
  comment: Joi.string().required().messages({
    'any.required': 'El comentario es requerido',
  }),
  photoUrl: Joi.string().uri().allow(null, ''),
});
