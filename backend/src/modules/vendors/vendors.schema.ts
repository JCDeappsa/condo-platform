import Joi from 'joi';

export const createVendorSchema = Joi.object({
  name: Joi.string().max(255).required().messages({
    'any.required': 'El nombre del proveedor es requerido',
  }),
  contactName: Joi.string().max(255).allow(null, ''),
  phone: Joi.string().max(20).allow(null, ''),
  email: Joi.string().email().allow(null, ''),
  taxId: Joi.string().max(50).allow(null, ''),
  category: Joi.string().max(100).allow(null, ''),
  isActive: Joi.boolean().default(true),
  notes: Joi.string().allow(null, ''),
});

export const updateVendorSchema = Joi.object({
  name: Joi.string().max(255),
  contactName: Joi.string().max(255).allow(null, ''),
  phone: Joi.string().max(20).allow(null, ''),
  email: Joi.string().email().allow(null, ''),
  taxId: Joi.string().max(50).allow(null, ''),
  category: Joi.string().max(100).allow(null, ''),
  isActive: Joi.boolean(),
  notes: Joi.string().allow(null, ''),
}).min(1);

export const createExpenseSchema = Joi.object({
  vendorId: Joi.string().uuid().allow(null),
  projectId: Joi.string().uuid().allow(null),
  category: Joi.string().max(100).required().messages({
    'any.required': 'La categoría es requerida',
  }),
  description: Joi.string().max(255).required().messages({
    'any.required': 'La descripción es requerida',
  }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'El monto es requerido',
  }),
  expenseDate: Joi.date().required().messages({
    'any.required': 'La fecha del gasto es requerida',
  }),
  invoiceNumber: Joi.string().max(100).allow(null, ''),
  receiptUrl: Joi.string().uri().allow(null, ''),
  approvedBy: Joi.string().uuid().allow(null),
});

export const updateExpenseSchema = Joi.object({
  vendorId: Joi.string().uuid().allow(null),
  projectId: Joi.string().uuid().allow(null),
  category: Joi.string().max(100),
  description: Joi.string().max(255),
  amount: Joi.number().positive(),
  expenseDate: Joi.date(),
  invoiceNumber: Joi.string().max(100).allow(null, ''),
  receiptUrl: Joi.string().uri().allow(null, ''),
  approvedBy: Joi.string().uuid().allow(null),
}).min(1);
