import { Unit } from './units.model';
import { User } from '../users/users.model';
import { HttpError } from '../../common/error.handler';
import { env } from '../../config/env';

const unitIncludes = [
  { model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
  { model: User, as: 'resident', attributes: ['id', 'firstName', 'lastName', 'email', 'phone'] },
];

export class UnitsService {
  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await Unit.findAndCountAll({
      include: unitIncludes,
      where: { communityId: env.defaultCommunityId },
      order: [['unitNumber', 'ASC']],
      limit,
      offset,
    });
    return { units: rows, total: count };
  }

  async findById(id: string) {
    const unit = await Unit.findByPk(id, { include: unitIncludes });
    if (!unit) throw new HttpError(404, 'Unidad no encontrada.');
    return unit;
  }

  async findByUserId(userId: string) {
    const unit = await Unit.findOne({
      where: { residentUserId: userId },
      include: unitIncludes,
    });
    if (!unit) {
      // Try as owner
      const ownerUnit = await Unit.findOne({
        where: { ownerUserId: userId },
        include: unitIncludes,
      });
      if (!ownerUnit) throw new HttpError(404, 'No se encontró una unidad asignada a este usuario.');
      return ownerUnit;
    }
    return unit;
  }

  async create(data: {
    unitNumber: string;
    unitType?: string;
    address?: string | null;
    areaM2?: number | null;
    ownerUserId?: string | null;
    residentUserId?: string | null;
    isOccupied?: boolean;
    monthlyFee: number;
    notes?: string | null;
  }) {
    const existing = await Unit.findOne({
      where: { communityId: env.defaultCommunityId, unitNumber: data.unitNumber },
    });
    if (existing) throw new HttpError(409, `Ya existe la unidad ${data.unitNumber}.`);

    const unit = await Unit.create({
      communityId: env.defaultCommunityId,
      ...data,
    });

    return this.findById(unit.id);
  }

  async update(id: string, data: Partial<{
    unitNumber: string;
    unitType: string;
    address: string | null;
    areaM2: number | null;
    ownerUserId: string | null;
    residentUserId: string | null;
    isOccupied: boolean;
    monthlyFee: number;
    notes: string | null;
  }>) {
    const unit = await Unit.findByPk(id);
    if (!unit) throw new HttpError(404, 'Unidad no encontrada.');

    await unit.update(data);
    return this.findById(unit.id);
  }

  async delete(id: string) {
    const unit = await Unit.findByPk(id);
    if (!unit) throw new HttpError(404, 'Unidad no encontrada.');
    await unit.destroy();
  }
}

export const unitsService = new UnitsService();
