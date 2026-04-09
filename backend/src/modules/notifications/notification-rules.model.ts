import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { NotificationTemplate } from './notification-templates.model';

interface RuleAttributes {
  id: string;
  name: string;
  triggerType: string;
  daysOverdue: number | null;
  templateId: string;
  cooldownHours: number;
  requiresApproval: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

type RuleCreation = Optional<RuleAttributes, 'id' | 'daysOverdue' | 'cooldownHours' | 'requiresApproval' | 'isActive' | 'sortOrder' | 'createdAt' | 'updatedAt'>;

export class NotificationRule extends Model<RuleAttributes, RuleCreation> implements RuleAttributes {
  declare id: string;
  declare name: string;
  declare triggerType: string;
  declare daysOverdue: number | null;
  declare templateId: string;
  declare cooldownHours: number;
  declare requiresApproval: boolean;
  declare isActive: boolean;
  declare sortOrder: number;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare template?: NotificationTemplate;
}

NotificationRule.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  triggerType: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'days_overdue', field: 'trigger_type' },
  daysOverdue: { type: DataTypes.INTEGER, allowNull: true, field: 'days_overdue' },
  templateId: { type: DataTypes.UUID, allowNull: false, field: 'template_id' },
  cooldownHours: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 168, field: 'cooldown_hours' },
  requiresApproval: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'requires_approval' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'sort_order' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
}, {
  sequelize, tableName: 'notification_rules', timestamps: true, underscored: true,
});

NotificationRule.belongsTo(NotificationTemplate, { foreignKey: 'template_id', as: 'template' });
NotificationTemplate.hasMany(NotificationRule, { foreignKey: 'template_id', as: 'rules' });
