import { Request, Response } from 'express';
import { documentsService } from './documents.service';
import { toDocumentDTO, toDocumentListDTO } from './documents.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';

export class DocumentsController {
  async create(req: Request, res: Response): Promise<void> {
    const doc = await documentsService.create({ ...req.body, uploadedBy: req.user!.id });
    res.status(201).json({ success: true, data: toDocumentDTO(doc!) });
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const filters = {
      category: req.query.category as string | undefined,
      visibility: req.query.visibility as string | undefined,
    };
    const { documents, total } = await documentsService.findAll(req.user!.role.name, filters, page, limit);
    res.json(buildPaginatedResponse(toDocumentListDTO(documents), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findById(req: Request, res: Response): Promise<void> {
    const doc = await documentsService.findById(req.params.id);
    res.json({ success: true, data: toDocumentDTO(doc) });
  }

  async update(req: Request, res: Response): Promise<void> {
    const doc = await documentsService.update(req.params.id, req.body);
    res.json({ success: true, data: toDocumentDTO(doc!) });
  }

  async delete(req: Request, res: Response): Promise<void> {
    await documentsService.delete(req.params.id);
    res.json({ success: true, message: 'Documento eliminado.' });
  }
}

export const documentsController = new DocumentsController();
