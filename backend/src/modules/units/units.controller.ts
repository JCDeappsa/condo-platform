import { Request, Response } from 'express';
import { unitsService } from './units.service';
import { toUnitDTO, toUnitListDTO } from './units.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';

export class UnitsController {
  async findAll(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const { units, total } = await unitsService.findAll(page, limit);
    res.json(buildPaginatedResponse(toUnitListDTO(units), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findById(req: Request, res: Response): Promise<void> {
    const unit = await unitsService.findById(req.params.id);
    res.json({ success: true, data: toUnitDTO(unit) });
  }

  async findMyUnit(req: Request, res: Response): Promise<void> {
    const unit = await unitsService.findByUserId(req.user!.id);
    res.json({ success: true, data: toUnitDTO(unit) });
  }

  async create(req: Request, res: Response): Promise<void> {
    const unit = await unitsService.create(req.body);
    res.status(201).json({ success: true, data: toUnitDTO(unit!) });
  }

  async update(req: Request, res: Response): Promise<void> {
    const unit = await unitsService.update(req.params.id, req.body);
    res.json({ success: true, data: toUnitDTO(unit!) });
  }

  async delete(req: Request, res: Response): Promise<void> {
    await unitsService.delete(req.params.id);
    res.json({ success: true, message: 'Unidad eliminada.' });
  }
}

export const unitsController = new UnitsController();
