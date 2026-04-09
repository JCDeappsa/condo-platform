import { Request, Response } from 'express';
import { settingsService } from './settings.service';

export class SettingsController {
  async listChargeConcepts(_req: Request, res: Response): Promise<void> {
    const concepts = await settingsService.listChargeConcepts();
    res.json({ success: true, data: concepts });
  }

  async createChargeConcept(req: Request, res: Response): Promise<void> {
    const concept = await settingsService.createChargeConcept(req.body);
    res.status(201).json({ success: true, data: concept });
  }

  async updateChargeConcept(req: Request, res: Response): Promise<void> {
    const concept = await settingsService.updateChargeConcept(req.params.id, req.body);
    res.json({ success: true, data: concept });
  }

  async deleteChargeConcept(req: Request, res: Response): Promise<void> {
    await settingsService.deleteChargeConcept(req.params.id);
    res.json({ success: true, message: 'Concepto desactivado exitosamente.' });
  }
}

export const settingsController = new SettingsController();
