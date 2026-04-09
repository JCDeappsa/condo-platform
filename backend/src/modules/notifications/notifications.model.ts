import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';
import { Unit } from '../units/units.model';
import { NotificationRule } from './notification-rules.model';
import { NotificationTemplate } from './notification-templates.model';

interface NotificationAttributes {
  id: string;
  userId: string | null;
  unitId: string | null;
  ruleId: string | null;
  templateId: string | null;
  channel: string;
  subject: string | null;
  body: string | null;
  status: string;
  sentAt: Date | null;
  readAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
}

type NotificationCreation = Optional<NotificationAttributes, 'id' | 'userId' | 'unitId' | 'ruleId' | 'templateId' | 'subject' | 'body' | 'status' | 'sentAt' | 'readAt' | 'errorMessage' | 'createdAt'>;

export class Notification extends Model<NotificationAttributes, NotificationCreation> implements NotificationAttributes {
  declare id: string;
  declare userId: string | null;
  declare unitId: string | null;
  declare ruleId: string | null;
  declare templateId: string | null;
  declare channel: string;
  declare subject: string | null;
  declare body: string | null;
  declare status: string;
  declare sentAt: Date | null;
  declare readAt: Date | null;
  declare errorMessage: string | null;
  declare createdAt: Date;
}

Notification.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: true, field: 'user_id' },
  unitId: { type: DataTypes.UUID, allowNull: true, field: 'unit_id' },
  ruleId: { type: DataTypes.UUID, allowNull: true, field: 'rule_id' },
  templateId: { type: DataTypes.UUID, allowNull: true, field: 'template_id' },
  channel: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'email' },
  subject: { type: DataTypes.STRING(255), allowNull: true },
  body: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
  sentAt: { type: DataTypes.DATE, allowNull: true, field: 'sent_at' },
  readAt: { type: DataTypes.DATE, allowNull: true, field: 'read_at' },
  errorMessage: { type: DataTypes.TEXT, allowNull: true, field: 'error_message' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
}, {
  sequelize, tableName: 'notifications', timestamps: false, underscored: true,
});

Notification.belongsTo(User, { foreignKey: 'user_id', as: 'recipient' });
Notification.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Notification.belongsTo(NotificationRule, { foreignKey: 'rule_id', as: 'rule' });
Notification.belongsTo(NotificationTemplate, { foreignKey: 'template_id', as: 'template' });
