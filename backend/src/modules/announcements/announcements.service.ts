import { Op } from 'sequelize';
import { Announcement } from './announcements.model';
import { User } from '../users/users.model';
import { HttpError } from '../../common/error.handler';
import { env } from '../../config/env';

const announcementIncludes = [
  { model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] },
];

export class AnnouncementsService {
  async create(data: {
    title: string; body: string; priority?: string;
    publishAt: Date; expiresAt?: Date | null; authorId: string;
  }) {
    const announcement = await Announcement.create({
      communityId: env.defaultCommunityId,
      title: data.title,
      body: data.body,
      priority: data.priority || 'normal',
      publishAt: data.publishAt,
      expiresAt: data.expiresAt || null,
      authorId: data.authorId,
    });
    return this.findById(announcement.id);
  }

  async findAll(filters: { priority?: string }, page: number, limit: number) {
    const where: any = { communityId: env.defaultCommunityId };
    if (filters.priority) where.priority = filters.priority;

    const offset = (page - 1) * limit;
    const { rows, count } = await Announcement.findAndCountAll({
      where, include: announcementIncludes,
      order: [['publish_at', 'DESC']],
      limit, offset,
    });
    return { announcements: rows, total: count };
  }

  async findPublished(page: number, limit: number) {
    const now = new Date();
    const where: any = {
      communityId: env.defaultCommunityId,
      publishAt: { [Op.lte]: now },
      [Op.or]: [
        { expiresAt: null },
        { expiresAt: { [Op.gt]: now } },
      ],
    };

    const offset = (page - 1) * limit;
    const { rows, count } = await Announcement.findAndCountAll({
      where, include: announcementIncludes,
      order: [['publish_at', 'DESC']],
      limit, offset,
    });
    return { announcements: rows, total: count };
  }

  async findById(id: string) {
    const announcement = await Announcement.findByPk(id, { include: announcementIncludes });
    if (!announcement) throw new HttpError(404, 'Anuncio no encontrado.');
    return announcement;
  }

  async update(id: string, data: Partial<{
    title: string; body: string; priority: string;
    publishAt: Date; expiresAt: Date | null;
  }>) {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) throw new HttpError(404, 'Anuncio no encontrado.');
    await announcement.update(data);
    return this.findById(id);
  }

  async delete(id: string) {
    const announcement = await Announcement.findByPk(id);
    if (!announcement) throw new HttpError(404, 'Anuncio no encontrado.');
    await announcement.destroy();
  }
}

export const announcementsService = new AnnouncementsService();
