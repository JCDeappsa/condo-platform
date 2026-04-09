import { Op } from 'sequelize';
import { sequelize } from '../../config/database';
import { Payment } from './payments.model';
import { AccountMovement } from './account-movements.model';
import { MonthlyCharge } from '../billing/monthly-charges.model';
import { Unit } from '../units/units.model';
import { User } from '../users/users.model';
import { HttpError } from '../../common/error.handler';

export class PaymentsService {
  /**
   * Record a payment and apply it to oldest unpaid charges (FIFO).
   */
  async recordPayment(data: {
    unitId: string;
    amount: number;
    paymentDate: Date;
    paymentMethod: string;
    referenceNumber?: string | null;
    bankReference?: string | null;
    notes?: string | null;
    receiptUrl?: string | null;
    recordedBy: string;
  }) {
    const unit = await Unit.findByPk(data.unitId);
    if (!unit) throw new HttpError(404, 'Unidad no encontrada.');

    const transaction = await sequelize.transaction();
    try {
      // Create payment record
      const payment = await Payment.create({
        unitId: data.unitId,
        amount: data.amount,
        paymentDate: data.paymentDate,
        paymentMethod: data.paymentMethod,
        referenceNumber: data.referenceNumber || null,
        bankReference: data.bankReference || null,
        notes: data.notes || null,
        receiptUrl: data.receiptUrl || null,
        recordedBy: data.recordedBy,
      }, { transaction });

      // FIFO: find oldest unpaid charges for this unit
      const unpaidCharges = await MonthlyCharge.findAll({
        where: {
          unitId: data.unitId,
          status: { [Op.in]: ['pending', 'partial', 'overdue'] },
        },
        order: [['due_date', 'ASC'], ['created_at', 'ASC']],
        transaction,
      });

      let remainingAmount = data.amount;

      for (const charge of unpaidCharges) {
        if (remainingAmount <= 0) break;

        const chargeBalance = Number(charge.amount) - Number(charge.paidAmount);
        if (chargeBalance <= 0) continue;

        const applied = Math.min(remainingAmount, chargeBalance);
        const newPaid = Number(charge.paidAmount) + applied;
        const newStatus = newPaid >= Number(charge.amount) ? 'paid' : 'partial';

        await charge.update({
          paidAmount: newPaid,
          status: newStatus,
        }, { transaction });

        remainingAmount -= applied;
      }

      // Create account movement (negative amount = payment)
      const lastMovement = await AccountMovement.findOne({
        where: { unitId: data.unitId },
        order: [['created_at', 'DESC']],
        transaction,
      });
      const prevBalance = lastMovement ? Number(lastMovement.runningBalance) : 0;

      await AccountMovement.create({
        unitId: data.unitId,
        paymentId: payment.id,
        movementType: 'payment',
        amount: -data.amount, // negative = payment
        runningBalance: prevBalance - data.amount,
        description: `Pago registrado - ${data.paymentMethod}`,
      }, { transaction });

      await transaction.commit();

      return this.findById(payment.id);
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async findAll(filters: {
    unitId?: string;
    from?: Date;
    to?: Date;
    reconciled?: boolean;
  }, page: number, limit: number) {
    const where: any = {};
    if (filters.unitId) where.unitId = filters.unitId;
    if (filters.reconciled !== undefined) where.reconciled = filters.reconciled;
    if (filters.from || filters.to) {
      where.paymentDate = {};
      if (filters.from) where.paymentDate[Op.gte] = filters.from;
      if (filters.to) where.paymentDate[Op.lte] = filters.to;
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Payment.findAndCountAll({
      where,
      include: [
        { model: Unit, as: 'unit', attributes: ['id', 'unitNumber'] },
        { model: User, as: 'recorder', attributes: ['id', 'firstName', 'lastName'] },
      ],
      order: [['payment_date', 'DESC'], ['created_at', 'DESC']],
      limit,
      offset,
    });

    return { payments: rows, total: count };
  }

  async findById(id: string) {
    const payment = await Payment.findByPk(id, {
      include: [
        { model: Unit, as: 'unit', attributes: ['id', 'unitNumber'] },
        { model: User, as: 'recorder', attributes: ['id', 'firstName', 'lastName'] },
      ],
    });
    if (!payment) throw new HttpError(404, 'Pago no encontrado.');
    return payment;
  }

  async getAccountMovements(unitId: string, page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await AccountMovement.findAndCountAll({
      where: { unitId },
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });
    return { movements: rows, total: count };
  }

  async deletePayment(id: string) {
    const payment = await Payment.findByPk(id);
    if (!payment) throw new HttpError(404, 'Pago no encontrado.');

    const transaction = await sequelize.transaction();
    try {
      await AccountMovement.destroy({ where: { paymentId: id }, transaction });
      await payment.destroy({ transaction });
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  async deletePaymentsBulk(ids: string[]) {
    let deleted = 0;
    let errors = 0;
    for (const id of ids) {
      try { await this.deletePayment(id); deleted++; } catch { errors++; }
    }
    return { deleted, errors };
  }

  async updatePayment(id: string, data: Partial<{
    amount: number; paymentDate: Date; paymentMethod: string;
    referenceNumber: string | null; bankReference: string | null; notes: string | null;
  }>) {
    const payment = await Payment.findByPk(id);
    if (!payment) throw new HttpError(404, 'Pago no encontrado.');
    await payment.update(data);
    return this.findById(id);
  }

  async getUnitBalance(unitId: string): Promise<number> {
    const lastMovement = await AccountMovement.findOne({
      where: { unitId },
      order: [['created_at', 'DESC']],
    });
    return lastMovement ? Number(lastMovement.runningBalance) : 0;
  }
}

export const paymentsService = new PaymentsService();
