import { Op, fn, col, literal } from 'sequelize';
import { MonthlyCharge } from '../billing/monthly-charges.model';
import { Payment } from '../payments/payments.model';
import { MaintenanceTicket } from '../maintenance/maintenance-tickets.model';
import { Project } from '../projects/projects.model';
import { Announcement } from '../announcements/announcements.model';
import { Unit } from '../units/units.model';
import { User } from '../users/users.model';
import { MeterPoint } from '../meters/meter-points.model';
import { env } from '../../config/env';

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
  return { start, end };
}

function currentPeriod() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${now.getFullYear()}-${month}`;
}

export class DashboardsService {
  async getAdminDashboard() {
    const { start, end } = currentMonthRange();
    const period = currentPeriod();

    // Billed this month
    const billedResult = await MonthlyCharge.sum('amount', {
      where: { period },
    });
    const billedThisMonth = Number(billedResult) || 0;

    // Collected this month
    const collectedResult = await Payment.sum('amount', {
      where: {
        paymentDate: { [Op.between]: [start, end] },
      },
    });
    const collectedThisMonth = Number(collectedResult) || 0;

    // Overdue
    const overdueCharges = await MonthlyCharge.findAll({
      where: { status: 'overdue' },
      attributes: [
        [fn('SUM', col('amount')), 'totalOverdue'],
        [fn('COUNT', literal('DISTINCT unit_id')), 'overdueUnits'],
      ],
      raw: true,
    }) as any[];

    const overdueAmount = Number(overdueCharges[0]?.totalOverdue) || 0;
    const overdueUnitsCount = Number(overdueCharges[0]?.overdueUnits) || 0;

    // Tickets
    const openTickets = await MaintenanceTicket.count({
      where: { communityId: env.defaultCommunityId, status: { [Op.in]: ['open', 'in_progress', 'pending_parts'] } },
    });
    const urgentTickets = await MaintenanceTicket.count({
      where: { communityId: env.defaultCommunityId, priority: 'urgent', status: { [Op.in]: ['open', 'in_progress'] } },
    });

    // Active projects
    const activeProjects = await Project.count({
      where: { communityId: env.defaultCommunityId, status: { [Op.in]: ['approved', 'in_progress'] } },
    });

    return {
      billedThisMonth,
      collectedThisMonth,
      overdueAmount,
      overdueUnitsCount,
      openTickets,
      urgentTickets,
      activeProjects,
    };
  }

  async getResidentDashboard(userId: string) {
    // Find unit for this user
    const unit = await Unit.findOne({
      where: {
        communityId: env.defaultCommunityId,
        [Op.or]: [
          { ownerUserId: userId },
          { residentUserId: userId },
        ],
      },
    });

    if (!unit) {
      return {
        currentBalance: 0,
        recentCharges: [],
        recentPayments: [],
        announcements: [],
        myTickets: [],
      };
    }

    // Current balance = sum of pending/overdue charges - paid amounts
    const charges = await MonthlyCharge.findAll({
      where: { unitId: unit.id, status: { [Op.in]: ['pending', 'partial', 'overdue'] } },
    });
    const currentBalance = charges.reduce((sum, c) => sum + Number(c.amount) - Number(c.paidAmount), 0);

    // Recent charges (last 5)
    const recentCharges = await MonthlyCharge.findAll({
      where: { unitId: unit.id },
      order: [['due_date', 'DESC']],
      limit: 5,
    });

    // Recent payments (last 5)
    const recentPayments = await Payment.findAll({
      where: { unitId: unit.id },
      order: [['payment_date', 'DESC']],
      limit: 5,
    });

    // Published announcements
    const now = new Date();
    const announcements = await Announcement.findAll({
      where: {
        communityId: env.defaultCommunityId,
        publishAt: { [Op.lte]: now },
        [Op.or]: [{ expiresAt: null }, { expiresAt: { [Op.gt]: now } }],
      },
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }],
      order: [['publish_at', 'DESC']],
      limit: 5,
    });

    // My tickets
    const myTickets = await MaintenanceTicket.findAll({
      where: {
        [Op.or]: [
          { reportedBy: userId },
          { unitId: unit.id },
        ],
        status: { [Op.in]: ['open', 'in_progress', 'pending_parts'] },
      },
      order: [['created_at', 'DESC']],
      limit: 10,
    });

    return {
      currentBalance,
      recentCharges: recentCharges.map(c => ({
        id: c.id, period: c.period, description: c.description,
        amount: Number(c.amount), dueDate: c.dueDate, status: c.status,
        paidAmount: Number(c.paidAmount),
      })),
      recentPayments: recentPayments.map(p => ({
        id: p.id, amount: Number(p.amount), paymentDate: p.paymentDate,
        paymentMethod: p.paymentMethod, referenceNumber: p.referenceNumber,
      })),
      announcements: announcements.map(a => ({
        id: a.id, title: a.title, body: a.body, priority: a.priority,
        publishAt: a.publishAt,
        author: a.author ? { id: a.author.id, firstName: a.author.firstName, lastName: a.author.lastName } : null,
      })),
      myTickets: myTickets.map(t => ({
        id: t.id, title: t.title, status: t.status, priority: t.priority, createdAt: t.createdAt,
      })),
    };
  }

  async getMaintenanceDashboard(userId: string) {
    // Assigned tickets count
    const assignedTickets = await MaintenanceTicket.count({
      where: {
        assignedTo: userId,
        status: { [Op.in]: ['open', 'in_progress', 'pending_parts'] },
      },
    });

    // Pending inspections (open tickets assigned to this user with no updates yet)
    const pendingInspections = await MaintenanceTicket.count({
      where: {
        assignedTo: userId,
        status: 'open',
      },
    });

    // Readings due: active meter points with no reading in the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const readingsDue = await MeterPoint.count({
      where: {
        isActive: true,
        [Op.or]: [
          { lastReadingDate: null },
          { lastReadingDate: { [Op.lt]: thirtyDaysAgo } },
        ],
      },
    });

    return {
      assignedTickets,
      pendingInspections,
      readingsDue,
    };
  }
}

export const dashboardsService = new DashboardsService();
