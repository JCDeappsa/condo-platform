import { Op } from 'sequelize';
import { AccountCollectionStatus } from './account-collection-status.model';
import { PaymentPromise } from './payment-promises.model';
import { CollectionNote } from './collection-notes.model';
import { NotificationTemplate } from '../notifications/notification-templates.model';
import { NotificationRule } from '../notifications/notification-rules.model';
import { Notification } from '../notifications/notifications.model';
import { MonthlyCharge } from '../billing/monthly-charges.model';
import { Unit } from '../units/units.model';
import { User } from '../users/users.model';
import { HttpError } from '../../common/error.handler';
import { sendEmail } from '../../integrations/resend';
import { env } from '../../config/env';

export class CollectionsService {
  /**
   * Get all collection statuses, sorted by days overdue.
   */
  async getStatuses(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await AccountCollectionStatus.findAndCountAll({
      include: [{ model: Unit, as: 'unit', attributes: ['id', 'unitNumber'] }],
      order: [['days_overdue', 'DESC']],
      limit,
      offset,
    });
    return { statuses: rows, total: count };
  }

  /**
   * Get full collection detail for a unit (status, notes, promises, notifications).
   */
  async getUnitTimeline(unitId: string) {
    const status = await AccountCollectionStatus.findOne({
      where: { unitId },
      include: [{ model: Unit, as: 'unit', attributes: ['id', 'unitNumber'] }],
    });

    const promises = await PaymentPromise.findAll({
      where: { unitId },
      include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['created_at', 'DESC']],
    });

