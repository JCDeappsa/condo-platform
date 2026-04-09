import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';
import { MaintenanceTicket } from './maintenance-tickets.model';

interface UpdateAttributes {
  id: string; ticketId: string; authorId: string; comment: string | null;
  statusChangeFrom: string | null; statusChangeTo: string | null; createdAt: Date;
}

type UpdateCreation = Optional<UpdateAttributes, 'id' | 'comment' | 'statusChangeFrom' | 'statusChangeTo' | 'createdAt'>;

export class TicketUpdate extends Model<UpdateAttributes, UpdateCreation> implements UpdateAttributes {
  declare id: string; declare ticketId: string; declare authorId: string;
  declare comment: string | null; declare statusChangeFrom: string | null;
  declare statusChangeTo: string | null; declare createdAt: Date;
  declare author?: User;
}

TicketUpdate.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  ticketId: { type: DataTypes.UUID, allowNull: false, field: 'ticket_id' },
  authorId: { type: DataTypes.UUID, allowNull: false, field: 'author_id' },
  comment: { type: DataTypes.TEXT, allowNull: true },
  statusChangeFrom: { type: DataTypes.STRING(20), allowNull: true, field: 'status_change_from' },
  statusChangeTo: { type: DataTypes.STRING(20), allowNull: true, field: 'status_change_to' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
}, { sequelize, tableName: 'maintenance_ticket_updates', timestamps: false, underscored: true });

TicketUpdate.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
TicketUpdate.belongsTo(MaintenanceTicket, { foreignKey: 'ticket_id', as: 'ticket' });
MaintenanceTicket.hasMany(TicketUpdate, { foreignKey: 'ticket_id', as: 'updates' });
