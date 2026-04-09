import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';

interface AnnouncementAttributes {
  id: string;
  communityId: string;
  title: string;
  body: string;
  priority: string;
  publishAt: Date;
  expiresAt: Date | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

type AnnouncementCreation = Optional<AnnouncementAttributes, 'id' | 'priority' | 'expiresAt' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class Announcement extends Model<AnnouncementAttributes, AnnouncementCreation> implements AnnouncementAttributes {
  declare id: string;
  declare communityId: string;
  declare title: string;
  declare body: string;
  declare priority: string;
  declare publishAt: Date;
  declare expiresAt: Date | null;
  declare authorId: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;

  declare author?: User;
}

Announcement.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  communityId: { type: DataTypes.UUID, allowNull: false, field: 'community_id', defaultValue: '00000000-0000-0000-0000-000000000001' },
  title: { type: DataTypes.STRING(255), allowNull: false },
  body: { type: DataTypes.TEXT, allowNull: false },
  priority: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'normal' },
  publishAt: { type: DataTypes.DATE, allowNull: false, field: 'publish_at' },
  expiresAt: { type: DataTypes.DATE, allowNull: true, field: 'expires_at' },
  authorId: { type: DataTypes.UUID, allowNull: false, field: 'author_id' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
}, { sequelize, tableName: 'announcements', timestamps: true, underscored: true, paranoid: true });

Announcement.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
