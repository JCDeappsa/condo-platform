import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';

interface AuditLogAttributes {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  oldValues: object | null;
  newValues: object | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

type AuditLogCreation = Optional<AuditLogAttributes, 'id' | 'userId' | 'entityId' | 'oldValues' | 'newValues' | 'ipAddress' | 'userAgent' | 'createdAt'>;

export class AuditLog extends Model<AuditLogAttributes, AuditLogCreation> implements AuditLogAttributes {
  declare id: string;
  declare userId: string | null;
  declare action: string;
  declare entityType: string;
  declare entityId: string | null;
  declare oldValues: object | null;
  declare newValues: object | null;
  declare ipAddress: string | null;
  declare userAgent: string | null;
  declare createdAt: Date;

  declare user?: User;
}

AuditLog.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
  action: { type: DataTypes.STRING(100), allowNull: false },
  entityType: { type: DataTypes.STRING(100), allowNull: false, field: 'entity_type' },
  entityId: { type: DataTypes.UUID, allowNull: true, field: 'entity_id' },
  oldValues: { type: DataTypes.JSONB, allowNull: true, field: 'old_values' },
  newValues: { type: DataTypes.JSONB, allowNull: true, field: 'new_values' },
  ipAddress: { type: DataTypes.STRING(45), allowNull: true, field: 'ip_address' },
  userAgent: { type: DataTypes.TEXT, allowNull: true, field: 'user_agent' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
}, { sequelize, tableName: 'audit_logs', timestamps: false, underscored: true });

AuditLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
