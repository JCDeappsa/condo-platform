import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';
import { MaintenanceTicket } from './maintenance-tickets.model';

interface PhotoAttributes {
  id: string; ticketId: string; updateId: string | null; fileUrl: string;
  fileName: string | null; photoType: string; uploadedBy: string; createdAt: Date;
}

type PhotoCreation = Optional<PhotoAttributes, 'id' | 'updateId' | 'fileName' | 'photoType' | 'createdAt'>;

export class TicketPhoto extends Model<PhotoAttributes, PhotoCreation> implements PhotoAttributes {
  declare id: string; declare ticketId: string; declare updateId: string | null;
  declare fileUrl: string; declare fileName: string | null; declare photoType: string;
  declare uploadedBy: string; declare createdAt: Date;
}

TicketPhoto.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ticketId: { type: DataTypes.UUID, allowNull: false, field: 'ticket_id' },
  updateId: { type: DataTypes.UUID, allowNull: true, field: 'update_id' },
  fileUrl: { type: DataTypes.TEXT, allowNull: false, field: 'file_url' },
  fileName: { type: DataTypes.STRING(255), allowNull: true, field: 'file_name' },
  photoType: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'general', field: 'photo_type' },
  uploadedBy: { type: DataTypes.UUID, allowNull: false, field: 'uploaded_by' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
}, { sequelize, tableName: 'maintenance_ticket_photos', timestamps: false, underscored: true });

TicketPhoto.belongsTo(MaintenanceTicket, { foreignKey: 'ticket_id', as: 'ticket' });
TicketPhoto.belongsTo(User, { foreignKey: 'uploaded_by', as: 'uploader' });
MaintenanceTicket.hasMany(TicketPhoto, { foreignKey: 'ticket_id', as: 'photos' });