    const notes = await CollectionNote.findAll({
      where: { unitId },
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['created_at', 'DESC']],
    });

    const notifications = await Notification.findAll({
      where: { unitId },
      order: [['created_at', 'DESC']],
      limit: 20,
    });

    return { status, promises, notes, notifications };
  }

  /**
   * Create a payment promise.
   */
  async createPromise(data: { unitId: string; promisedAmount: number; promisedDate: Date; notes?: string | null; createdBy: string }) {
    const promise = await PaymentPromise.create({
      unitId: data.unitId,
      promisedAmount: data.promisedAmount,
      promisedDate: data.promisedDate,
      notes: data.notes || null,
      createdBy: data.createdBy,
    });

    // Update collection status
    await AccountCollectionStatus.update(
      { hasActivePromise: true },
      { where: { unitId: data.unitId } }
    );

    return PaymentPromise.findByPk(promise.id, {
      include: [{ model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] }],
    });
  }

  /**
   * Update promise status (fulfill, break, cancel).
   */
  async updatePromise(id: string, status: string) {
    const promise = await PaymentPromise.findByPk(id);
    if (!promise) throw new HttpError(404, 'Promesa de pago no encontrada.');

    await promise.update({ status, resolvedAt: new Date() });

    // Check if there are other active promises for this unit
    const activeCount = await PaymentPromise.count({
      where: { unitId: promise.unitId, status: 'active' },
    });

    await AccountCollectionStatus.update(
      { hasActivePromise: activeCount > 0 },
      { where: { unitId: promise.unitId } }
    );

    return promise;
  }

  /**
   * Add a collection note.
   */
  async addNote(unitId: string, authorId: string, note: string) {
    return CollectionNote.create({ unitId, authorId, note });
  }

  /**
   * Refresh collection statuses for all units based on current overdue charges.
   */
  async refreshStatuses() {
    const units = await Unit.findAll({
      where: { communityId: env.defaultCommunityId, unitType: 'house' },
    });

    const today = new Date();
    let updated = 0;

    for (const unit of units) {
      const overdueCharges = await MonthlyCharge.findAll({
        where: {
          unitId: unit.id,
          status: { [Op.in]: ['pending', 'partial', 'overdue'] },
          dueDate: { [Op.lt]: today },
        },
        order: [['due_date', 'ASC']],
      });

      const totalOverdue = overdueCharges.reduce(
        (sum, c) => sum + (Number(c.amount) - Number(c.paidAmount)), 0
      );

      const oldestOverdueDate = overdueCharges.length > 0 ? overdueCharges[0].dueDate : null;
      const daysOverdue = oldestOverdueDate
        ? Math.floor((today.getTime() - new Date(oldestOverdueDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      let collectionStage = 'current';
      if (daysOverdue >= 45) collectionStage = 'escalated';
      else if (daysOverdue >= 30) collectionStage = 'warning';
      else if (daysOverdue >= 1) collectionStage = 'reminder';

      const [status, created] = await AccountCollectionStatus.findOrCreate({
        where: { unitId: unit.id },
        defaults: { unitId: unit.id, totalOverdue, oldestOverdueDate, daysOverdue, collectionStage },
      });

      if (!created) {
        await status.update({ totalOverdue, oldestOverdueDate, daysOverdue, collectionStage });
      }
      updated++;
    }

    return { updated };
  }

  /**
   * Run the notification engine — check all overdue accounts against rules and send notifications.
   */
  async runNotificationEngine() {
    // Refresh statuses first
    await this.refreshStatuses();

    const rules = await NotificationRule.findAll({
      where: { isActive: true, triggerType: 'days_overdue' },
      include: [{ model: NotificationTemplate, as: 'template' }],
      order: [['sort_order', 'ASC']],
    });

    if (rules.length === 0) return { sent: 0, skipped: 0, errors: 0 };

    const overdueAccounts = await AccountCollectionStatus.findAll({
      where: { daysOverdue: { [Op.gt]: 0 } },
      include: [{ model: Unit, as: 'unit' }],
    });

    let sent = 0;
    let skipped = 0;
    let errors = 0;
    const now = new Date();

    for (const account of overdueAccounts) {
      // Skip if active promise
      if (account.hasActivePromise) {
        skipped++;
        continue;
      }

      // Find the matching rule (highest days_overdue that the account qualifies for)
      const matchingRule = rules
        .filter(r => r.daysOverdue !== null && account.daysOverdue >= r.daysOverdue)
        .sort((a, b) => (b.daysOverdue || 0) - (a.daysOverdue || 0))[0];

      if (!matchingRule) {
        skipped++;
        continue;
      }

      // Check cooldown
      if (account.lastNotificationAt) {
        const cooldownMs = matchingRule.cooldownHours * 60 * 60 * 1000;
        if (now.getTime() - new Date(account.lastNotificationAt).getTime() < cooldownMs) {
          skipped++;
          continue;
        }
      }

      // Find the resident user for this unit
      const unit = account.unit!;
      const residentUserId = unit.residentUserId || unit.ownerUserId;
      if (!residentUserId) {
        skipped++;
        continue;
      }

      const resident = await User.findByPk(residentUserId);
      if (!resident || !resident.email) {
        skipped++;
        continue;
      }

      // Render template
      const template = matchingRule.template!;
      const variables: Record<string, string> = {
        resident_name: `${resident.firstName} ${resident.lastName}`,
        unit_number: unit.unitNumber,
        amount: Number(account.totalOverdue).toFixed(2),
        total_overdue: Number(account.totalOverdue).toFixed(2),
        days_overdue: String(account.daysOverdue),
        due_date: account.oldestOverdueDate ? new Date(account.oldestOverdueDate).toLocaleDateString('es-GT') : '',
      };

      let subject = template.subject;
      let bodyHtml = template.bodyHtml;
      let bodyText = template.bodyText || '';

      for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        subject = subject.replace(regex, value);
        bodyHtml = bodyHtml.replace(regex, value);
        bodyText = bodyText.replace(regex, value);
      }

      // Create notification record
      const notification = await Notification.create({
        userId: residentUserId,
        unitId: unit.id,
        ruleId: matchingRule.id,
        templateId: template.id,
        channel: template.channel,
        subject,
        body: bodyHtml,
        status: 'pending',
      });

      // Send email
      const result = await sendEmail({
        to: resident.email,
        subject,
        html: bodyHtml,
        text: bodyText,
      });

      if (result.success) {
        await notification.update({ status: 'sent', sentAt: new Date() });
        await account.update({ lastNotificationAt: new Date() });
        sent++;
      } else {
        await notification.update({ status: 'failed', errorMessage: result.error });
        errors++;
      }
    }

    return { sent, skipped, errors };
  }
}

export const collectionsService = new CollectionsService();
