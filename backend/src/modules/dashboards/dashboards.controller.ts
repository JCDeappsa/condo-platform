import { Request, Response } from 'express';
import { dashboardsService } from './dashboards.service';

export class DashboardsController {
  async adminDashboard(_req: Request, res: Response): Promise<void> {
    const data = await dashboardsService.getAdminDashboard();
    res.json({ success: true, data });
  }

  async residentDashboard(req: Request, res: Response): Promise<void> {
    const data = await dashboardsService.getResidentDashboard(req.user!.id);
    res.json({ success: true, data });
  }

  async maintenanceDashboard(req: Request, res: Response): Promise<void> {
    const data = await dashboardsService.getMaintenanceDashboard(req.user!.id);
    res.json({ success: true, data });
  }
}

export const dashboardsController = new DashboardsController();
