import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { Unit } from '../units/units.model';
import { User } from '../users/users.model';

interface PaymentAttributes {
  id: string;
  unitId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string;
  referenceNumber: string | null;
  bankReference: string | null;
  notes: string | null;
  receiptUrl: string | null;
  reconciled: boolean;
  reconciledAt: Date | null;
  recordedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type PaymentCreation = Optional<PaymentAttributes, 'id' | 'referenceNumber' | 'bankReference' | 'notes' | 'receiptUrl' | 'reconciled' | 'reconciledAt' | 'recordedBy' | 'createdAt' | 'updatedAt'>;

export class Payment extends Model<PaymentAttributes, PaymentCreation> implements PaymentAttributes {
  declare id: string;
  declare unitId: string;
  declare amount: number;
  declare paymentDate: Date;
  declare paymentMethod: string;
  declare referenceNumber: string | null;
  declare bankReference: string | null;
  declare notes: string | null;
  declare receiptUrl: string | null;
  declare reconciled: boolean;
  declare reconciledAt: Date | null;
  declare recordedBy: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare unit?: Unit;
  declare recorder?: User;
}

Payment.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    unitId: { type: DataTypes.UUID, allowNull: false, field: 'unit_id' },
    amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    paymentDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'payment_date' },
    paymentMethod: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'bank_transfer', field: 'payment_method' },
    referenceNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'reference_number' },
    bankReference: { type: DataTypes.STRING(100), allowNull: true, field: 'bank_reference' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    receiptUrl: { type: DataTypes.TEXT, allowNull: true, field: 'receipt_url' },
    reconciled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    reconciledAt: { type: DataTypes.DATE, allowNull: true, field: 'reconciled_at' },
    recordedBy: { type: DataTypes.UUID, allowNull: true, field: 'recorded_by' },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  },
  {
    sequelize,
    tableName: 'payments',
    timestamps: true,
    underscored: true,
  }
);

Payment.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
Payment.belongsTo(User, { foreignKey: 'recorded_by', as: 'recorder' });
Unit.hasMany(Payment, { foreignKey: 'unit_id', as: 'payments' });
