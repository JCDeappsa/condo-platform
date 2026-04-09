import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { Unit } from '../units/units.model';
import { MonthlyCharge } from '../billing/monthly-charges.model';
import { Payment } from './payments.model';

interface AccountMovementAttributes {
  id: string;
  unitId: string;
  monthlyChargeId: string | null;
  paymentId: string | null;
  movementType: string;
  amount: number;
  runningBalance: number;
  description: string | null;
  createdAt: Date;
}

type AccountMovementCreation = Optional<AccountMovementAttributes, 'id' | 'monthlyChargeId' | 'paymentId' | 'runningBalance' | 'description' | 'createdAt'>;

export class AccountMovement extends Model<AccountMovementAttributes, AccountMovementCreation> implements AccountMovementAttributes {
  declare id: string;
  declare unitId: string;
  declare monthlyChargeId: string | null;
  declare paymentId: string | null;
  declare movementType: string;
  declare amount: number;
  declare runningBalance: number;
  declare description: string | null;
  declare createdAt: Date;

  declare unit?: Unit;
  declare charge?: MonthlyCharge;
  declare payment?: Payment;
}

AccountMovement.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    unitId: { type: DataTypes.UUID, allowNull: false, field: 'unit_id' },
    monthlyChargeId: { type: DataTypes.UUID, allowNull: true, field: 'monthly_charge_id' },
    paymentId: { type: DataTypes.UUID, allowNull: true, field: 'payment_id' },
    movementType: { type: DataTypes.STRING(20), allowNull: false, field: 'movement_type' },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    runningBalance: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0, field: 'running_balance' },
    description: { type: DataTypes.STRING(255), allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  },
  {
    sequelize,
    tableName: 'account_movements',
    timestamps: false,
    underscored: true,
  }
);

AccountMovement.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
AccountMovement.belongsTo(MonthlyCharge, { foreignKey: 'monthly_charge_id', as: 'charge' });
AccountMovement.belongsTo(Payment, { foreignKey: 'payment_id', as: 'payment' });
Unit.hasMany(AccountMovement, { foreignKey: 'unit_id', as: 'movements' });
