import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { Unit } from '../units/units.model';
import { User } from '../users/users.model';

interface NoteAttributes {
  id: string;
  unitId: string;
  authorId: string;
  note: string;
  createdAt: Date;
}

type NoteCreation = Optional<NoteAttributes, 'id' | 'createdAt'>;

export class CollectionNote extends Model<NoteAttributes, NoteCreation> implements NoteAttributes {
  declare id: string;
  declare unitId: string;
  declare authorId: string;
  declare note: string;
  declare createdAt: Date;
  declare author?: User;
}

CollectionNote.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  unitId: { type: DataTypes.UUID, allowNull: false, field: 'unit_id' },
  authorId: { type: DataTypes.UUID, allowNull: false, field: 'author_id' },
  note: { type: DataTypes.TEXT, allowNull: false },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW, field: 'created_at' },
}, {
  sequelize, tableName: 'collection_notes', timestamps: false, underscored: true,
});

CollectionNote.belongsTo(Unit, { foreignKey: 'unit_id', as: 'unit' });
CollectionNote.belongsTo(User, { foreignKey: 'author_id', as: 'author' });
Unit.hasMany(CollectionNote, { foreignKey: 'unit_id', as: 'collectionNotes' });
