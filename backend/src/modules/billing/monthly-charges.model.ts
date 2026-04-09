import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { Unit } from '../units/units.model';

interface MonthlyChargeAttributes {
  id: string;
  unitId: string;
  period: string;
  description: string;
  amount: number;
  dueDate: Date;
  status: string;
  paidAmount: number;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

type MonthlyChargeCreation = Optional<MonthlyChargeAttributes, 'id' | 'status' | 'paidAmount' | 'generatedAt' | 'createdAt' | 'updatedAt'>;

export class MonthlyCharge extends Model<MonthlyChargeAttributes, MonthlyChargeCreation> implements MonthlyChargeAttributes {
  declare id: string;
  declare unitId: string;
  declare period: string;
  declare description: string;
  declare amount: number;
  declare dueDate: Date;
  declare status: string;
  declare paidAmount: number;
  declare generatedAt: Date;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare unit?: Unit;
}

MonthlyCharge.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    unitId: { type: DataTypes.UUID, allowNull: false, field: 'unit_id' },
    period: { type: DataTypes.STRING(7), allowNull: false },
    description: { type: DataTypes.STRING(255), allowNull: false },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    dueDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'due_date' },
    status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'pending' },
    paidAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, field: 'paid_amount' },
    generatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'generated_at' },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  },
  {
    sequelize,
    tableName: 'monthly_charges',
    timestamps: true,
    underscored: true,
  }
);

MonthlyCharge.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Unit.hasMany(MonthlyCharge, { foreignKey: 'unit_id', as: 'charges' });
