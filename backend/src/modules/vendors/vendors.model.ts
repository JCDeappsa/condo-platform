import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface VendorAttributes {
  id: string;
  communityId: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  category: string | null;
  isActive: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

type VendorCreation = Optional<VendorAttributes, 'id' | 'contactName' | 'phone' | 'email' | 'taxId' | 'category' | 'isActive' | 'notes' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export class Vendor extends Model<VendorAttributes, VendorCreation> implements VendorAttributes {
  declare id: string;
  declare communityId: string;
  declare name: string;
  declare contactName: string | null;
  declare phone: string | null;
  declare email: string | null;
  declare taxId: string | null;
  declare category: string | null;
  declare isActive: boolean;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

Vendor.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  communityId: { type: DataTypes.UUID, allowNull: false, field: 'community_id', defaultValue: '00000000-0000-0000-0000-000000000001' },
  name: { type: DataTypes.STRING(255), allowNull: false },
  contactName: { type: DataTypes.STRING(255), allowNull: true, field: 'contact_name' },
  phone: { type: DataTypes.STRING(20), allowNull: true },
  email: { type: DataTypes.STRING(255), allowNull: true },
  taxId: { type: DataTypes.STRING(50), allowNull: true, field: 'tax_id' },
  category: { type: DataTypes.STRING(100), allowNull: true },
  isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true, field: 'is_active' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'updated_at' },
  deletedAt: { type: DataTypes.DATE, allowNull: true, field: 'deleted_at' },
}, { sequelize, tableName: 'vendors', timestamps: true, underscored: true, paranoid: true });
