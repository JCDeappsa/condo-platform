import { Request, Response } from 'express';
import { paymentsService } from './payments.service';
import { toPaymentDTO, toPaymentListDTO, toMovementListDTO } from './payments.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';

export class PaymentsController {
  async recordPayment(req: Request, res: Response): Promise<void> {
    const payment = await paymentsService.recordPayment({
      ...req.body,
      recordedBy: req.user!.id,
    });
    res.status(201).json({ success: true, data: toPaymentDTO(payment!) });
  }

  async findAll(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const filters = {
      unitId: req.query.unitId as string | undefined,
      from: req.query.from ? new Date(req.query.from as string) : undefined,
      to: req.query.to ? new Date(req.query.to as string) : undefined,
      reconciled: req.query.reconciled !== undefined ? req.query.reconciled === 'true' : undefined,
    };
    const { payments, total } = await paymentsService.findAll(filters, page, limit);
    res.json(buildPaginatedResponse(toPaymentListDTO(payments), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findById(req: Request, res: Response): Promise<void> {
    const payment = await paymentsService.findById(req.params.id);
    res.json({ success: true, data: toPaymentDTO(payment) });
  }

  async getMovements(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const unitId = req.params.unitId;
    const { movements, total } = await paymentsService.getAccountMovements(unitId, page, limit);
    res.json(buildPaginatedResponse(toMovementListDTO(movements), total, { page, limit, offset: (page - 1) * limit }));
  }

  async getBalance(req: Request, res: Response): Promise<void> {
    const balance = await paymentsService.getUnitBalance(req.params.unitId);
    res.json({ success: true, data: { unitId: req.params.unitId, balance } });
  }

  async updatePayment(req: Request, res: Response): Promise<void> {
    const payment = await paymentsService.updatePayment(req.params.id, req.body);
    res.json({ success: true, data: toPaymentDTO(payment!) });
  }

  async deletePayment(req: Request, res: Response): Promise<void> {
    await paymentsService.deletePayment(req.params.id);
    res.json({ success: true, message: 'Pago eliminado.' });
  }

  async deletePaymentsBulk(req: Request, res: Response): Promise<void> {
    const { ids } = req.body;
    const result = await paymentsService.deletePaymentsBulk(ids);
    res.json({ success: true, data: result, message: `${result.deleted} pago(s) eliminado(s).` });
  }
}

export const paymentsController = new PaymentsController();
