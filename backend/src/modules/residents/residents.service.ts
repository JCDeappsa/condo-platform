import { ResidentProfile } from './resident-profiles.model';
import { HouseholdMember } from './household-members.model';
import { Vehicle } from './vehicles.model';
import { HttpError } from '../../common/error.handler';

export class ResidentsService {
  // ── Profile ──────────────────────────────────────────────

  async getProfile(userId: string) {
    const [profile] = await ResidentProfile.findOrCreate({
      where: { userId },
      defaults: { userId },
    });
    const householdMembers = await HouseholdMember.findAll({
      where: { userId },
      order: [['full_name', 'ASC']],
    });
    const vehicles = await Vehicle.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
    });
    return { profile, householdMembers, vehicles };
  }

  async updateProfile(userId: string, data: Partial<ResidentProfile>) {
    const [profile] = await ResidentProfile.findOrCreate({
      where: { userId },
      defaults: { userId },
    });
    await profile.update(data);
    return profile;
  }

  // ── Household Members ────────────────────────────────────

  async getHouseholdMembers(userId: string) {
    return HouseholdMember.findAll({
      where: { userId },
      order: [['full_name', 'ASC']],
    });
  }

  async createHouseholdMember(userId: string, data: {
    fullName: string;
    relationship: string;
    dateOfBirth?: string | null;
    phone?: string | null;
    email?: string | null;
    dpiCui?: string | null;
    isAuthorizedEntry?: boolean;
    notes?: string | null;
  }) {
    return HouseholdMember.create({
      userId,
      fullName: data.fullName,
      relationship: data.relationship,
      dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
      phone: data.phone || null,
      email: data.email || null,
      dpiCui: data.dpiCui || null,
      isAuthorizedEntry: data.isAuthorizedEntry || false,
      notes: data.notes || null,
    });
  }

  async updateHouseholdMember(id: string, data: any) {
    const member = await HouseholdMember.findByPk(id);
    if (!member) throw new HttpError(404, 'Familiar no encontrado.');
    await member.update(data);
    return member;
  }

  async deleteHouseholdMember(id: string) {
    const member = await HouseholdMember.findByPk(id);
    if (!member) throw new HttpError(404, 'Familiar no encontrado.');
    await member.destroy();
  }

  async getHouseholdMemberById(id: string) {
    const member = await HouseholdMember.findByPk(id);
    if (!member) throw new HttpError(404, 'Familiar no encontrado.');
    return member;
  }

  // ── Vehicles ─────────────────────────────────────────────

  async getVehicles(userId: string) {
    return Vehicle.findAll({
      where: { userId },
      order: [['created_at', 'DESC']],
    });
  }

  async createVehicle(userId: string, data: {
    make: string;
    model: string;
    year?: number | null;
    color?: string | null;
    plateNumber: string;
    vehicleType?: string;
    parkingSticker?: string | null;
    isActive?: boolean;
    photoUrl?: string | null;
    notes?: string | null;
  }) {
    return Vehicle.create({
      userId,
      make: data.make,
      model: data.model,
      year: data.year || null,
      color: data.color || null,
      plateNumber: data.plateNumber,
      vehicleType: data.vehicleType || 'car',
      parkingSticker: data.parkingSticker || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
      photoUrl: data.photoUrl || null,
      notes: data.notes || null,
    });
  }

  async updateVehicle(id: string, data: any) {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) throw new HttpError(404, 'Vehículo no encontrado.');
    await vehicle.update(data);
    return vehicle;
  }

  async deleteVehicle(id: string) {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) throw new HttpError(404, 'Vehículo no encontrado.');
    await vehicle.destroy();
  }

  async getVehicleById(id: string) {
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) throw new HttpError(404, 'Vehículo no encontrado.');
    return vehicle;
  }
}

export const residentsService = new ResidentsService();
