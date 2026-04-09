import { Request, Response } from 'express';
import { residentsService } from './residents.service';
import { toProfileDTO, toHouseholdMemberDTO, toHouseholdMemberListDTO, toVehicleDTO, toVehicleListDTO } from './residents.dto';
import { HttpError } from '../../common/error.handler';

export class ResidentsController {
  // ── Profile ──────────────────────────────────────────────

  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    // Admin can view any, owner/resident can view own
    if (req.user!.role.name !== 'administrator' && req.user!.id !== userId) {
      throw new HttpError(403, 'No tiene permisos para ver este perfil.');
    }
    const { profile, householdMembers, vehicles } = await residentsService.getProfile(userId);
    res.json({
      success: true,
      data: {
        profile: toProfileDTO(profile),
        householdMembers: toHouseholdMemberListDTO(householdMembers),
        vehicles: toVehicleListDTO(vehicles),
      },
    });
  }

  async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    if (req.user!.role.name !== 'administrator' && req.user!.id !== userId) {
      throw new HttpError(403, 'No tiene permisos para editar este perfil.');
    }
    const profile = await residentsService.updateProfile(userId, req.body);
    res.json({ success: true, data: toProfileDTO(profile) });
  }

  // ── Household Members ────────────────────────────────────

  async getHouseholdMembers(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    if (req.user!.role.name !== 'administrator' && req.user!.id !== userId) {
      throw new HttpError(403, 'No tiene permisos para ver estos datos.');
    }
    const members = await residentsService.getHouseholdMembers(userId);
    res.json({ success: true, data: toHouseholdMemberListDTO(members) });
  }

  async createHouseholdMember(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    if (req.user!.role.name !== 'administrator' && req.user!.id !== userId) {
      throw new HttpError(403, 'No tiene permisos para agregar familiares.');
    }
    const member = await residentsService.createHouseholdMember(userId, req.body);
    res.status(201).json({ success: true, data: toHouseholdMemberDTO(member) });
  }

  async updateHouseholdMember(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const member = await residentsService.getHouseholdMemberById(id);
    if (req.user!.role.name !== 'administrator' && req.user!.id !== member.userId) {
      throw new HttpError(403, 'No tiene permisos para editar este familiar.');
    }
    const updated = await residentsService.updateHouseholdMember(id, req.body);
    res.json({ success: true, data: toHouseholdMemberDTO(updated) });
  }

  async deleteHouseholdMember(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const member = await residentsService.getHouseholdMemberById(id);
    if (req.user!.role.name !== 'administrator' && req.user!.id !== member.userId) {
      throw new HttpError(403, 'No tiene permisos para eliminar este familiar.');
    }
    await residentsService.deleteHouseholdMember(id);
    res.json({ success: true, message: 'Familiar eliminado.' });
  }

  // ── Vehicles ─────────────────────────────────────────────

  async getVehicles(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    if (req.user!.role.name !== 'administrator' && req.user!.id !== userId) {
      throw new HttpError(403, 'No tiene permisos para ver estos datos.');
    }
    const vehicles = await residentsService.getVehicles(userId);
    res.json({ success: true, data: toVehicleListDTO(vehicles) });
  }

  async createVehicle(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    if (req.user!.role.name !== 'administrator' && req.user!.id !== userId) {
      throw new HttpError(403, 'No tiene permisos para agregar vehículos.');
    }
    const vehicle = await residentsService.createVehicle(userId, req.body);
    res.status(201).json({ success: true, data: toVehicleDTO(vehicle) });
  }

  async updateVehicle(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const vehicle = await residentsService.getVehicleById(id);
    if (req.user!.role.name !== 'administrator' && req.user!.id !== vehicle.userId) {
      throw new HttpError(403, 'No tiene permisos para editar este vehículo.');
    }
    const updated = await residentsService.updateVehicle(id, req.body);
    res.json({ success: true, data: toVehicleDTO(updated) });
  }

  async deleteVehicle(req: Request, res: Response): Promise<void> {
    const id = req.params.id;
    const vehicle = await residentsService.getVehicleById(id);
    if (req.user!.role.name !== 'administrator' && req.user!.id !== vehicle.userId) {
      throw new HttpError(403, 'No tiene permisos para eliminar este vehículo.');
    }
    await residentsService.deleteVehicle(id);
    res.json({ success: true, message: 'Vehículo eliminado.' });
  }
}

export const residentsController = new ResidentsController();
