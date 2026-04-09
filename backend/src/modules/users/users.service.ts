import bcrypt from 'bcryptjs';
import { User } from './users.model';
import { Role } from '../roles/roles.model';
import { HttpError } from '../../common/error.handler';
import { env } from '../../config/env';

export class UsersService {
  async findAll(page: number, limit: number) {
    const offset = (page - 1) * limit;
    const { rows, count } = await User.findAndCountAll({
      include: [{ model: Role, as: 'role' }],
      where: { communityId: env.defaultCommunityId },
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
      limit,
      offset,
    });
    return { users: rows, total: count };
  }

  async findById(id: string) {
    const user = await User.findByPk(id, {
      include: [{ model: Role, as: 'role' }],
    });
    if (!user) throw new HttpError(404, 'Usuario no encontrado.');
    return user;
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    roleId: string;
  }) {
    const existing = await User.findOne({ where: { email: data.email } });
    if (existing) throw new HttpError(409, 'Ya existe un usuario con este correo electrónico.');

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await User.create({
      communityId: env.defaultCommunityId,
      roleId: data.roleId,
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
    });

    return this.findById(user.id);
  }

  async update(id: string, data: Partial<{
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    roleId: string;
    isActive: boolean;
  }>) {
    const user = await User.findByPk(id);
    if (!user) throw new HttpError(404, 'Usuario no encontrado.');

    if (data.email && data.email !== user.email) {
      const existing = await User.findOne({ where: { email: data.email } });
      if (existing) throw new HttpError(409, 'Ya existe un usuario con este correo electrónico.');
    }

    await user.update(data);
    return this.findById(user.id);
  }

  async delete(id: string) {
    const user = await User.findByPk(id);
    if (!user) throw new HttpError(404, 'Usuario no encontrado.');
    await user.destroy(); // soft delete via paranoid
  }

  async findByRole(roleName: string) {
    const users = await User.findAll({
      include: [{ model: Role, as: 'role', where: { name: roleName } }],
      where: { communityId: env.defaultCommunityId, isActive: true },
      order: [['firstName', 'ASC']],
    });
    return users;
  }
}

export const usersService = new UsersService();
