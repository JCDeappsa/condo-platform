import { ChargeConcept } from './charge-concepts.model';
import { HttpError } from '../../common/error.handler';
import { env } from '../../config/env';

export class SettingsService {
  async listChargeConcepts() {
    return ChargeConcept.findAll({
      where: { communityId: env.defaultCommunityId },
      order: [['sort_order', 'ASC'], ['name', 'ASC']],
    });
  }

  async createChargeConcept(data: {
    name: string;
    description?: string | null;
    defaultAmount: number;
    isPercentage?: boolean;
    percentageValue?: number | null;
    frequency: string;
    sortOrder?: number;
  }) {
    return ChargeConcept.create({
      ...data,
      communityId: env.defaultCommunityId,
    } as any);
  }

  async updateChargeConcept(id: string, data: Partial<{
    name: string;
    description: string | null;
    defaultAmount: number;
    isPercentage: boolean;
    percentageValue: number | null;
    frequency: 'monthly' | 'one_time' | 'annual' | 'on_demand';
    isActive: boolean;
    sortOrder: number;
  }>) {
    const concept = await ChargeConcept.findByPk(id);
    if (!concept) throw new HttpError(404, 'Concepto de cobro no encontrado.');
    await concept.update(data);
    return concept;
  }

  async deleteChargeConcept(id: string) {
    const concept = await ChargeConcept.findByPk(id);
    if (!concept) throw new HttpError(404, 'Concepto de cobro no encontrado.');
    await concept.update({ isActive: false });
    return concept;
  }
}

export const settingsService = new SettingsService();
