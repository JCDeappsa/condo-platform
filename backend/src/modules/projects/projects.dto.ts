import { Project } from './projects.model';
import { ProjectUpdate } from './project-updates.model';

export function toProjectDTO(project: Project) {
  return {
    id: project.id,
    communityId: project.communityId,
    title: project.title,
    description: project.description,
    status: project.status,
    budget: project.budget != null ? Number(project.budget) : null,
    spent: Number(project.spent),
    remaining: project.budget != null ? Number(project.budget) - Number(project.spent) : null,
    startDate: project.startDate,
    targetEndDate: project.targetEndDate,
    actualEndDate: project.actualEndDate,
    creator: project.creator ? { id: project.creator.id, firstName: project.creator.firstName, lastName: project.creator.lastName } : null,
    updates: (project as any).updates?.map((u: ProjectUpdate) => ({
      id: u.id,
      comment: u.comment,
      photoUrl: u.photoUrl,
      author: u.author ? { id: u.author.id, firstName: u.author.firstName, lastName: u.author.lastName } : null,
      createdAt: u.createdAt,
    })),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export function toProjectListDTO(projects: Project[]) {
  return projects.map(toProjectDTO);
}
