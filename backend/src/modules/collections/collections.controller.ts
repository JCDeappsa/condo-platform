import { Request, Response } from 'express';
import { collectionsService } from './collections.service';
import { toCollectionStatusDTO, toPromiseDTO, toNoteDTO } from './collections.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';
import { NotificationTemplate } from '../notifications/notification-templates.model';
import { NotificationRule } from '../notifications/notification-rules.model';

export class CollectionsController {
  async getStatuses(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const { statuses, total } = await collectionsService.getStatuses(page, limit);
    res.json(buildPaginatedResponse(statuses.map(toCollectionStatusDTO), total, { page, limit, offset: (page - 1) * limit }));
  }

  async getUnitTimeline(req: Request, res: Response): Promise<void> {
    const { status, promises, notes, notifications } = await collectionsService.getUnitTimeline(req.params.unitId);
    res.json({
      success: true,
      data: {
        status: status ? toCollectionStatusDTO(status) : null,
        promises: promises.map(toPromiseDTO),
        notes: notes.map(toNoteDTO),
        notifications: notifications.map(n => ({
          id: n.id, channel: n.channel, subject: n.subject, status: n.status,
          sentAt: n.sentAt, createdAt: n.createdAt,
        })),
      },
    });
  }

  async createPromise(req: Request, res: Response): Promise<void> {
    const promise = await collectionsService.createPromise({
      ...req.body,
      createdBy: req.user!.id,
    });
    res.status(201).json({ success: true, data: toPromiseDTO(promise!) });
  }

  async updatePromise(req: Request, res: Response): Promise<void> {
    const promise = await collectionsService.updatePromise(req.params.id, req.body.status);
    res.json({ success: true, data: toPromiseDTO(promise as any) });
  }

  async addNote(req: Request, res: Response): Promise<void> {
    const note = await collectionsService.addNote(req.body.unitId, req.user!.id, req.body.note);
    res.status(201).json({ success: true, data: { id: note.id, note: note.note, createdAt: note.createdAt } });
  }

  async refreshStatuses(_req: Request, res: Response): Promise<void> {
    const result = await collectionsService.refreshStatuses();
    res.json({ success: true, data: result, message: `${result.updated} estados actualizados.` });
  }

  async runEngine(_req: Request, res: Response): Promise<void> {
    const result = await collectionsService.runNotificationEngine();
    res.json({
      success: true,
      data: result,
      message: `Enviados: ${result.sent}, Omitidos: ${result.skipped}, Errores: ${result.errors}`,
    });
  }

  // Templates CRUD
  async getTemplates(_req: Request, res: Response): Promise<void> {
    const templates = await NotificationTemplate.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: templates });
  }

  async updateTemplate(req: Request, res: Response): Promise<void> {
    const template = await NotificationTemplate.findByPk(req.params.id);
    if (!template) { res.status(404).json({ success: false, error: 'Plantilla no encontrada.' }); return; }
    await template.update(req.body);
    res.json({ success: true, data: template });
  }

  // Rules CRUD
  async getRules(_req: Request, res: Response): Promise<void> {
    const rules = await NotificationRule.findAll({
      include: [{ model: NotificationTemplate, as: 'template' }],
      order: [['sort_order', 'ASC']],
    });
    res.json({ success: true, data: rules });
  }

  async createRule(req: Request, res: Response): Promise<void> {
    const rule = await NotificationRule.create(req.body);
    res.status(201).json({ success: true, data: rule });
  }

  async updateRule(req: Request, res: Response): Promise<void> {
    const rule = await NotificationRule.findByPk(req.params.id);
    if (!rule) { res.status(404).json({ success: false, error: 'Regla no encontrada.' }); return; }
    await rule.update(req.body);
    res.json({ success: true, data: rule });
  }
}

export const collectionsController = new CollectionsController();
