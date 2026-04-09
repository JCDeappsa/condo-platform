import Joi from 'joi';

export const createOrUpdateProfileSchema = Joi.object({
  dpiCui: Joi.string().max(20).allow(null, ''),
  dateOfBirth: Joi.string().isoDate().allow(null, ''),
  nationality: Joi.string().max(100).allow(null, ''),
  profilePhotoUrl: Joi.string().uri().allow(null, ''),
  idPhotoFrontUrl: Joi.string().uri().allow(null, ''),
  idPhotoBackUrl: Joi.string().uri().allow(null, ''),
  emergencyContactName: Joi.string().max(200).allow(null, ''),
  emergencyContactPhone: Joi.string().max(20).allow(null, ''),
  emergencyContactRelationship: Joi.string().max(100).allow(null, ''),
  moveInDate: Joi.string().isoDate().allow(null, ''),
  leaseEndDate: Joi.string().isoDate().allow(null, ''),
  isRenter: Joi.boolean(),
  leaseDocumentUrl: Joi.string().uri().allow(null, ''),
  ownershipDocumentUrl: Joi.string().uri().allow(null, ''),
  hasPets: Joi.boolean(),
  petsDescription: Joi.string().max(500).allow(null, ''),
  notes: Joi.string().max(1000).allow(null, ''),
});

export const createHouseholdMemberSchema = Joi.object({
  fullName: Joi.string().max(200).required().messages({
    'any.required': 'El nombre completo es requerido',
  }),
  relationship: Joi.string().max(50).required().messages({
    'any.required': 'El parentesco es requerido',
  }),
  dateOfBirth: Joi.string().isoDate().allow(null, ''),
  phone: Joi.string().max(20).allow(null, ''),
  email: Joi.string().email().allow(null, ''),
  dpiCui: Joi.string().max(20).allow(null, ''),
  isAuthorizedEntry: Joi.boolean(),
  notes: Joi.string().max(500).allow(null, ''),
});

export const updateHouseholdMemberSchema = Joi.object({
  fullName: Joi.string().max(200),
  relationship: Joi.string().max(50),
  dateOfBirth: Joi.string().isoDate().allow(null, ''),
  phone: Joi.string().max(20).allow(null, ''),
  email: Joi.string().email().allow(null, ''),
  dpiCui: Joi.string().max(20).allow(null, ''),
  isAuthorizedEntry: Joi.boolean(),
  notes: Joi.string().max(500).allow(null, ''),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
});

export const createVehicleSchema = Joi.object({
  make: Joi.string().max(100).required().messages({
    'any.required': 'La marca es requerida',
  }),
  model: Joi.string().max(100).required().messages({
    'any.required': 'El modelo es requerido',
  }),
  year: Joi.number().integer().min(1900).max(2100).allow(null),
  color: Joi.string().max(50).allow(null, ''),
  plateNumber: Joi.string().max(20).required().messages({
    'any.required': 'La placa es requerida',
  }),
  vehicleType: Joi.string().valid('car', 'truck', 'suv', 'motorcycle', 'other'),
  parkingSticker: Joi.string().max(50).allow(null, ''),
  isActive: Joi.boolean(),
  photoUrl: Joi.string().uri().allow(null, ''),
  notes: Joi.string().max(500).allow(null, ''),
});

export const updateVehicleSchema = Joi.object({
  make: Joi.string().max(100),
  model: Joi.string().max(100),
  year: Joi.number().integer().min(1900).max(2100).allow(null),
  color: Joi.string().max(50).allow(null, ''),
  plateNumber: Joi.string().max(20),
  vehicleType: Joi.string().valid('car', 'truck', 'suv', 'motorcycle', 'other'),
  parkingSticker: Joi.string().max(50).allow(null, ''),
  isActive: Joi.boolean(),
  photoUrl: Joi.string().uri().allow(null, ''),
  notes: Joi.string().max(500).allow(null, ''),
}).min(1).messages({
  'object.min': 'Debe enviar al menos un campo para actualizar',
});
