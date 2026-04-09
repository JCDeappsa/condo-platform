import { Op } from 'sequelize';
import { Document } from './documents.model';
import { User } from '../users/users.model';
import { HttpError } from '../../common/error.handler';
import { env } from '../../config/env';

const documentIncludes = [
  { model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName'] },
];

// Visibility to role mapping
const VISIBILITY_ROLES: Record<string, string[]> = {
  all: ['administrator', 'board_member', 'maintenance', 'resident'],
  board: ['administrator', 'board_member'],
  admin: ['administrator'],
};

export class DocumentsService {
  async create(data: {
    title: string; description?: string | null; category: string;
    fileUrl: string; fileName: string; fileSizeBytes?: number | null;
    visibility?: string; uploadedBy: string;
  }) {
    const doc = await Document.create({
      communityId: env.defaultCommunityId,
      title: data.title,
      description: data.description || null,
      category: data.category,
      fileUrl: data.fileUrl,
      fileName: data.fileName,
      fileSizeBytes: data.fileSizeBytes ?? null,
      visibility: data.visibility || 'all',
      uploadedBy: data.uploadedBy,
    });
    return this.findById(doc.id);
  }

  async findAll(userRole: string, filters: { category?: string; visibility?: string }, page: number, limit: number) {
    const where: any = { communityId: env.defaultCommunityId };
    if (filters.category) where.category = filters.category;

    // Filter by what user can see
    if (filters.visibility) {
      where.visibility = filters.visibility;
    } else {
      const visibleLevels = Object.entries(VISIBILITY_ROLES)
        .filter(([, roles]) => roles.includes(userRole))
        .map(([level]) => level);
      where.visibility = { [Op.in]: visibleLevels };
    }

    const offset = (page - 1) * limit;
    const { rows, count } = await Document.findAndCountAll({
      where, include: documentIncludes,
      order: [['created_at', 'DESC']],
      limit, offset,
    });
    return { documents: rows, total: count };
  }

  async findById(id: string) {
    const doc = await Document.findByPk(id, { include: documentIncludes });
    if (!doc) throw new HttpError(404, 'Documento no encontrado.');
    return doc;
  }

  async update(id: string, data: Partial<{
    title: string; description: string | null; category: string;
    fileUrl: string; fileName: string; fileSizeBytes: number | null; visibility: string;
  }>) {
    const doc = await Document.findByPk(id);
    if (!doc) throw new HttpError(404, 'Documento no encontrado.');
    await doc.update(data);
    return this.findById(id);
  }

  async delete(id: string) {
    const doc = await Document.findByPk(id);
    if (!doc) throw new HttpError(404, 'Documento no encontrado.');
    await doc.destroy();
  }
}

export const documentsService = new DocumentsService();
