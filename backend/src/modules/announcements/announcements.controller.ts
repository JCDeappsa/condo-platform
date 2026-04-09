import { Request, Response } from 'express';
import { announcementsService } from './announcements.service';
import { toAnnouncementDTO, toAnnouncementListDTO } from './announcements.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';

export class AnnouncementsController {
  async create(req: Request, res: Response): Promise<void> {
    const announcement = await announcementsService.create({ ...req.body, authorId: req.user!.id });
    res.status(201).json({ success: true, data: toAnnouncementDTO(announcement!) });
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const filters = { priority: req.query.priority as string | undefined };
    const { announcements, total } = await announcementsService.findAll(filters, page, limit);
    res.json(buildPaginatedResponse(toAnnouncementListDTO(announcements), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findPublished(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const { announcements, total } = await announcementsService.findPublished(page, limit);
    res.json(buildPaginatedResponse(toAnnouncementListDTO(announcements), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findById(req: Request, res: Response): Promise<void> {
    const announcement = await announcementsService.findById(req.params.id);
    res.json({ success: true, data: toAnnouncementDTO(announcement) });
  }

  async update(req: Request, res: Response): Promise<void> {
    const announcement = await announcementsService.update(req.params.id, req.body);
    res.json({ success: true, data: toAnnouncementDTO(announcement!) });
  }

  async delete(req: Request, res: Response): Promise<void> {
    await announcementsService.delete(req.params.id);
    res.json({ success: true, message: 'Anuncio eliminado.' });
  }
}

export const announcementsController = new AnnouncementsController();
