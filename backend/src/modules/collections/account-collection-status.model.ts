import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { Unit } from '../units/units.model';

interface CollectionStatusAttributes {
  id: string;
  unitId: string;
  totalOverdue: number;
  oldestOverdueDate: Date | null;
  daysOverdue: number;
  collectionStage: string;
  lastNotificationAt: Date | null;
  hasActivePromise: boolean;
  updatedAt: Date;
}

type CollectionStatusCreation = Optional<CollectionStatusAttributes, 'id' | 'totalOverdue' | 'oldestOverdueDate' | 'daysOverdue' | 'collectionStage' | 'lastNotificationAt' | 'hasActivePromise' | 'updatedAt'>;

export class AccountCollectionStatus extends Model<CollectionStatusAttributes, CollectionStatusCreation> implements CollectionStatusAttributes {
  declare id: string;
  declare unitId: string;
  declare totalOverdue: number;
  declare oldestOverdueDate: Date | null;
  declare daysOverdue: number;
  declare collectionStage: string;
  declare lastNotificationAt: Date | null;
  declare hasActivePromise: boolean;
  declare updatedAt: Date;
  declare unit?: Unit;
}

AccountCollectionStatus.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  unitId: { type: DataTypes.UUID, allowNull: false, unique: true, field: 'unit_id' },
  totalOverdue: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, field: 'total_overdue' },
  oldestOverdueDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'oldest_overdue_date' },
  daysOverdue: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'days_overdue' },
  collectionStage: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'current', field: 'collection_stage' },
  lastNotificationAt: { type: DataTypes.DATE, allowNull: true, field: 'last_notification_at' },
  hasActivePromise: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'has_active_promise' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
}, {
  sequelize, tableName: 'account_collection_status', timestamps: false, underscored: true,
});

AccountCollectionStatus.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Unit.hasOne(AccountCollectionStatus, { foreignKey: 'unit_id', as: 'collectionStatus' });
