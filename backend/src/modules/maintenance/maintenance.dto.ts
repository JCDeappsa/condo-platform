import { MaintenanceTicket } from './maintenance-tickets.model';
import { TicketUpdate } from './maintenance-ticket-updates.model';

export function toTicketDTO(ticket: MaintenanceTicket) {
  return {
    id: ticket.id,
    title: ticket.title,
    description: ticket.description,
    category: ticket.category,
    priority: ticket.priority,
    status: ticket.status,
    location: ticket.location,
    dueDate: ticket.dueDate,
    completedAt: ticket.completedAt,
    closingNotes: ticket.closingNotes,
    materialsUsed: ticket.materialsUsed,
    laborHours: ticket.laborHours ? Number(ticket.laborHours) : null,
    createdAt: ticket.createdAt,
    reporter: ticket.reporter ? { id: ticket.reporter.id, firstName: ticket.reporter.firstName, lastName: ticket.reporter.lastName } : null,
    assignee: ticket.assignee ? { id: ticket.assignee.id, firstName: ticket.assignee.firstName, lastName: ticket.assignee.lastName } : null,
    unit: ticket.unit ? { id: ticket.unit.id, unitNumber: ticket.unit.unitNumber } : null,
    updates: (ticket as any).updates?.map((u: TicketUpdate) => ({
      id: u.id, comment: u.comment, statusChangeFrom: u.statusChangeFrom, statusChangeTo: u.statusChangeTo,
      author: u.author ? { id: u.author.id, firstName: u.author.firstName, lastName: u.author.lastName } : null,
      createdAt: u.createdAt,
    })),
    photos: (ticket as any).photos?.map((p: any) => ({
      id: p.id, fileUrl: p.fileUrl, fileName: p.fileName, photoType: p.photoType, createdAt: p.createdAt,
    })),
  };
}

export function toTicketListDTO(tickets: MaintenanceTicket[]) {
  return tickets.map(toTicketDTO);
}
