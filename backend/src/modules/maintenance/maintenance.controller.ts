import { Request, Response } from 'express';
import { maintenanceService } from './maintenance.service';
import { toTicketDTO, toTicketListDTO } from './maintenance.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';

export class MaintenanceController {
  async findAll(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const filters = {
      status: req.query.status as string | undefined,
      category: req.query.category as string | undefined,
      priority: req.query.priority as string | undefined,
      assignedTo: req.query.assignedTo as string | undefined,
    };
    const { tickets, total } = await maintenanceService.findAll(filters, page, limit);
    res.json(buildPaginatedResponse(toTicketListDTO(tickets), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findById(req: Request, res: Response): Promise<void> {
    const ticket = await maintenanceService.findById(req.params.id);
    res.json({ success: true, data: toTicketDTO(ticket) });
  }

  async findMyTasks(req: Request, res: Response): Promise<void> {
    const tickets = await maintenanceService.findMyTasks(req.user!.id);
    res.json({ success: true, data: toTicketListDTO(tickets) });
  }

  async create(req: Request, res: Response): Promise<void> {
    const ticket = await maintenanceService.create({ ...req.body, reportedBy: req.user!.id });
    res.status(201).json({ success: true, data: toTicketDTO(ticket!) });
  }

  async update(req: Request, res: Response): Promise<void> {
    const ticket = await maintenanceService.update(req.params.id, req.body, req.user!.id);
    res.json({ success: true, data: toTicketDTO(ticket!) });
  }

  async addUpdate(req: Request, res: Response): Promise<void> {
    const { comment, statusChangeTo, closingNotes } = req.body;
    await maintenanceService.addUpdate(req.params.id, req.user!.id, comment, statusChangeTo, closingNotes);
    const ticket = await maintenanceService.findById(req.params.id);
    res.json({ success: true, data: toTicketDTO(ticket) });
  }

  async reportWarning(req: Request, res: Response): Promise<void> {
    const ticket = await maintenanceService.reportWarning({ ...req.body, reportedBy: req.user!.id });
    res.status(201).json({ success: true, data: toTicketDTO(ticket!) });
  }
}

export const maintenanceController = new MaintenanceController();
