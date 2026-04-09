import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';

interface RoleAttributes {
  id: string;
  name: string;
  description: string | null;
  hierarchyLevel: number;
  createdAt: Date;
}

type RoleCreationAttributes = Optional<RoleAttributes, 'id' | 'description' | 'createdAt'>;

export class Role extends Model<RoleAttributes, RoleCreationAttributes> implements RoleAttributes {
  declare id: string;
  declare name: string;
  declare description: string | null;
  declare hierarchyLevel: number;
  declare createdAt: Date;
}

Role.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    hierarchyLevel: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 10,
      field: 'hierarchy_level',
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
  },
  {
    sequelize,
    tableName: 'roles',
    timestamps: false,
    underscored: true,
  }
);
