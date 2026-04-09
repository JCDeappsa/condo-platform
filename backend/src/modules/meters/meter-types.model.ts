import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface MeterTypeAttributes {
  id: string;
  name: string;
  unitOfMeasure: string;
  anomalyThresholdPct: number;
  createdAt: Date;
}

type MeterTypeCreation = Optional<MeterTypeAttributes, 'id' | 'anomalyThresholdPct' | 'createdAt'>;

export class MeterType extends Model<MeterTypeAttributes, MeterTypeCreation> implements MeterTypeAttributes {
  declare id: string;
  declare name: string;
  declare unitOfMeasure: string;
  declare anomalyThresholdPct: number;
  declare createdAt: Date;
}

MeterType.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  unitOfMeasure: { type: DataTypes.STRING(50), allowNull: false, field: 'unit_of_measure' },
  anomalyThresholdPct: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 50, field: 'anomaly_threshold_pct' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
}, { sequelize, tableName: 'meter_types', timestamps: false, underscored: true });
