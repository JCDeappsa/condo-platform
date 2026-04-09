import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';
import { Project } from './projects.model';

interface ProjectUpdateAttributes {
  id: string;
  projectId: string;
  authorId: string;
  comment: string;
  photoUrl: string | null;
  createdAt: Date;
}

type ProjectUpdateCreation = Optional<ProjectUpdateAttributes, 'id' | 'photoUrl' | 'createdAt'>;

export class ProjectUpdate extends Model<ProjectUpdateAttributes, ProjectUpdateCreation> implements ProjectUpdateAttributes {
  declare id: string;
  declare projectId: string;
  declare authorId: string;
  declare comment: string;
  declare photoUrl: string | null;
  declare createdAt: Date;

  declare author?: User;
}

ProjectUpdate.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  projectId: { type: DataTypes.UUID, allowNull: false, field: 'project_id' },
  authorId: { type: DataTypes.UUID, allowNull: false, field: 'author_id' },
  comment: { type: DataTypes.TEXT, allowNull: false },
  photoUrl: { type: DataTypes.TEXT, allowNull: true, field: 'photo_url' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
}, { sequelize, tableName: 'project_updates', timestamps: false, underscored: true });

ProjectUpdate.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
ProjectUpdate.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Project.hasMany(ProjectUpdate, { foreignKey: 'project_id', as: 'updates' });
