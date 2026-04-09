import { Request, Response } from 'express';
import { projectsService } from './projects.service';
import { toProjectDTO, toProjectListDTO } from './projects.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';

export class ProjectsController {
  async create(req: Request, res: Response): Promise<void> {
    const project = await projectsService.create({ ...req.body, createdBy: req.user!.id });
    res.status(201).json({ success: true, data: toProjectDTO(project!) });
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const filters = { status: req.query.status as string | undefined };
    const { projects, total } = await projectsService.findAll(filters, page, limit);
    res.json(buildPaginatedResponse(toProjectListDTO(projects), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findById(req: Request, res: Response): Promise<void> {
    const project = await projectsService.findById(req.params.id);
    res.json({ success: true, data: toProjectDTO(project) });
  }

  async update(req: Request, res: Response): Promise<void> {
    const project = await projectsService.update(req.params.id, req.body);
    res.json({ success: true, data: toProjectDTO(project!) });
  }

  async delete(req: Request, res: Response): Promise<void> {
    await projectsService.delete(req.params.id);
    res.json({ success: true, message: 'Proyecto eliminado.' });
  }

  async addUpdate(req: Request, res: Response): Promise<void> {
    const { comment, photoUrl } = req.body;
    const project = await projectsService.addUpdate(req.params.id, req.user!.id, comment, photoUrl);
    res.json({ success: true, data: toProjectDTO(project!) });
  }
}

export const projectsController = new ProjectsController();
