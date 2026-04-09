import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';
import { MeterPoint } from './meter-points.model';

interface MeterReadingAttributes {
  id: string;
  meterPointId: string;
  readingValue: number;
  readingDate: Date;
  photoUrl: string | null;
  isAnomaly: boolean;
  anomalyNotes: string | null;
  readBy: string;
  createdAt: Date;
}

type MeterReadingCreation = Optional<MeterReadingAttributes, 'id' | 'photoUrl' | 'isAnomaly' | 'anomalyNotes' | 'createdAt'>;

export class MeterReading extends Model<MeterReadingAttributes, MeterReadingCreation> implements MeterReadingAttributes {
  declare id: string;
  declare meterPointId: string;
  declare readingValue: number;
  declare readingDate: Date;
  declare photoUrl: string | null;
  declare isAnomaly: boolean;
  declare anomalyNotes: string | null;
  declare readBy: string;
  declare createdAt: Date;

  declare meterPoint?: MeterPoint;
  declare reader?: User;
}

MeterReading.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  meterPointId: { type: DataTypes.UUID, allowNull: false, field: 'meter_point_id' },
  readingValue: { type: DataTypes.DECIMAL(12, 4), allowNull: false, field: 'reading_value' },
  readingDate: { type: DataTypes.DATE, allowNull: false, field: 'reading_date' },
  photoUrl: { type: DataTypes.TEXT, allowNull: true, field: 'photo_url' },
  isAnomaly: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false, field: 'is_anomaly' },
  anomalyNotes: { type: DataTypes.TEXT, allowNull: true, field: 'anomaly_notes' },
  readBy: { type: DataTypes.UUID, allowNull: false, field: 'read_by' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
}, { sequelize, tableName: 'meter_readings', timestamps: false, underscored: true });

MeterReading.belongsTo(MeterPoint, { foreignKey: 'meter_point_id', as: 'meterPoint' });
MeterReading.belongsTo(User, { foreignKey: 'read_by', as: 'reader' });
MeterPoint.hasMany(MeterReading, { foreignKey: 'meter_point_id', as: 'readings' });
