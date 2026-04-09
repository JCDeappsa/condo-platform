import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiGet, api, apiPost, apiPatch, apiDelete } from '../../lib/api';
import { es } from '../../i18n/es';
import { ArrowLeft, ClipboardList, Plus, Pencil, Trash2, X, Check, Car, Users, Home, User as UserIcon } from 'lucide-react';
import type { ResidentProfile as ProfileType, HouseholdMember, Vehicle } from '../../types';
import { useAuth } from '../../lib/auth';
import { useConfirm } from '../../components/ui/ConfirmDialog';

type Tab = 'personal' | 'residence' | 'household' | 'vehicles';

const t = es.residentProfile;

const RELATIONSHIP_OPTIONS = [
  { value: 'spouse', label: t.relationships.spouse },
  { value: 'child', label: t.relationships.child },
  { value: 'parent', label: t.relationships.parent },
  { value: 'sibling', label: t.relationships.sibling },
  { value: 'grandparent', label: t.relationships.grandparent },
  { value: 'grandchild', label: t.relationships.grandchild },
  { value: 'other', label: t.relationships.other },
];

const VEHICLE_TYPE_OPTIONS = [
  { value: 'car', label: t.vehicleTypes.car },
  { value: 'truck', label: t.vehicleTypes.truck },
  { value: 'suv', label: t.vehicleTypes.suv },
  { value: 'motorcycle', label: t.vehicleTypes.motorcycle },
  { value: 'other', label: t.vehicleTypes.other },
];

interface ProfileFormData {
  dpiCui: string;
  dateOfBirth: string;
  nationality: string;
  profilePhotoUrl: string;
  idPhotoFrontUrl: string;
  idPhotoBackUrl: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;
}

interface ResidenceFormData {
  moveInDate: string;
  leaseEndDate: string;
  isRenter: boolean;
  leaseDocumentUrl: string;
  ownershipDocumentUrl: string;
  hasPets: boolean;
  petsDescription: string;
  notes: string;
}

interface MemberFormData {
  fullName: string;
  relationship: string;
  dateOfBirth: string;
  phone: string;
  email: string;
  dpiCui: string;
  isAuthorizedEntry: boolean;
  notes: string;
}

interface VehicleFormData {
  make: string;
  model: string;
  year: string;
  color: string;
  plateNumber: string;
  vehicleType: string;
  parkingSticker: string;
  isActive: boolean;
  photoUrl: string;
  notes: string;
}

const emptyMemberForm: MemberFormData = {
  fullName: '', relationship: 'spouse', dateOfBirth: '', phone: '', email: '', dpiCui: '', isAuthorizedEntry: false, notes: '',
};

const emptyVehicleForm: VehicleFormData = {
  make: '', model: '', year: '', color: '', plateNumber: '', vehicleType: 'car', parkingSticker: '', isActive: true, photoUrl: '', notes: '',
};

