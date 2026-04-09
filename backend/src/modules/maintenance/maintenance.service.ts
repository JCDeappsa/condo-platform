import { Op } from 'sequelize';
import { MaintenanceTicket } from './maintenance-tickets.model';
import { TicketUpdate } from './maintenance-ticket-updates.model';
import { TicketPhoto } from './maintenance-ticket-photos.model';
import { User } from '../users/users.model';
import { Unit } from '../units/units.model';
import { HttpError } from '../../common/error.handler';
import { env } from '../../config/env';

const ticketIncludes = [
  { model: User, as: 'reporter', attributes: ['id', 'firstName', 'lastName'] },
  { model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName'] },
  { model: Unit, as: 'unit', attributes: ['id', 'unitNumber'] },
];

const ticketDetailIncludes = [
  ...ticketIncludes,
  { model: TicketUpdate, as: 'updates', include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }] },
  { model: TicketPhoto, as: 'photos' },
];

export class MaintenanceService {
  async findAll(filters: { status?: string; category?: string; priority?: string; assignedTo?: string }, page: number, limit: number) {
    const where: any = { communityId: env.defaultCommunityId };
    if (filters.status) where.status = filters.status;
    if (filters.category) where.category = filters.category;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assignedTo) where.assignedTo = filters.assignedTo;

    const offset = (page - 1) * limit;
    const { rows, count } = await MaintenanceTicket.findAndCountAll({
      where, include: ticketIncludes,
      order: [['created_at', 'DESC']],
      limit, offset,
    });
    return { tickets: rows, total: count };
  }

  async findById(id: string) {
    const ticket = await MaintenanceTicket.findByPk(id, { include: ticketDetailIncludes });
    if (!ticket) throw new HttpError(404, 'Ticket no encontrado.');
    return ticket;
  }

  async findMyTasks(userId: string) {
    const tickets = await MaintenanceTicket.findAll({
      where: { assignedTo: userId, status: { [Op.in]: ['open', 'in_progress', 'pending_parts'] } },
      include: ticketIncludes,
      order: [
        [this.priorityOrder(), 'DESC'],
        ['due_date', 'ASC'],
        ['created_at', 'ASC'],
      ],
    });
    return tickets;
  }

  private priorityOrder() {
    return MaintenanceTicket.sequelize!.literal(
      "CASE priority WHEN 'urgent' THEN 4 WHEN 'high' THEN 3 WHEN 'medium' THEN 2 WHEN 'low' THEN 1 ELSE 0 END"
    );
  }

  async create(data: {
    title: string; description?: string | null; category?: string; priority?: string;
    location?: string | null; assignedTo?: string | null; unitId?: string | null;
    dueDate?: Date | null; reportedBy: string;
  }) {
    const ticket = await MaintenanceTicket.create({
      communityId: env.defaultCommunityId,
      title: data.title,
      description: data.description || null,
      category: data.category || 'general',
      priority: data.priority || 'medium',
      location: data.location || null,
      assignedTo: data.assignedTo || null,
      unitId: data.unitId || null,
      dueDate: data.dueDate || null,
      reportedBy: data.reportedBy,
    });
    return this.findById(ticket.id);
  }

  async update(id: string, data: any, userId: string) {
    const ticket = await MaintenanceTicket.findByPk(id);
    if (!ticket) throw new HttpError(404, 'Ticket no encontrado.');

    // Business rule: completed tickets require closing notes
    if (data.status === 'completed' && !data.closingNotes && !ticket.closingNotes) {
      throw new HttpError(400, 'Los tickets completados requieren notas de cierre.');
    }

    const oldStatus = ticket.status;

    if (data.status === 'completed') {
      data.completedAt = new Date();
    }

    await ticket.update(data);

    // Log status change
    if (data.status && data.status !== oldStatus) {
      await TicketUpdate.create({
        ticketId: id,
        authorId: userId,
        comment: data.closingNotes || `Estado cambiado de ${oldStatus} a ${data.status}`,
        statusChangeFrom: oldStatus,
        statusChangeTo: data.status,
      });
    }

    return this.findById(id);
  }

  async addUpdate(ticketId: string, authorId: string, comment: string | null, statusChangeTo: string | null, closingNotes: string | null) {
    const ticket = await MaintenanceTicket.findByPk(ticketId);
    if (!ticket) throw new HttpError(404, 'Ticket no encontrado.');

    const oldStatus = ticket.status;

    if (statusChangeTo) {
      if (statusChangeTo === 'completed' && !closingNotes && !ticket.closingNotes) {
        throw new HttpError(400, 'Los tickets completados requieren notas de cierre.');
      }
      await ticket.update({
        status: statusChangeTo,
        ...(statusChangeTo === 'completed' ? { completedAt: new Date(), closingNotes } : {}),
      });
    }

    const update = await TicketUpdate.create({
      ticketId,
      authorId,
      comment,
      statusChangeFrom: statusChangeTo ? oldStatus : null,
      statusChangeTo,
    });

    return update;
  }

  async reportWarning(data: {
    location: string; category: string; priority: string;
    description: string; immediateRisk: boolean; reportedBy: string;
  }) {
    const title = data.immediateRisk
      ? `[RIESGO INMEDIATO] ${data.description.substring(0, 100)}`
      : `Reporte: ${data.description.substring(0, 100)}`;

    const priority = data.immediateRisk ? 'urgent' : data.priority;

    return this.create({
      title,
      description: data.description,
      category: data.category,
      priority,
      location: data.location,
      reportedBy: data.reportedBy,
    });
  }
}

export const maintenanceService = new MaintenanceService();
