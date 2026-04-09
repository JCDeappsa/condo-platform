import { MeterType } from './meter-types.model';
import { MeterPoint } from './meter-points.model';
import { MeterReading } from './meter-readings.model';

export function toMeterTypeDTO(mt: MeterType) {
  return {
    id: mt.id,
    name: mt.name,
    unitOfMeasure: mt.unitOfMeasure,
    anomalyThresholdPct: Number(mt.anomalyThresholdPct),
    createdAt: mt.createdAt,
  };
}

export function toMeterTypeListDTO(types: MeterType[]) {
  return types.map(toMeterTypeDTO);
}

export function toMeterPointDTO(mp: MeterPoint) {
  return {
    id: mp.id,
    unitId: mp.unitId,
    meterTypeId: mp.meterTypeId,
    meterSerial: mp.meterSerial,
    locationDescription: mp.locationDescription,
    isActive: mp.isActive,
    lastReadingValue: mp.lastReadingValue != null ? Number(mp.lastReadingValue) : null,
    lastReadingDate: mp.lastReadingDate,
    unit: mp.unit ? { id: mp.unit.id, unitNumber: mp.unit.unitNumber } : null,
    meterType: mp.meterType ? toMeterTypeDTO(mp.meterType) : null,
    createdAt: mp.createdAt,
  };
}

export function toMeterPointListDTO(points: MeterPoint[]) {
  return points.map(toMeterPointDTO);
}

export function toMeterReadingDTO(r: MeterReading) {
  return {
    id: r.id,
    meterPointId: r.meterPointId,
    readingValue: Number(r.readingValue),
    readingDate: r.readingDate,
    photoUrl: r.photoUrl,
    isAnomaly: r.isAnomaly,
    anomalyNotes: r.anomalyNotes,
    readBy: r.readBy,
    reader: (r as any).reader ? { id: (r as any).reader.id, firstName: (r as any).reader.firstName, lastName: (r as any).reader.lastName } : null,
    meterPoint: r.meterPoint ? {
      id: r.meterPoint.id,
      meterSerial: r.meterPoint.meterSerial,
      unit: (r.meterPoint as any).unit ? { id: (r.meterPoint as any).unit.id, unitNumber: (r.meterPoint as any).unit.unitNumber } : null,
      meterType: (r.meterPoint as any).meterType ? { id: (r.meterPoint as any).meterType.id, name: (r.meterPoint as any).meterType.name } : null,
    } : null,
    createdAt: r.createdAt,
  };
}

export function toMeterReadingListDTO(readings: MeterReading[]) {
  return readings.map(toMeterReadingDTO);
}
