import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';

interface HouseholdMemberAttributes {
  id: string;
  userId: string;
  fullName: string;
  relationship: string;
  dateOfBirth: Date | null;
  phone: string | null;
  email: string | null;
  dpiCui: string | null;
  isAuthorizedEntry: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type HouseholdMemberCreationAttributes = Optional<
  HouseholdMemberAttributes,
  'id' | 'dateOfBirth' | 'phone' | 'email' | 'dpiCui' | 'isAuthorizedEntry' | 'notes' | 'createdAt' | 'updatedAt'
>;

export class HouseholdMember extends Model<HouseholdMemberAttributes, HouseholdMemberCreationAttributes> implements HouseholdMemberAttributes {
  declare id: string;
  declare userId: string;
  declare fullName: string;
  declare relationship: string;
  declare dateOfBirth: Date | null;
  declare phone: string | null;
  declare email: string | null;
  declare dpiCui: string | null;
  declare isAuthorizedEntry: boolean;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

HouseholdMember.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'user_id',
    },
    fullName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'full_name',
    },
    relationship: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth',
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    dpiCui: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'dpi_cui',
    },
    isAuthorizedEntry: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_authorized_entry',
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
  },
  {
    sequelize,
    tableName: 'household_members',
    timestamps: true,
    underscored: true,
  }
);

// Associations
HouseholdMember.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(HouseholdMember, { foreignKey: 'user_id', as: 'householdMembers' });
