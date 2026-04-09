import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface TemplateAttributes {
  id: string;
  name: string;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  channel: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type TemplateCreation = Optional<TemplateAttributes, 'id' | 'bodyText' | 'channel' | 'isActive' | 'createdAt' | 'updatedAt'>;

export class NotificationTemplate extends Model<TemplateAttributes, TemplateCreation> implements TemplateAttributes {
  declare id: string;
  declare name: string;
  declare subject: string;
  declare bodyHtml: string;
  declare bodyText: string | null;
  declare channel: string;
  declare isActive: boolean;
  declare createdAt: Date;
  declare updatedAt: Date;
}

NotificationTemplate.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  subject: { type: DataTypes.STRING(255), allowNull: false },
  bodyHtml: { type: DataTypes.TEXT, allowNull: false, field: 'body_html' },
  bodyText: { type: DataTypes.TEXT, allowNull: true, field: 'body_text' },
  channel: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'email' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
}, {
  sequelize, tableName: 'notification_templates', timestamps: true, underscored: true,
});
