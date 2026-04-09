import { Request, Response } from 'express';
import { metersService } from './meters.service';
import { toMeterTypeDTO, toMeterTypeListDTO, toMeterPointDTO, toMeterPointListDTO, toMeterReadingDTO, toMeterReadingListDTO } from './meters.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';

export class MetersController {
  // ── Meter Types ──

  async createMeterType(req: Request, res: Response): Promise<void> {
    const mt = await metersService.createMeterType(req.body);
    res.status(201).json({ success: true, data: toMeterTypeDTO(mt) });
  }

  async findAllMeterTypes(_req: Request, res: Response): Promise<void> {
    const types = await metersService.findAllMeterTypes();
    res.json({ success: true, data: toMeterTypeListDTO(types) });
  }

  async findMeterTypeById(req: Request, res: Response): Promise<void> {
    const mt = await metersService.findMeterTypeById(req.params.id);
    res.json({ success: true, data: toMeterTypeDTO(mt) });
  }

  async updateMeterType(req: Request, res: Response): Promise<void> {
    const mt = await metersService.updateMeterType(req.params.id, req.body);
    res.json({ success: true, data: toMeterTypeDTO(mt) });
  }

  async deleteMeterType(req: Request, res: Response): Promise<void> {
    await metersService.deleteMeterType(req.params.id);
    res.json({ success: true, message: 'Tipo de medidor eliminado.' });
  }

  // ── Meter Points ──

  async createMeterPoint(req: Request, res: Response): Promise<void> {
    const mp = await metersService.createMeterPoint(req.body);
    res.status(201).json({ success: true, data: toMeterPointDTO(mp!) });
  }

  async findAllMeterPoints(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const filters = {
      unitId: req.query.unitId as string | undefined,
      meterTypeId: req.query.meterTypeId as string | undefined,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    };
    const { points, total } = await metersService.findAllMeterPoints(filters, page, limit);
    res.json(buildPaginatedResponse(toMeterPointListDTO(points), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findMeterPointById(req: Request, res: Response): Promise<void> {
    const mp = await metersService.findMeterPointById(req.params.id);
    res.json({ success: true, data: toMeterPointDTO(mp) });
  }

  async updateMeterPoint(req: Request, res: Response): Promise<void> {
    const mp = await metersService.updateMeterPoint(req.params.id, req.body);
    res.json({ success: true, data: toMeterPointDTO(mp!) });
  }

  // ── Readings ──

  async recordReading(req: Request, res: Response): Promise<void> {
    const reading = await metersService.recordReading({ ...req.body, readBy: req.user!.id });
    res.status(201).json({ success: true, data: toMeterReadingDTO(reading!) });
  }

  async findReadings(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const filters = {
      meterPointId: req.query.meterPointId as string | undefined,
      isAnomaly: req.query.isAnomaly !== undefined ? req.query.isAnomaly === 'true' : undefined,
      readBy: req.query.readBy as string | undefined,
    };
    const { readings, total } = await metersService.findReadings(filters, page, limit);
    res.json(buildPaginatedResponse(toMeterReadingListDTO(readings), total, { page, limit, offset: (page - 1) * limit }));
  }
}

export const metersController = new MetersController();
