import { sequelize } from '../../config/database';
import { MeterType } from './meter-types.model';
import { MeterPoint } from './meter-points.model';
import { MeterReading } from './meter-readings.model';
import { Unit } from '../units/units.model';
import { User } from '../users/users.model';
import { HttpError } from '../../common/error.handler';

export class MetersService {
  // ── Meter Types ──

  async createMeterType(data: { name: string; unitOfMeasure: string; anomalyThresholdPct?: number }) {
    return MeterType.create(data);
  }

  async findAllMeterTypes() {
    return MeterType.findAll({ order: [['name', 'ASC']] });
  }

  async findMeterTypeById(id: string) {
    const mt = await MeterType.findByPk(id);
    if (!mt) throw new HttpError(404, 'Tipo de medidor no encontrado.');
    return mt;
  }

  async updateMeterType(id: string, data: Partial<{ name: string; unitOfMeasure: string; anomalyThresholdPct: number }>) {
    const mt = await MeterType.findByPk(id);
    if (!mt) throw new HttpError(404, 'Tipo de medidor no encontrado.');
    await mt.update(data);
    return mt;
  }

  async deleteMeterType(id: string) {
    const mt = await MeterType.findByPk(id);
    if (!mt) throw new HttpError(404, 'Tipo de medidor no encontrado.');
    await mt.destroy();
  }

  // ── Meter Points ──

  async createMeterPoint(data: { unitId: string; meterTypeId: string; meterSerial: string; locationDescription?: string | null; isActive?: boolean }) {
    const unit = await Unit.findByPk(data.unitId);
    if (!unit) throw new HttpError(404, 'Unidad no encontrada.');
    const meterType = await MeterType.findByPk(data.meterTypeId);
    if (!meterType) throw new HttpError(404, 'Tipo de medidor no encontrado.');
    const mp = await MeterPoint.create(data);
    return this.findMeterPointById(mp.id);
  }

  async findAllMeterPoints(filters: { unitId?: string; meterTypeId?: string; isActive?: boolean }, page: number, limit: number) {
    const where: any = {};
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.meterTypeId) where.meterTypeId = filters.meterTypeId;
    if (filters.isActive !== undefined) where.isActive = filters.isActive;

    const offset = (page - 1) * limit;
    const { rows, count } = await MeterPoint.findAndCountAll({
      where,
      include: [
        { model: Unit, as: 'unit', attributes: ['id', 'unitNumber'] },
        { model: MeterType, as: 'meterType' },
      ],
      order: [['created_at', 'DESC']],
      limit, offset,
    });
    return { points: rows, total: count };
  }

  async findMeterPointById(id: string) {
    const mp = await MeterPoint.findByPk(id, {
      include: [
        { model: Unit, as: 'unit', attributes: ['id', 'unitNumber'] },
        { model: MeterType, as: 'meterType' },
      ],
    });
    if (!mp) throw new HttpError(404, 'Punto de medición no encontrado.');
    return mp;
  }

  async updateMeterPoint(id: string, data: Partial<{ meterSerial: string; locationDescription: string | null; isActive: boolean }>) {
    const mp = await MeterPoint.findByPk(id);
    if (!mp) throw new HttpError(404, 'Punto de medición no encontrado.');
    await mp.update(data);
    return this.findMeterPointById(id);
  }

  // ── Readings ──

  async recordReading(data: { meterPointId: string; readingValue: number; readingDate: Date; photoUrl?: string | null; anomalyNotes?: string | null; readBy: string }) {
    const meterPoint = await MeterPoint.findByPk(data.meterPointId, {
      include: [{ model: MeterType, as: 'meterType' }],
    });
    if (!meterPoint) throw new HttpError(404, 'Punto de medición no encontrado.');
    if (!meterPoint.isActive) throw new HttpError(400, 'El punto de medición está inactivo.');

    // Anomaly detection
    let isAnomaly = false;
    let anomalyNotes = data.anomalyNotes || null;

    if (meterPoint.lastReadingValue != null && meterPoint.meterType) {
      const threshold = Number(meterPoint.meterType.anomalyThresholdPct);
      const previous = Number(meterPoint.lastReadingValue);
      const limit = previous * (1 + threshold / 100);

      if (data.readingValue > limit) {
        isAnomaly = true;
        if (!anomalyNotes) {
          anomalyNotes = `Lectura ${data.readingValue} supera el umbral de ${limit.toFixed(2)} (anterior: ${previous}, umbral: ${threshold}%)`;
        }
      }
    }

    const transaction = await sequelize.transaction();
    try {
      const reading = await MeterReading.create({
        meterPointId: data.meterPointId,
        readingValue: data.readingValue,
        readingDate: data.readingDate,
        photoUrl: data.photoUrl || null,
        isAnomaly,
        anomalyNotes,
        readBy: data.readBy,
      }, { transaction });

      // Update meter point last reading
      await meterPoint.update({
        lastReadingValue: data.readingValue,
        lastReadingDate: data.readingDate,
      }, { transaction });

      await transaction.commit();

      return MeterReading.findByPk(reading.id, {
        include: [
          { model: MeterPoint, as: 'meterPoint' },
          { model: User, as: 'reader', attributes: ['id', 'firstName', 'lastName'] },
        ],
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findReadings(filters: { meterPointId?: string; isAnomaly?: boolean; readBy?: string }, page: number, limit: number) {
    const where: any = {};
    if (filters.meterPointId) where.meterPointId = filters.meterPointId;
    if (filters.isAnomaly !== undefined) where.isAnomaly = filters.isAnomaly;
    if (filters.readBy) where.readBy = filters.readBy;

    const offset = (page - 1) * limit;
    const { rows, count } = await MeterReading.findAndCountAll({
      where,
      include: [
        { model: MeterPoint, as: 'meterPoint', include: [
          { model: Unit, as: 'unit', attributes: ['id', 'unitNumber'] },
          { model: MeterType, as: 'meterType', attributes: ['id', 'name', 'unitOfMeasure'] },
        ] },
        { model: User, as: 'reader', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['reading_date', 'DESC']],
      limit, offset,
    });
    return { readings: rows, total: count };
  }
}

export const metersService = new MetersService();
