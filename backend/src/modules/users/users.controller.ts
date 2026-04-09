import { Request, Response } from 'express';
import { usersService } from './users.service';
import { toUserDTO, toUserListDTO } from './users.dto';
import { parsePagination, buildPaginatedResponse } from '../../common/pagination';

export class UsersController {
  async findAll(req: Request, res: Response): Promise<void> {
    const { page, limit } = parsePagination(req);
    const { users, total } = await usersService.findAll(page, limit);
    res.json(buildPaginatedResponse(toUserListDTO(users), total, { page, limit, offset: (page - 1) * limit }));
  }

  async findById(req: Request, res: Response): Promise<void> {
    const user = await usersService.findById(req.params.id);
    res.json({ success: true, data: toUserDTO(user) });
  }

  async create(req: Request, res: Response): Promise<void> {
    const user = await usersService.create(req.body);
    res.status(201).json({ success: true, data: toUserDTO(user!) });
  }

  async update(req: Request, res: Response): Promise<void> {
    const user = await usersService.update(req.params.id, req.body);
    res.json({ success: true, data: toUserDTO(user!) });
  }

  async delete(req: Request, res: Response): Promise<void> {
    await usersService.delete(req.params.id);
    res.json({ success: true, message: 'Usuario eliminado.' });
  }

  async findByRole(req: Request, res: Response): Promise<void> {
    const users = await usersService.findByRole(req.params.role);
    res.json({ success: true, data: toUserListDTO(users) });
  }
}

export const usersController = new UsersController();
