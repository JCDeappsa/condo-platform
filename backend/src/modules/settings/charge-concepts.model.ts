import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface ChargeConceptAttributes {
  id: string;
  communityId: string;
  name: string;
  description: string | null;
  defaultAmount: number;
  isPercentage: boolean;
  percentageValue: number | null;
  frequency: 'monthly' | 'one_time' | 'annual' | 'on_demand';
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

type ChargeConceptCreationAttributes = Optional<
  ChargeConceptAttributes,
  'id' | 'description' | 'isPercentage' | 'percentageValue' | 'isActive' | 'sortOrder' | 'createdAt' | 'updatedAt'
>;

export class ChargeConcept extends Model<ChargeConceptAttributes, ChargeConceptCreationAttributes> implements ChargeConceptAttributes {
  declare id: string;
  declare communityId: string;
  declare name: string;
  declare description: string | null;
  declare defaultAmount: number;
  declare isPercentage: boolean;
  declare percentageValue: number | null;
  declare frequency: 'monthly' | 'one_time' | 'annual' | 'on_demand';
  declare isActive: boolean;
  declare sortOrder: number;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ChargeConcept.init(
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
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    defaultAmount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
      field: 'default_amount',
    },
    isPercentage: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_percentage',
    },
    percentageValue: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      field: 'percentage_value',
    },
    frequency: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'monthly',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      field: 'sort_order',
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
  },
  {
    sequelize,
    tableName: 'charge_concepts',
    timestamps: true,
    underscored: true,
  }
);
