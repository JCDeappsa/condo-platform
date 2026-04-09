import { Request, Response } from 'express';
import { billingService } from './billing.service';
import { toChargeDTO, toChargeListDTO } from './billing.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';

export class BillingController {
  async generateCharges(req: Request, res: Response): Promise<void> {
    const { period, dueDate, description, amountOverride } = req.body;
    const result = await billingService.generateMonthlyCharges(period, dueDate, description, amountOverride);
    res.status(201).json({
      success: true,
      data: result,
      message: `Se generaron ${result.created} cobros. ${result.skipped} ya existían.`,
    });
  }

  async createSpecialCharge(req: Request, res: Response): Promise<void> {
    const { unitId, period, description, amount, dueDate } = req.body;
    const charge = await billingService.createSpecialCharge(unitId, period, description, amount, dueDate);
    res.status(201).json({ success: true, data: toChargeDTO(charge!) });
  }

  async findCharges(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const filters = {
      period: req.query.period as string | undefined,
      unitId: req.query.unitId as string | undefined,
      status: req.query.status as string | undefined,
    };
    const { charges, total } = await billingService.findCharges(filters, page, limit);
    res.json(buildPaginatedResponse(toChargeListDTO(charges), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findChargeById(req: Request, res: Response): Promise<void> {
    const charge = await billingService.findChargeById(req.params.id);
    res.json({ success: true, data: toChargeDTO(charge) });
  }

  async updateCharge(req: Request, res: Response): Promise<void> {
    const charge = await billingService.updateCharge(req.params.id, req.body);
    res.json({ success: true, data: toChargeDTO(charge!) });
  }

  async markOverdue(_req: Request, res: Response): Promise<void> {
    const count = await billingService.markOverdueCharges();
    res.json({ success: true, data: { markedOverdue: count } });
  }

  async deleteCharge(req: Request, res: Response): Promise<void> {
    await billingService.deleteCharge(req.params.id);
    res.json({ success: true, message: 'Cobro eliminado.' });
  }

  async deleteChargesBulk(req: Request, res: Response): Promise<void> {
    const { ids } = req.body;
    const result = await billingService.deleteChargesBulk(ids);
    res.json({
      success: true,
      data: result,
      message: `${result.deleted} cobros eliminados. ${result.skipped > 0 ? `${result.skipped} no se pudieron eliminar (ya pagados).` : ''}`,
    });
  }
}

export const billingController = new BillingController();
