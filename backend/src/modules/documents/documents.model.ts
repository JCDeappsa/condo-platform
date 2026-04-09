import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';

interface DocumentAttributes {
  id: string;
  communityId: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number | null;
  visibility: string;
  uploadedBy: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

type DocumentCreation = Optional<DocumentAttributes, 'id' | 'description' | 'fileSizeBytes' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class Document extends Model<DocumentAttributes, DocumentCreation> implements DocumentAttributes {
  declare id: string;
  declare communityId: string;
  declare title: string;
  declare description: string | null;
  declare category: string;
  declare fileUrl: string;
  declare fileName: string;
  declare fileSizeBytes: number | null;
  declare visibility: string;
  declare uploadedBy: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;

  declare uploader?: User;
}

Document.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  communityId: { type: DataTypes.UUID, allowNull: false, field: 'community_id', defaultValue: '00000000-0000-0000-0000-000000000001' },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.STRING(100), allowNull: false },
  fileUrl: { type: DataTypes.TEXT, allowNull: false, field: 'file_url' },
  fileName: { type: DataTypes.STRING(255), allowNull: false, field: 'file_name' },
  fileSizeBytes: { type: DataTypes.INTEGER, allowNull: true, field: 'file_size_bytes' },
  visibility: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'all' },
  uploadedBy: { type: DataTypes.UUID, allowNull: false, field: 'uploaded_by' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
}, { sequelize, tableName: 'documents', timestamps: true, underscored: true, paranoid: true });

Document.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
