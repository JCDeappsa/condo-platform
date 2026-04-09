import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';

interface VehicleAttributes {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  plateNumber: string;
  vehicleType: string;
  parkingSticker: string | null;
  isActive: boolean;
  photoUrl: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type VehicleCreationAttributes = Optional<
  VehicleAttributes,
  'id' | 'year' | 'color' | 'vehicleType' | 'parkingSticker' | 'isActive' | 'photoUrl' | 'notes' | 'createdAt' | 'updatedAt'
>;

export class Vehicle extends Model<VehicleAttributes, VehicleCreationAttributes> implements VehicleAttributes {
  declare id: string;
  declare userId: string;
  declare make: string;
  declare model: string;
  declare year: number | null;
  declare color: string | null;
  declare plateNumber: string;
  declare vehicleType: string;
  declare parkingSticker: string | null;
  declare isActive: boolean;
  declare photoUrl: string | null;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Vehicle.init(
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
    make: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    model: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    color: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    plateNumber: {
      type: DataTypes.STRING(20),
      allowNull: false,
      field: 'plate_number',
    },
    vehicleType: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'car',
      field: 'vehicle_type',
    },
    parkingSticker: {
      type: DataTypes.STRING(50),
      allowNull: true,
      field: 'parking_sticker',
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      field: 'is_active',
    },
    photoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'photo_url',
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
    tableName: 'vehicles',
    timestamps: true,
    underscored: true,
  }
);

// Associations
Vehicle.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Vehicle, { foreignKey: 'user_id', as: 'vehicles' });
