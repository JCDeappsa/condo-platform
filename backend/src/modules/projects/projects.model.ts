import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';

interface ProjectAttributes {
  id: string;
  communityId: string;
  title: string;
  description: string | null;
  status: string;
  budget: number | null;
  spent: number;
  startDate: Date | null;
  targetEndDate: Date | null;
  actualEndDate: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

type ProjectCreation = Optional<ProjectAttributes, 'id' | 'description' | 'status' | 'budget' | 'spent' | 'startDate' | 'targetEndDate' | 'actualEndDate' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class Project extends Model<ProjectAttributes, ProjectCreation> implements ProjectAttributes {
  declare id: string;
  declare communityId: string;
  declare title: string;
  declare description: string | null;
  declare status: string;
  declare budget: number | null;
  declare spent: number;
  declare startDate: Date | null;
  declare targetEndDate: Date | null;
  declare actualEndDate: Date | null;
  declare createdBy: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;

  declare creator?: User;
}

Project.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  communityId: { type: DataTypes.UUID, allowNull: false, field: 'community_id', defaultValue: '00000000-0000-0000-0000-000000000001' },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'proposed' },
  budget: { type: DataTypes.DECIMAL(12, 2), allowNull: true },
  spent: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  startDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'start_date' },
  targetEndDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'target_end_date' },
  actualEndDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'actual_end_date' },
  createdBy: { type: DataTypes.UUID, allowNull: false, field: 'created_by' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
}, { sequelize, tableName: 'projects', timestamps: true, underscored: true, paranoid: true });

Project.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
