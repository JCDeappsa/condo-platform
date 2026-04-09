import { ResidentProfile } from './resident-profiles.model';
import { HouseholdMember } from './household-members.model';
import { Vehicle } from './vehicles.model';

export function toProfileDTO(profile: ResidentProfile) {
  return {
    id: profile.id,
    userId: profile.userId,
    dpiCui: profile.dpiCui,
    dateOfBirth: profile.dateOfBirth,
    nationality: profile.nationality,
    profilePhotoUrl: profile.profilePhotoUrl,
    idPhotoFrontUrl: profile.idPhotoFrontUrl,
    idPhotoBackUrl: profile.idPhotoBackUrl,
    emergencyContactName: profile.emergencyContactName,
    emergencyContactPhone: profile.emergencyContactPhone,
    emergencyContactRelationship: profile.emergencyContactRelationship,
    moveInDate: profile.moveInDate,
    leaseEndDate: profile.leaseEndDate,
    isRenter: profile.isRenter,
    leaseDocumentUrl: profile.leaseDocumentUrl,
    ownershipDocumentUrl: profile.ownershipDocumentUrl,
    hasPets: profile.hasPets,
    petsDescription: profile.petsDescription,
    notes: profile.notes,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export function toHouseholdMemberDTO(member: HouseholdMember) {
  return {
    id: member.id,
    userId: member.userId,
    fullName: member.fullName,
    relationship: member.relationship,
    dateOfBirth: member.dateOfBirth,
    phone: member.phone,
    email: member.email,
    dpiCui: member.dpiCui,
    isAuthorizedEntry: member.isAuthorizedEntry,
    notes: member.notes,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
  };
}

export function toVehicleDTO(vehicle: Vehicle) {
  return {
    id: vehicle.id,
    userId: vehicle.userId,
    make: vehicle.make,
    model: vehicle.model,
    year: vehicle.year,
    color: vehicle.color,
    plateNumber: vehicle.plateNumber,
    vehicleType: vehicle.vehicleType,
    parkingSticker: vehicle.parkingSticker,
    isActive: vehicle.isActive,
    photoUrl: vehicle.photoUrl,
    notes: vehicle.notes,
    createdAt: vehicle.createdAt,
    updatedAt: vehicle.updatedAt,
  };
}

export function toHouseholdMemberListDTO(members: HouseholdMember[]) {
  return members.map(toHouseholdMemberDTO);
}

export function toVehicleListDTO(vehicles: Vehicle[]) {
  return vehicles.map(toVehicleDTO);
}
