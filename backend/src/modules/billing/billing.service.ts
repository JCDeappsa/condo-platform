import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { MonthlyCharge } from './monthly-charges.model';
import { AccountMovement } from '../payments/account-movements.model';
import { Unit } from '../units/units.model';
import { HttpError } from '../../common/error.handler';
import { env } from '../../config/env';

export class BillingService {
  /**
   * Generate monthly charges for all active house units in a given period.
   * Prevents duplicates via the UNIQUE index on (unit_id, period, description).
   */
  async generateMonthlyCharges(period: string, dueDate: Date, description: string = 'Cuota Mensual', amountOverride?: number | null) {
    // Find all house units with a monthly fee > 0
    const units = await Unit.findAll({
      where: {
        communityId: env.defaultCommunityId,
        unitType: 'house',
        monthlyFee: { [Op.gt]: 0 },
      },
    });

    if (units.length === 0) {
      throw new HttpError(400, 'No hay unidades con cuota mensual configurada.');
    }

    let created = 0;
    let skipped = 0;

    const transaction = await sequelize.transaction();
    try {
      for (const unit of units) {
        const amount = amountOverride ?? Number(unit.monthlyFee);

        // Check if charge already exists
        const existing = await MonthlyCharge.findOne({
          where: { unitId: unit.id, period, description },
          transaction,
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create charge
        const charge = await MonthlyCharge.create({
          unitId: unit.id,
          period,
          description,
          amount,
          dueDate,
        }, { transaction });

        // Get current running balance for this unit
        const lastMovement = await AccountMovement.findOne({
          where: { unitId: unit.id },
          order: [['created_at', 'DESC']],
          transaction,
        });
        const prevBalance = lastMovement ? Number(lastMovement.runningBalance) : 0;

        // Create account movement
        await AccountMovement.create({
          unitId: unit.id,
          monthlyChargeId: charge.id,
          movementType: 'charge',
          amount: amount, // positive = charge
          runningBalance: prevBalance + amount,
          description: `${description} - ${period}`,
        }, { transaction });

        created++;
      }

      await transaction.commit();
      return { created, skipped, total: units.length };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Create a special/extraordinary charge for a single unit.
   */
  async createSpecialCharge(unitId: string, period: string, description: string, amount: number, dueDate: Date) {
    const unit = await Unit.findByPk(unitId);
    if (!unit) throw new HttpError(404, 'Unidad no encontrada.');

    const transaction = await sequelize.transaction();
    try {
      const charge = await MonthlyCharge.create({
        unitId, period, description, amount, dueDate,
      }, { transaction });

      const lastMovement = await AccountMovement.findOne({
        where: { unitId },
        order: [['created_at', 'DESC']],
        transaction,
      });
      const prevBalance = lastMovement ? Number(lastMovement.runningBalance) : 0;

      await AccountMovement.create({
        unitId,
        monthlyChargeId: charge.id,
        movementType: 'charge',
        amount,
        runningBalance: prevBalance + amount,
        description: `${description} - ${period}`,
      }, { transaction });

      await transaction.commit();

      return MonthlyCharge.findByPk(charge.id, {
        include: [{ model: Unit, as: 'unit', attributes: ['id', 'unitNumber'] }],
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findCharges(filters: { period?: string; unitId?: string; status?: string }, page: number, limit: number) {
    const where: any = {};
    if (filters.period) where.period = filters.period;
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.status) where.status = filters.status;

    const offset = (page - 1) * limit;
    const { rows, count } = await MonthlyCharge.findAndCountAll({
      where,
      include: [{ model: Unit, as: 'unit', attributes: ['id', 'unitNumber'] }],
      order: [['due_date', 'ASC'], ['unit_id', 'ASC']],
      limit,
      offset,
    });

    return { charges: rows, total: count };
  }

  async findChargeById(id: string) {
    const charge = await MonthlyCharge.findByPk(id, {
      include: [{ model: Unit, as: 'unit', attributes: ['id', 'unitNumber'] }],
    });
    if (!charge) throw new HttpError(404, 'Cobro no encontrado.');
    return charge;
  }

  async updateCharge(id: string, data: Partial<{ amount: number; description: string; dueDate: Date; status: string }>) {
    const charge = await MonthlyCharge.findByPk(id);
    if (!charge) throw new HttpError(404, 'Cobro no encontrado.');

    await charge.update(data);
    return this.findChargeById(id);
  }

  /**
   * Delete a single charge and its account movement.
   */
  async deleteCharge(id: string) {
    const charge = await MonthlyCharge.findByPk(id);
    if (!charge) throw new HttpError(404, 'Cobro no encontrado.');

    if (charge.status === 'paid') {
      throw new HttpError(400, 'No se puede eliminar un cobro que ya fue pagado.');
    }

    const transaction = await sequelize.transaction();
    try {
      // Delete related account movements
      await AccountMovement.destroy({ where: { monthlyChargeId: id }, transaction });
      // Delete the charge
      await charge.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Delete multiple charges by IDs.
   */
  async deleteChargesBulk(ids: string[]) {
    let deleted = 0;
    let skipped = 0;

    for (const id of ids) {
      try {
        await this.deleteCharge(id);
        deleted++;
      } catch {
        skipped++;
      }
    }

    return { deleted, skipped };
  }

  /**
   * Mark overdue charges (past due date and still pending/partial).
   */
  async markOverdueCharges() {
    const today = new Date();
    const [affectedCount] = await MonthlyCharge.update(
      { status: 'overdue' },
      {
        where: {
          status: { [Op.in]: ['pending', 'partial'] },
          dueDate: { [Op.lt]: today },
        },
      }
    );
    return affectedCount;
  }
}

export const billingService = new BillingService();
