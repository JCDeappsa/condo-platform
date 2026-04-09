import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { Unit } from '../units/units.model';
import { User } from '../users/users.model';

interface PromiseAttributes {
  id: string;
  unitId: string;
  promisedAmount: number;
  promisedDate: Date;
  status: string;
  notes: string | null;
  createdBy: string;
  resolvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type PromiseCreation = Optional<PromiseAttributes, 'id' | 'status' | 'notes' | 'resolvedAt' | 'createdAt' | 'updatedAt'>;

export class PaymentPromise extends Model<PromiseAttributes, PromiseCreation> implements PromiseAttributes {
  declare id: string;
  declare unitId: string;
  declare promisedAmount: number;
  declare promisedDate: Date;
  declare status: string;
  declare notes: string | null;
  declare createdBy: string;
  declare resolvedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare unit?: Unit;
  declare creator?: User;
}

PaymentPromise.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  unitId: { type: DataTypes.UUID, allowNull: false, field: 'unit_id' },
  promisedAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, field: 'promised_amount' },
  promisedDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'promised_date' },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'active' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdBy: { type: DataTypes.UUID, allowNull: false, field: 'created_by' },
  resolvedAt: { type: DataTypes.DATE, allowNull: true, field: 'resolved_at' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
}, {
  sequelize, tableName: 'payment_promises', timestamps: true, underscored: true,
});

PaymentPromise.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
PaymentPromise.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Unit.hasMany(PaymentPromise, { foreignKey: 'unit_id', as: 'promises' });
