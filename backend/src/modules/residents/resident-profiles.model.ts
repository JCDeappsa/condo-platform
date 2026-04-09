import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../../config/database';
import { User } from '../users/users.model';

interface ResidentProfileAttributes {
  id: string;
  userId: string;
  dpiCui: string | null;
  dateOfBirth: Date | null;
  nationality: string | null;
  profilePhotoUrl: string | null;
  idPhotoFrontUrl: string | null;
  idPhotoBackUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  moveInDate: Date | null;
  leaseEndDate: Date | null;
  isRenter: boolean;
  leaseDocumentUrl: string | null;
  ownershipDocumentUrl: string | null;
  hasPets: boolean;
  petsDescription: string | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

type ResidentProfileCreationAttributes = Optional<
  ResidentProfileAttributes,
  | 'id'
  | 'dpiCui'
  | 'dateOfBirth'
  | 'nationality'
  | 'profilePhotoUrl'
  | 'idPhotoFrontUrl'
  | 'idPhotoBackUrl'
  | 'emergencyContactName'
  | 'emergencyContactPhone'
  | 'emergencyContactRelationship'
  | 'moveInDate'
  | 'leaseEndDate'
  | 'isRenter'
  | 'leaseDocumentUrl'
  | 'ownershipDocumentUrl'
  | 'hasPets'
  | 'petsDescription'
  | 'notes'
  | 'createdAt'
  | 'updatedAt'
>;

export class ResidentProfile extends Model<ResidentProfileAttributes, ResidentProfileCreationAttributes> implements ResidentProfileAttributes {
  declare id: string;
  declare userId: string;
  declare dpiCui: string | null;
  declare dateOfBirth: Date | null;
  declare nationality: string | null;
  declare profilePhotoUrl: string | null;
  declare idPhotoFrontUrl: string | null;
  declare idPhotoBackUrl: string | null;
  declare emergencyContactName: string | null;
  declare emergencyContactPhone: string | null;
  declare emergencyContactRelationship: string | null;
  declare moveInDate: Date | null;
  declare leaseEndDate: Date | null;
  declare isRenter: boolean;
  declare leaseDocumentUrl: string | null;
  declare ownershipDocumentUrl: string | null;
  declare hasPets: boolean;
  declare petsDescription: string | null;
  declare notes: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

ResidentProfile.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      field: 'user_id',
    },
    dpiCui: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'dpi_cui',
    },
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'date_of_birth',
    },
    nationality: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    profilePhotoUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'profile_photo_url',
    },
    idPhotoFrontUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'id_photo_front_url',
    },
    idPhotoBackUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'id_photo_back_url',
    },
    emergencyContactName: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'emergency_contact_name',
    },
    emergencyContactPhone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      field: 'emergency_contact_phone',
    },
    emergencyContactRelationship: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'emergency_contact_relationship',
    },
    moveInDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'move_in_date',
    },
    leaseEndDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'lease_end_date',
    },
    isRenter: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'is_renter',
    },
    leaseDocumentUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'lease_document_url',
    },
    ownershipDocumentUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'ownership_document_url',
    },
    hasPets: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      field: 'has_pets',
    },
    petsDescription: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'pets_description',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'created_at',
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'updated_at',
    },
  },
  {
    sequelize,
    tableName: 'resident_profiles',
    timestamps: true,
    underscored: true,
  }
);

// Associations
ResidentProfile.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasOne(ResidentProfile, { foreignKey: 'user_id', as: 'residentProfile' });
