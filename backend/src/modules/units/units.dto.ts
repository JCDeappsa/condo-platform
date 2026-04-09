import { Unit } from './units.model';

export function toUnitDTO(unit: Unit) {
  return {
    id: unit.id,
    unitNumber: unit.unitNumber,
    unitType: unit.unitType,
    address: unit.address,
    areaM2: unit.areaM2 ? Number(unit.areaM2) : null,
    isOccupied: unit.isOccupied,
    monthlyFee: Number(unit.monthlyFee),
    notes: unit.notes,
    createdAt: unit.createdAt,
    updatedAt: unit.updatedAt,
    owner: unit.owner
      ? { id: unit.owner.id, firstName: unit.owner.firstName, lastName: unit.owner.lastName, email: unit.owner.email, phone: unit.owner.phone }
      : null,
    resident: unit.resident
      ? { id: unit.resident.id, firstName: unit.resident.firstName, lastName: unit.resident.lastName, email: unit.resident.email, phone: unit.resident.phone }
      : null,
  };
}

export function toUnitListDTO(units: Unit[]) {
  return units.map(toUnitDTO);
}
