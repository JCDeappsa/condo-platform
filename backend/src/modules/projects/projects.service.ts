import { Project } from './projects.model';
import { ProjectUpdate } from './project-updates.model';
import { User } from '../users/users.model';
import { HttpError } from '../../common/error.handler';
import { env } from '../../config/env';

const projectIncludes = [
  { model: User, as: 'creator', attributes: ['id', 'firstName', 'lastName'] },
];

const projectDetailIncludes = [
  ...projectIncludes,
  { model: ProjectUpdate, as: 'updates', include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName'] }] },
];

export class ProjectsService {
  async create(data: {
    title: string; description?: string | null; status?: string;
    budget?: number | null; startDate?: Date | null; targetEndDate?: Date | null;
    createdBy: string;
  }) {
    const project = await Project.create({
      communityId: env.defaultCommunityId,
      title: data.title,
      description: data.description || null,
      status: data.status || 'proposed',
      budget: data.budget ?? null,
      startDate: data.startDate || null,
      targetEndDate: data.targetEndDate || null,
      createdBy: data.createdBy,
    });
    return this.findById(project.id);
  }

  async findAll(filters: { status?: string }, page: number, limit: number) {
    const where: any = { communityId: env.defaultCommunityId };
    if (filters.status) where.status = filters.status;

    const offset = (page - 1) * limit;
    const { rows, count } = await Project.findAndCountAll({
      where, include: projectIncludes,
      order: [['created_at', 'DESC']],
      limit, offset,
    });
    return { projects: rows, total: count };
  }

  async findById(id: string) {
    const project = await Project.findByPk(id, { include: projectDetailIncludes });
    if (!project) throw new HttpError(404, 'Proyecto no encontrado.');
    return project;
  }

  async update(id: string, data: Partial<{
    title: string; description: string | null; status: string;
    budget: number | null; startDate: Date | null; targetEndDate: Date | null; actualEndDate: Date | null;
  }>) {
    const project = await Project.findByPk(id);
    if (!project) throw new HttpError(404, 'Proyecto no encontrado.');

    if (data.status === 'completed' && !data.actualEndDate && !project.actualEndDate) {
      data.actualEndDate = new Date();
    }

    await project.update(data);
    return this.findById(id);
  }

  async delete(id: string) {
    const project = await Project.findByPk(id);
    if (!project) throw new HttpError(404, 'Proyecto no encontrado.');
    await project.destroy();
  }

  async addUpdate(projectId: string, authorId: string, comment: string, photoUrl?: string | null) {
    const project = await Project.findByPk(projectId);
    if (!project) throw new HttpError(404, 'Proyecto no encontrado.');

    await ProjectUpdate.create({
      projectId,
      authorId,
      comment,
      photoUrl: photoUrl || null,
    });

    return this.findById(projectId);
  }
}

export const projectsService = new ProjectsService();
