import { Request, Response } from 'express';
import { vendorsService } from './vendors.service';
import { toVendorDTO, toVendorListDTO, toExpenseDTO, toExpenseListDTO } from './vendors.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';

export class VendorsController {
  // ── Vendors ──

  async createVendor(req: Request, res: Response): Promise<void> {
    const vendor = await vendorsService.createVendor(req.body);
    res.status(201).json({ success: true, data: toVendorDTO(vendor) });
  }

  async findAllVendors(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const filters = {
      category: req.query.category as string | undefined,
      isActive: req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined,
    };
    const { vendors, total } = await vendorsService.findAllVendors(filters, page, limit);
    res.json(buildPaginatedResponse(toVendorListDTO(vendors), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findVendorById(req: Request, res: Response): Promise<void> {
    const vendor = await vendorsService.findVendorById(req.params.id);
    res.json({ success: true, data: toVendorDTO(vendor) });
  }

  async updateVendor(req: Request, res: Response): Promise<void> {
    const vendor = await vendorsService.updateVendor(req.params.id, req.body);
    res.json({ success: true, data: toVendorDTO(vendor) });
  }

  async deleteVendor(req: Request, res: Response): Promise<void> {
    await vendorsService.deleteVendor(req.params.id);
    res.json({ success: true, message: 'Proveedor eliminado.' });
  }

  // ── Expenses ──

  async createExpense(req: Request, res: Response): Promise<void> {
    const expense = await vendorsService.createExpense(req.body);
    res.status(201).json({ success: true, data: toExpenseDTO(expense!) });
  }

  async findAllExpenses(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const filters = {
      vendorId: req.query.vendorId as string | undefined,
      projectId: req.query.projectId as string | undefined,
      category: req.query.category as string | undefined,
    };
    const { expenses, total } = await vendorsService.findAllExpenses(filters, page, limit);
    res.json(buildPaginatedResponse(toExpenseListDTO(expenses), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findExpenseById(req: Request, res: Response): Promise<void> {
    const expense = await vendorsService.findExpenseById(req.params.id);
    res.json({ success: true, data: toExpenseDTO(expense) });
  }

  async updateExpense(req: Request, res: Response): Promise<void> {
    const expense = await vendorsService.updateExpense(req.params.id, req.body);
    res.json({ success: true, data: toExpenseDTO(expense!) });
  }

  async deleteExpense(req: Request, res: Response): Promise<void> {
    await vendorsService.deleteExpense(req.params.id);
    res.json({ success: true, message: 'Gasto eliminado.' });
  }
}

export const vendorsController = new VendorsController();