export function ResidentProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  useAuth();
  const { confirm: confirmDialog, alert: showAlert } = useConfirm();

  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('personal');
  const [_profile, setProfile] = useState<ProfileType | null>(null);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  // Profile form states
  const [personalForm, setPersonalForm] = useState<ProfileFormData>({
    dpiCui: '', dateOfBirth: '', nationality: '', profilePhotoUrl: '', idPhotoFrontUrl: '', idPhotoBackUrl: '',
    emergencyContactName: '', emergencyContactPhone: '', emergencyContactRelationship: '',
  });
  const [residenceForm, setResidenceForm] = useState<ResidenceFormData>({
    moveInDate: '', leaseEndDate: '', isRenter: false, leaseDocumentUrl: '', ownershipDocumentUrl: '',
    hasPets: false, petsDescription: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<HouseholdMember | null>(null);
  const [memberForm, setMemberForm] = useState<MemberFormData>(emptyMemberForm);
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [memberError, setMemberError] = useState<string | null>(null);

  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormData>(emptyVehicleForm);
  const [vehicleSubmitting, setVehicleSubmitting] = useState(false);
  const [vehicleError, setVehicleError] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, [userId]);

  const loadAll = async () => {
    try {
      const res = await apiGet<{ success: boolean; data: { profile: ProfileType; householdMembers: HouseholdMember[]; vehicles: Vehicle[] } }>(`/residents/profile/${userId}`);
      const { profile: p, householdMembers: hm, vehicles: v } = res.data;
      setProfile(p);
      setHouseholdMembers(hm);
      setVehicles(v);
      setPersonalForm({
        dpiCui: p.dpiCui || '',
        dateOfBirth: p.dateOfBirth || '',
        nationality: p.nationality || '',
        profilePhotoUrl: p.profilePhotoUrl || '',
        idPhotoFrontUrl: p.idPhotoFrontUrl || '',
        idPhotoBackUrl: p.idPhotoBackUrl || '',
        emergencyContactName: p.emergencyContactName || '',
        emergencyContactPhone: p.emergencyContactPhone || '',
        emergencyContactRelationship: p.emergencyContactRelationship || '',
      });
      setResidenceForm({
        moveInDate: p.moveInDate || '',
        leaseEndDate: p.leaseEndDate || '',
        isRenter: p.isRenter,
        leaseDocumentUrl: p.leaseDocumentUrl || '',
        ownershipDocumentUrl: p.ownershipDocumentUrl || '',
        hasPets: p.hasPets,
        petsDescription: p.petsDescription || '',
        notes: p.notes || '',
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePersonal = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api(`/residents/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          dpiCui: personalForm.dpiCui || null,
          dateOfBirth: personalForm.dateOfBirth || null,
          nationality: personalForm.nationality || null,
          profilePhotoUrl: personalForm.profilePhotoUrl || null,
          idPhotoFrontUrl: personalForm.idPhotoFrontUrl || null,
          idPhotoBackUrl: personalForm.idPhotoBackUrl || null,
          emergencyContactName: personalForm.emergencyContactName || null,
          emergencyContactPhone: personalForm.emergencyContactPhone || null,
          emergencyContactRelationship: personalForm.emergencyContactRelationship || null,
        }),
      });
      setSuccess(es.common.successSaved);
      loadAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveResidence = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api(`/residents/profile/${userId}`, {
        method: 'PUT',
        body: JSON.stringify({
          moveInDate: residenceForm.moveInDate || null,
          leaseEndDate: residenceForm.leaseEndDate || null,
          isRenter: residenceForm.isRenter,
          leaseDocumentUrl: residenceForm.leaseDocumentUrl || null,
          ownershipDocumentUrl: residenceForm.ownershipDocumentUrl || null,
          hasPets: residenceForm.hasPets,
          petsDescription: residenceForm.petsDescription || null,
          notes: residenceForm.notes || null,
        }),
      });
      setSuccess(es.common.successSaved);
      loadAll();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Household Member CRUD ──────────────────────────────

  const openAddMember = () => {
    setEditingMember(null);
    setMemberForm(emptyMemberForm);
    setMemberError(null);
    setShowMemberModal(true);
  };

  const openEditMember = (m: HouseholdMember) => {
    setEditingMember(m);
    setMemberForm({
      fullName: m.fullName,
      relationship: m.relationship,
      dateOfBirth: m.dateOfBirth || '',
      phone: m.phone || '',
      email: m.email || '',
      dpiCui: m.dpiCui || '',
      isAuthorizedEntry: m.isAuthorizedEntry,
      notes: m.notes || '',
    });
    setMemberError(null);
    setShowMemberModal(true);
  };

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMemberSubmitting(true);
    setMemberError(null);
    try {
      const payload = {
        fullName: memberForm.fullName,
        relationship: memberForm.relationship,
        dateOfBirth: memberForm.dateOfBirth || null,
        phone: memberForm.phone || null,
        email: memberForm.email || null,
        dpiCui: memberForm.dpiCui || null,
        isAuthorizedEntry: memberForm.isAuthorizedEntry,
        notes: memberForm.notes || null,
      };
      if (editingMember) {
        await apiPatch(`/residents/household/${editingMember.id}`, payload);
      } else {
        await apiPost(`/residents/profile/${userId}/household`, payload);
      }
      setShowMemberModal(false);
      loadAll();
    } catch (err: any) {
      setMemberError(err.message);
    } finally {
      setMemberSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string) => {
    const ok = await confirmDialog({ title: 'Eliminar Familiar', message: es.common.confirmDelete, type: 'danger', confirmText: 'Eliminar' });
    if (!ok) return;
    try {
      await apiDelete(`/residents/household/${id}`);
      showAlert('Familiar eliminado.', 'success');
      loadAll();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  // ── Vehicle CRUD ───────────────────────────────────────

  const openAddVehicle = () => {
    setEditingVehicle(null);
    setVehicleForm(emptyVehicleForm);
    setVehicleError(null);
    setShowVehicleModal(true);
  };

  const openEditVehicle = (v: Vehicle) => {
    setEditingVehicle(v);
    setVehicleForm({
      make: v.make,
      model: v.model,
      year: v.year ? String(v.year) : '',
      color: v.color || '',
      plateNumber: v.plateNumber,
      vehicleType: v.vehicleType,
      parkingSticker: v.parkingSticker || '',
      isActive: v.isActive,
      photoUrl: v.photoUrl || '',
      notes: v.notes || '',
    });
    setVehicleError(null);
    setShowVehicleModal(true);
  };

  const handleVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setVehicleSubmitting(true);
    setVehicleError(null);
    try {
      const payload = {
        make: vehicleForm.make,
        model: vehicleForm.model,
        year: vehicleForm.year ? parseInt(vehicleForm.year) : null,
        color: vehicleForm.color || null,
        plateNumber: vehicleForm.plateNumber,
        vehicleType: vehicleForm.vehicleType,
        parkingSticker: vehicleForm.parkingSticker || null,
        isActive: vehicleForm.isActive,
        photoUrl: vehicleForm.photoUrl || null,
        notes: vehicleForm.notes || null,
      };
      if (editingVehicle) {
        await apiPatch(`/residents/vehicles/${editingVehicle.id}`, payload);
      } else {
        await apiPost(`/residents/profile/${userId}/vehicles`, payload);
      }
      setShowVehicleModal(false);
      loadAll();
    } catch (err: any) {
      setVehicleError(err.message);
    } finally {
      setVehicleSubmitting(false);
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    const ok = await confirmDialog({ title: 'Eliminar Vehículo', message: es.common.confirmDelete, type: 'danger', confirmText: 'Eliminar' });
    if (!ok) return;
    try {
      await apiDelete(`/residents/vehicles/${id}`);
      showAlert('Vehículo eliminado.', 'success');
      loadAll();
    } catch (err: any) {
      showAlert(err.message, 'error');
    }
  };

  const getRelationshipLabel = (value: string) =>
    t.relationships[value as keyof typeof t.relationships] || value;

  const getVehicleTypeLabel = (value: string) =>
    t.vehicleTypes[value as keyof typeof t.vehicleTypes] || value;

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'personal', label: t.personalInfo, icon: <UserIcon size={16} /> },
    { key: 'residence', label: t.residenceInfo, icon: <Home size={16} /> },
    { key: 'household', label: t.household, icon: <Users size={16} /> },
    { key: 'vehicles', label: t.vehicles, icon: <Car size={16} /> },
  ];

  const inputClass = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none';
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div>
      <Link to="/users" className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm mb-4">
        <ArrowLeft size={16} />
        {es.common.back}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="text-blue-600" size={28} />
        <h1 className="text-2xl font-bold text-gray-900">{t.title}</h1>
      </div>

      {error && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{error}</div>}
      {success && <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-4">{success}</div>}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map(tb => (
          <button
            key={tb.key}
            onClick={() => { setTab(tb.key); setError(null); setSuccess(null); }}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              tab === tb.key ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tb.icon}
            {tb.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        {/* ── Personal Info Tab ── */}
        {tab === 'personal' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>{t.dpiCui}</label>
                <input type="text" value={personalForm.dpiCui} onChange={e => setPersonalForm(p => ({ ...p, dpiCui: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t.dateOfBirth}</label>
                <input type="date" value={personalForm.dateOfBirth} onChange={e => setPersonalForm(p => ({ ...p, dateOfBirth: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t.nationality}</label>
                <input type="text" value={personalForm.nationality} onChange={e => setPersonalForm(p => ({ ...p, nationality: e.target.value }))} className={inputClass} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>{t.profilePhoto} (URL)</label>
                <input type="text" value={personalForm.profilePhotoUrl} onChange={e => setPersonalForm(p => ({ ...p, profilePhotoUrl: e.target.value }))} className={inputClass} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>{t.idPhotoFront} (URL)</label>
                <input type="text" value={personalForm.idPhotoFrontUrl} onChange={e => setPersonalForm(p => ({ ...p, idPhotoFrontUrl: e.target.value }))} className={inputClass} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>{t.idPhotoBack} (URL)</label>
                <input type="text" value={personalForm.idPhotoBackUrl} onChange={e => setPersonalForm(p => ({ ...p, idPhotoBackUrl: e.target.value }))} className={inputClass} placeholder="https://..." />
              </div>
            </div>

            <h3 className="text-md font-semibold text-gray-800 pt-2">{t.emergencyContact}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>{t.emergencyName}</label>
                <input type="text" value={personalForm.emergencyContactName} onChange={e => setPersonalForm(p => ({ ...p, emergencyContactName: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t.emergencyPhone}</label>
                <input type="text" value={personalForm.emergencyContactPhone} onChange={e => setPersonalForm(p => ({ ...p, emergencyContactPhone: e.target.value }))} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t.emergencyRelationship}</label>
                <input type="text" value={personalForm.emergencyContactRelationship} onChange={e => setPersonalForm(p => ({ ...p, emergencyContactRelationship: e.target.value }))} className={inputClass} />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={handleSavePersonal} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                <Check size={16} />
                {saving ? es.common.loading : es.common.save}
              </button>
            </div>
          </div>
        )}

        {/* ── Residence Tab ── */}
        {tab === 'residence' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>{t.moveInDate}</label>
                <input type="date" value={residenceForm.moveInDate} onChange={e => setResidenceForm(p => ({ ...p, moveInDate: e.target.value }))} className={inputClass} />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input type="checkbox" checked={residenceForm.isRenter} onChange={e => setResidenceForm(p => ({ ...p, isRenter: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">{t.isRenter}</span>
              </div>
              {residenceForm.isRenter && (
                <div>
                  <label className={labelClass}>{t.leaseEndDate}</label>
                  <input type="date" value={residenceForm.leaseEndDate} onChange={e => setResidenceForm(p => ({ ...p, leaseEndDate: e.target.value }))} className={inputClass} />
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>{t.leaseDocument} (URL)</label>
                <input type="text" value={residenceForm.leaseDocumentUrl} onChange={e => setResidenceForm(p => ({ ...p, leaseDocumentUrl: e.target.value }))} className={inputClass} placeholder="https://..." />
              </div>
              <div>
                <label className={labelClass}>{t.ownershipDocument} (URL)</label>
                <input type="text" value={residenceForm.ownershipDocumentUrl} onChange={e => setResidenceForm(p => ({ ...p, ownershipDocumentUrl: e.target.value }))} className={inputClass} placeholder="https://..." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={residenceForm.hasPets} onChange={e => setResidenceForm(p => ({ ...p, hasPets: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">{t.hasPets}</span>
              </div>
              {residenceForm.hasPets && (
                <div>
                  <label className={labelClass}>{t.petsDescription}</label>
                  <input type="text" value={residenceForm.petsDescription} onChange={e => setResidenceForm(p => ({ ...p, petsDescription: e.target.value }))} className={inputClass} />
                </div>
              )}
            </div>

            <div>
              <label className={labelClass}>{es.common.notes}</label>
              <textarea rows={3} value={residenceForm.notes} onChange={e => setResidenceForm(p => ({ ...p, notes: e.target.value }))} className={inputClass} />
            </div>

            <div className="flex justify-end pt-4">
              <button onClick={handleSaveResidence} disabled={saving} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                <Check size={16} />
                {saving ? es.common.loading : es.common.save}
              </button>
            </div>
          </div>
        )}

        {/* ── Household Tab ── */}
        {tab === 'household' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-gray-800">{t.household}</h3>
              <button onClick={openAddMember} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm">
                <Plus size={16} />
                {t.addMember}
              </button>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t.fullName}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t.relationship}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Teléfono</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t.authorizedEntry}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {householdMembers.map(m => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{m.fullName}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getRelationshipLabel(m.relationship)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{m.phone || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        m.isAuthorizedEntry ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {m.isAuthorizedEntry ? es.common.yes : es.common.no}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditMember(m)} className="p-1 text-gray-400 hover:text-blue-600">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteMember(m.id)} className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {householdMembers.length === 0 && (
              <div className="text-center py-8 text-gray-500">{es.common.noData}</div>
            )}
          </div>
        )}

        {/* ── Vehicles Tab ── */}
        {tab === 'vehicles' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-md font-semibold text-gray-800">{t.vehicles}</h3>
              <button onClick={openAddVehicle} className="flex items-center gap-2 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 text-sm">
                <Plus size={16} />
                {t.addVehicle}
              </button>
            </div>

            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t.make} / {t.model}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t.year}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t.color}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t.plateNumber}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t.vehicleType}</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{t.parkingSticker}</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.status}</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">{es.common.actions}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {vehicles.map(v => (
                  <tr key={v.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{v.make} {v.model}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.year || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.color || '—'}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">{v.plateNumber}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getVehicleTypeLabel(v.vehicleType)}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{v.parkingSticker || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        v.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {v.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditVehicle(v)} className="p-1 text-gray-400 hover:text-blue-600">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => handleDeleteVehicle(v.id)} className="p-1 text-gray-400 hover:text-red-600">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {vehicles.length === 0 && (
              <div className="text-center py-8 text-gray-500">{es.common.noData}</div>
            )}
          </div>
        )}
      </div>

      {/* ── Household Member Modal ── */}
      {showMemberModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingMember ? 'Editar Familiar' : t.addMember}
              </h2>
              <button onClick={() => setShowMemberModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {memberError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{memberError}</div>}

            <form onSubmit={handleMemberSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t.fullName} *</label>
                  <input type="text" required value={memberForm.fullName} onChange={e => setMemberForm(p => ({ ...p, fullName: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t.relationship} *</label>
                  <select value={memberForm.relationship} onChange={e => setMemberForm(p => ({ ...p, relationship: e.target.value }))} className={inputClass}>
                    {RELATIONSHIP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t.dateOfBirth}</label>
                  <input type="date" value={memberForm.dateOfBirth} onChange={e => setMemberForm(p => ({ ...p, dateOfBirth: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Teléfono</label>
                  <input type="text" value={memberForm.phone} onChange={e => setMemberForm(p => ({ ...p, phone: e.target.value }))} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{es.auth.email}</label>
                  <input type="email" value={memberForm.email} onChange={e => setMemberForm(p => ({ ...p, email: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t.dpiCui}</label>
                  <input type="text" value={memberForm.dpiCui} onChange={e => setMemberForm(p => ({ ...p, dpiCui: e.target.value }))} className={inputClass} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={memberForm.isAuthorizedEntry} onChange={e => setMemberForm(p => ({ ...p, isAuthorizedEntry: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">{t.authorizedEntry}</span>
              </div>

              <div>
                <label className={labelClass}>{es.common.notes}</label>
                <textarea rows={2} value={memberForm.notes} onChange={e => setMemberForm(p => ({ ...p, notes: e.target.value }))} className={inputClass} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMemberModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                  {es.common.cancel}
                </button>
                <button type="submit" disabled={memberSubmitting} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {memberSubmitting ? es.common.loading : es.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Vehicle Modal ── */}
      {showVehicleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">
                {editingVehicle ? 'Editar Vehículo' : t.addVehicle}
              </h2>
              <button onClick={() => setShowVehicleModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {vehicleError && <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4">{vehicleError}</div>}

            <form onSubmit={handleVehicleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t.make} *</label>
                  <input type="text" required value={vehicleForm.make} onChange={e => setVehicleForm(p => ({ ...p, make: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t.model} *</label>
                  <input type="text" required value={vehicleForm.model} onChange={e => setVehicleForm(p => ({ ...p, model: e.target.value }))} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>{t.year}</label>
                  <input type="number" value={vehicleForm.year} onChange={e => setVehicleForm(p => ({ ...p, year: e.target.value }))} className={inputClass} min="1900" max="2100" />
                </div>
                <div>
                  <label className={labelClass}>{t.color}</label>
                  <input type="text" value={vehicleForm.color} onChange={e => setVehicleForm(p => ({ ...p, color: e.target.value }))} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>{t.plateNumber} *</label>
                  <input type="text" required value={vehicleForm.plateNumber} onChange={e => setVehicleForm(p => ({ ...p, plateNumber: e.target.value }))} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>{t.vehicleType}</label>
                  <select value={vehicleForm.vehicleType} onChange={e => setVehicleForm(p => ({ ...p, vehicleType: e.target.value }))} className={inputClass}>
                    {VEHICLE_TYPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>{t.parkingSticker}</label>
                  <input type="text" value={vehicleForm.parkingSticker} onChange={e => setVehicleForm(p => ({ ...p, parkingSticker: e.target.value }))} className={inputClass} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" checked={vehicleForm.isActive} onChange={e => setVehicleForm(p => ({ ...p, isActive: e.target.checked }))} className="rounded" />
                <span className="text-sm text-gray-700">Activo</span>
              </div>

              <div>
                <label className={labelClass}>{es.common.notes}</label>
                <textarea rows={2} value={vehicleForm.notes} onChange={e => setVehicleForm(p => ({ ...p, notes: e.target.value }))} className={inputClass} />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowVehicleModal(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">
                  {es.common.cancel}
                </button>
                <button type="submit" disabled={vehicleSubmitting} className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
                  {vehicleSubmitting ? es.common.loading : es.common.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
