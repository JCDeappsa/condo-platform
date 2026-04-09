import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { Vendor } from './vendors.model';
import { Project } from '../projects/projects.model';
import { User } from '../users/users.model';

interface ExpenseAttributes {
  id: string;
  communityId: string;
  vendorId: string | null;
  projectId: string | null;
  category: string;
  description: string;
  amount: number;
  expenseDate: Date;
  invoiceNumber: string | null;
  receiptUrl: string | null;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ExpenseCreation = Optional<ExpenseAttributes, 'id' | 'vendorId' | 'projectId' | 'invoiceNumber' | 'receiptUrl' | 'approvedBy' | 'createdAt' | 'updatedAt'>;

export class Expense extends Model<ExpenseAttributes, ExpenseCreation> implements ExpenseAttributes {
  declare id: string;
  declare communityId: string;
  declare vendorId: string | null;
  declare projectId: string | null;
  declare category: string;
  declare description: string;
  declare amount: number;
  declare expenseDate: Date;
  declare invoiceNumber: string | null;
  declare receiptUrl: string | null;
  declare approvedBy: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;

  declare vendor?: Vendor;
  declare project?: Project;
  declare approver?: User;
}

Expense.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  communityId: { type: DataTypes.UUID, allowNull: false, field: 'community_id', defaultValue: '00000000-0000-0000-0000-000000000001' },
  vendorId: { type: DataTypes.UUID, allowNull: true, field: 'vendor_id' },
  projectId: { type: DataTypes.UUID, allowNull: true, field: 'project_id' },
  category: { type: DataTypes.STRING(100), allowNull: false },
  description: { type: DataTypes.STRING(255), allowNull: false },
  amount: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
  expenseDate: { type: DataTypes.DATEONLY, allowNull: false, field: 'expense_date' },
  invoiceNumber: { type: DataTypes.STRING(100), allowNull: true, field: 'invoice_number' },
  receiptUrl: { type: DataTypes.TEXT, allowNull: true, field: 'receipt_url' },
  approvedBy: { type: DataTypes.UUID, allowNull: true, field: 'approved_by' },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
}, { sequelize, tableName: 'expenses', timestamps: true, underscored: true });

Expense.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
Expense.belongsTo(Project, { foreignKey: 'project_id', as: 'project' });
Expense.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });
