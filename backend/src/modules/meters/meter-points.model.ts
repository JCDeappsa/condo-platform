import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { Unit } from '../units/units.model';
import { MeterType } from './meter-types.model';

interface MeterPointAttributes {
  id: string;
  unitId: string;
  meterTypeId: string;
  meterSerial: string;
  locationDescription: string | null;
  isActive: boolean;
  lastReadingValue: number | null;
  lastReadingDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

type MeterPointCreation = Optional<MeterPointAttributes, 'id' | 'locationDescription' | 'isActive' | 'lastReadingValue' | 'lastReadingDate' | 'createdAt' | 'updatedAt'>;

export class MeterPoint extends Model<MeterPointAttributes, MeterPointCreation> implements MeterPointAttributes {
  declare id: string;
  declare unitId: string;
  declare meterTypeId: string;
  declare meterSerial: string;
  declare locationDescription: string | null;
  declare isActive: boolean;
  declare lastReadingValue: number | null;
  declare lastReadingDate: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare unit?: Unit;
  declare meterType?: MeterType;
}

MeterPoint.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  unitId: { type: DataTypes.UUID, allowNull: false, field: 'unit_id' },
  meterTypeId: { type: DataTypes.UUID, allowNull: false, field: 'meter_type_id' },
  meterSerial: { type: DataTypes.STRING(100), allowNull: false, field: 'meter_serial' },
  locationDescription: { type: DataTypes.STRING(255), allowNull: true, field: 'location_description' },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  lastReadingValue: { type: DataTypes.DECIMAL(12, 4), allowNull: true, field: 'last_reading_value' },
  lastReadingDate: { type: DataTypes.DATE, allowNull: true, field: 'last_reading_date' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
}, { sequelize, tableName: 'meter_points', timestamps: true, underscored: true });

MeterPoint.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
MeterPoint.belongsTo(MeterType, { foreignKey: 'meter_type_id', as: 'meterType' });
