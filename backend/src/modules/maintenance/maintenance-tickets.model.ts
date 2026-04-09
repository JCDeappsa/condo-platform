import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';
import { Unit } from '../units/units.model';

interface TicketAttributes {
  id: string; communityId: string; title: string; description: string | null;
  category: string; priority: string; status: string; location: string | null;
  reportedBy: string; assignedTo: string | null; unitId: string | null;
  dueDate: Date | null; completedAt: Date | null; closingNotes: string | null;
  materialsUsed: string | null; laborHours: number | null;
  createdAt: Date; updatedAt: Date; deletedAt: Date | null;
}

type TicketCreation = Optional<TicketAttributes, 'id' | 'description' | 'category' | 'priority' | 'status' | 'location' | 'assignedTo' | 'unitId' | 'dueDate' | 'completedAt' | 'closingNotes' | 'materialsUsed' | 'laborHours' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class MaintenanceTicket extends Model<TicketAttributes, TicketCreation> implements TicketAttributes {
  declare id: string; declare communityId: string; declare title: string;
  declare description: string | null; declare category: string; declare priority: string;
  declare status: string; declare location: string | null; declare reportedBy: string;
  declare assignedTo: string | null; declare unitId: string | null;
  declare dueDate: Date | null; declare completedAt: Date | null;
  declare closingNotes: string | null; declare materialsUsed: string | null;
  declare laborHours: number | null;
  declare createdAt: Date; declare updatedAt: Date; declare deletedAt: Date | null;
  declare reporter?: User; declare assignee?: User; declare unit?: Unit;
}

MaintenanceTicket.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  communityId: { type: DataTypes.UUID, allowNull: false, field: 'community_id', defaultValue: '00000000-0000-0000-0000-000000000001' },
  title: { type: DataTypes.STRING(255), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'general' },
  priority: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'medium' },
  status: { type: DataTypes.STRING(20), allowNull: false, defaultValue: 'open' },
  location: { type: DataTypes.STRING(255), allowNull: true },
  reportedBy: { type: DataTypes.UUID, allowNull: false, field: 'reported_by' },
  assignedTo: { type: DataTypes.UUID, allowNull: true, field: 'assigned_to' },
  unitId: { type: DataTypes.UUID, allowNull: true, field: 'unit_id' },
  dueDate: { type: DataTypes.DATEONLY, allowNull: true, field: 'due_date' },
  completedAt: { type: DataTypes.DATE, allowNull: true, field: 'completed_at' },
  closingNotes: { type: DataTypes.TEXT, allowNull: true, field: 'closing_notes' },
  materialsUsed: { type: DataTypes.TEXT, allowNull: true, field: 'materials_used' },
  laborHours: { type: DataTypes.DECIMAL(5, 2), allowNull: true, field: 'labor_hours' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
}, { sequelize, tableName: 'maintenance_tickets', timestamps: true, underscored: true, paranoid: true });

MaintenanceTicket.belongsTo(User, { foreignKey: 'reported_by', as: 'reporter' });
MaintenanceTicket.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignee' });
MaintenanceTicket.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
