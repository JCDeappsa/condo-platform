import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';

interface UnitAttributes {
  id: string;
  communityId: string;
  unitNumber: string;
  unitType: string;
  address: string | null;
  areaM2: number | null;
  ownerUserId: string | null;
  residentUserId: string | null;
  isOccupied: boolean;
  monthlyFee: number;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

type UnitCreationAttributes = Optional<
  UnitAttributes,
  'id' | 'unitType' | 'address' | 'areaM2' | 'ownerUserId' | 'residentUserId' | 'isOccupied' | 'notes' | 'createdAt' | 'updatedAt' | 'deletedAt'
>;

export class Unit extends Model<UnitAttributes, UnitCreationAttributes> implements UnitAttributes {
  declare id: string;
  declare communityId: string;
  declare unitNumber: string;
  declare unitType: string;
  declare address: string | null;
  declare areaM2: number | null;
  declare ownerUserId: string | null;
  declare residentUserId: string | null;
  declare isOccupied: boolean;
  declare monthlyFee: number;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;

  // Associations
  declare owner?: User;
  declare resident?: User;
}

Unit.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    communityId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'community_id',
      defaultValue: '00000000-0000-0000-0000-000000000001',
    },
    unitNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'unit_number',
    },
    unitType: {
      type: DataTypes.STRING(30),
      allowNull: false,
      defaultValue: 'house',
      field: 'unit_type',
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    areaM2: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      field: 'area_m2',
    },
    ownerUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'owner_user_id',
    },
    residentUserId: {
      type: DataTypes.UUID,
      allowNull: true,
      field: 'resident_user_id',
    },
    isOccupied: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_occupied',
    },
    monthlyFee: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'monthly_fee',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'deleted_at',
    },
  },
  {
    sequelize,
    tableName: 'units',
    timestamps: true,
    underscored: true,
    paranoid: true,
  }
);

// Associations
Unit.belongsTo(User, { foreignKey: 'owner_user_id', as: 'owner' });
Unit.belongsTo(User, { foreignKey: 'resident_user_id', as: 'resident' });
