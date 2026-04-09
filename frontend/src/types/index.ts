// Shared TypeScript interfaces for the frontend

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  isActive: boolean;
  boardPosition: string | null;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface Role {
  id: string;
  name: 'administrator' | 'board_member' | 'maintenance' | 'owner' | 'resident';
  description: string;
  hierarchyLevel: number;
}

export interface Unit {
  id: string;
  unitNumber: string;
  unitType: 'house' | 'guard_house' | 'maintenance_yard' | 'clubhouse' | 'visitor_parking';
  address: string | null;
  areaM2: number | null;
  monthlyFee: number;
  isOccupied: boolean;
  notes: string | null;
  owner: User | null;
  resident: User | null;
}

export interface MonthlyCharge {
  id: string;
  unitId: string;
  unit?: Unit;
  period: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  paidAmount: number;
  generatedAt: string;
}

export interface Payment {
  id: string;
  unitId: string;
  unit?: Unit;
  amount: number;
  paymentDate: string;
  paymentMethod: 'bank_transfer' | 'cash' | 'check' | 'online';
  referenceNumber: string | null;
  bankReference: string | null;
  notes: string | null;
  receiptUrl: string | null;
  reconciled: boolean;
  reconciledAt: string | null;
  recordedBy: User | null;
  createdAt: string;
}

export interface AccountMovement {
  id: string;
  unitId: string;
  monthlyChargeId: string | null;
  paymentId: string | null;
  movementType: 'charge' | 'payment' | 'adjustment' | 'credit' | 'penalty';
  amount: number;
  runningBalance: number;
  description: string;
  createdAt: string;
}

export interface MaintenanceTicket {
  id: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'structural' | 'landscape' | 'general' | 'security';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'pending_parts' | 'completed' | 'cancelled';
  location: string;
  reportedBy: User | null;
  assignedTo: User | null;
  unit: Unit | null;
  dueDate: string | null;
  closingNotes: string | null;
  completedAt: string | null;
  createdAt: string;
  updates?: TicketUpdate[];
  photos?: TicketPhoto[];
}

export interface TicketUpdate {
  id: string;
  ticketId: string;
  author: User;
  comment: string;
  statusChangeFrom: string | null;
  statusChangeTo: string | null;
  createdAt: string;
}

export interface TicketPhoto {
  id: string;
  ticketId: string;
  fileUrl: string;
  fileName: string;
  uploadedBy: User;
  createdAt: string;
}

export interface MeterType {
  id: string;
  name: string;
  unitOfMeasure: string;
  anomalyThresholdPct: number;
}

export interface MeterPoint {
  id: string;
  unitId: string;
  unit?: Unit;
  meterType: MeterType;
  meterSerial: string;
  locationDescription: string;
  isActive: boolean;
  lastReadingValue: number | null;
  lastReadingDate: string | null;
}

export interface MeterReading {
  id: string;
  meterPoint: MeterPoint;
  readingValue: number;
  readingDate: string;
  photoUrl: string | null;
  isAnomaly: boolean;
  anomalyNotes: string | null;
  readBy: User;
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  budget: number;
  spent: number;
  startDate: string | null;
  targetEndDate: string | null;
  actualEndDate: string | null;
  createdBy: User;
  createdAt: string;
  updates?: ProjectUpdate[];
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  author: User;
  comment: string;
  photoUrl: string | null;
  createdAt: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  taxId: string | null;
  category: string;
  isActive: boolean;
  notes: string | null;
}

export interface Expense {
  id: string;
  vendor: Vendor | null;
  project: Project | null;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  invoiceNumber: string | null;
  receiptUrl: string | null;
  approvedBy: User | null;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: 'normal' | 'important' | 'urgent';
  publishAt: string | null;
  expiresAt: string | null;
  author: User;
  createdAt: string;
}

export interface Document {
  id: string;
  title: string;
  description: string | null;
  category: string;
  fileUrl: string;
  fileName: string;
  fileSizeBytes: number;
  visibility: 'all_roles' | 'admin_only' | 'board_and_admin';
  uploadedBy: User;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  unitId: string | null;
  channel: 'email' | 'sms' | 'in_app';
  subject: string;
  body: string;
  status: 'pending' | 'sent' | 'failed' | 'read';
  sentAt: string | null;
  readAt: string | null;
  createdAt: string;
}

export interface CollectionStatus {
  id: string;
  unitId: string;
  unit?: Unit;
  totalOverdue: number;
  oldestOverdueDate: string | null;
  daysOverdue: number;
  collectionStage: 'current' | 'reminder' | 'warning' | 'escalated' | 'legal';
  lastNotificationAt: string | null;
  hasActivePromise: boolean;
}

export interface PaymentPromise {
  id: string;
  unitId: string;
  promisedAmount: number;
  promisedDate: string;
  status: 'active' | 'fulfilled' | 'broken' | 'cancelled';
  notes: string | null;
  createdBy: User;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  user: User | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface ResidentProfile {
  id: string;
  userId: string;
  dpiCui: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  profilePhotoUrl: string | null;
  idPhotoFrontUrl: string | null;
  idPhotoBackUrl: string | null;
  emergencyContactName: string | null;
  emergencyContactPhone: string | null;
  emergencyContactRelationship: string | null;
  moveInDate: string | null;
  leaseEndDate: string | null;
  isRenter: boolean;
  leaseDocumentUrl: string | null;
  ownershipDocumentUrl: string | null;
  hasPets: boolean;
  petsDescription: string | null;
  notes: string | null;
}

export interface HouseholdMember {
  id: string;
  userId: string;
  fullName: string;
  relationship: string;
  dateOfBirth: string | null;
  phone: string | null;
  email: string | null;
  dpiCui: string | null;
  isAuthorizedEntry: boolean;
  notes: string | null;
}

export interface Vehicle {
  id: string;
  userId: string;
  make: string;
  model: string;
  year: number | null;
  color: string | null;
  plateNumber: string;
  vehicleType: string;
  parkingSticker: string | null;
  isActive: boolean;
  photoUrl: string | null;
  notes: string | null;
}

export interface ChargeConcept {
  id: string;
  name: string;
  description: string | null;
  defaultAmount: number;
  isPercentage: boolean;
  percentageValue: number | null;
  frequency: 'monthly' | 'one_time' | 'annual' | 'on_demand';
  isActive: boolean;
  sortOrder: number;
}

// API response wrappers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string[];
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Dashboard types
export interface AdminDashboardData {
  billedThisMonth: number;
  collectedThisMonth: number;
  overdueAmount: number;
  overdueUnitsCount: number;
  openTickets: number;
  urgentTickets: number;
  activeProjects: number;
}

export interface ResidentDashboardData {
  currentBalance: number;
  recentCharges: MonthlyCharge[];
  recentPayments: Payment[];
  announcements: Announcement[];
  myTickets: MaintenanceTicket[];
}

export interface MaintenanceDashboardData {
  assignedTickets: MaintenanceTicket[];
  pendingInspections: number;
  readingsDue: number;
}
