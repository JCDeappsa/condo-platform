import Joi from 'joi';

export const createUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Ingrese un correo electrónico válido',
    'any.required': 'El correo electrónico es requerido',
  }),
  password: Joi.string().min(8).required().messages({
    'string.min': 'La contraseña debe tener al menos 8 caracteres',
    'any.required': 'La contraseña es requerida',
  }),
  firstName: Joi.string().max(100).required().messages({
    'any.required': 'El nombre es requerido',
  }),
  lastName: Joi.string().max(100).required().messages({
    'any.required': 'El apellido es requerido',
  }),
  phone: Joi.string().max(20).allow(null, ''),
  roleId: Joi.string().uuid().required().messages({
    'any.required': 'El rol es requerido',
  }),
});

export const updateUserSchema = Joi.object({
  email: Joi.string().email(),
  firstName: Joi.string().max(100),
  lastName: Joi.string().max(100),
  phone: Joi.string().max(20).allow(null, ''),
  roleId: Joi.string().uuid(),
  isActive: Joi.boolean(),
  boardPosition: Joi.string().max(50).allow(null, '').valid(
    null, '', 'presidente', 'vicepresidente', 'tesorero', 'secretario',
    'vocal_1', 'vocal_2', 'vocal_3', 'vocal_suplente_1', 'vocal_suplente_2'
  ),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
});
