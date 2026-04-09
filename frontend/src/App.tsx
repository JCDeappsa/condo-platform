import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import { AppShell } from './components/layout/AppShell';
import { Login } from './pages/Login';
import { UnitList } from './pages/units/UnitList';
import { UnitDetail } from './pages/units/UnitDetail';
import { MyUnit } from './pages/units/MyUnit';
import { UserManagement } from './pages/users/UserManagement';
import { ResidentProfilePage } from './pages/users/ResidentProfile';
import { MonthlyCharges } from './pages/billing/MonthlyCharges';
import { PaymentList } from './pages/payments/PaymentList';
import { CollectionStatusPage } from './pages/collections/CollectionStatus';
import { CollectionDetail } from './pages/collections/CollectionDetail';
import { NotificationRules } from './pages/notifications/NotificationRules';
import { NotificationTemplates } from './pages/notifications/NotificationTemplates';
import { TicketList } from './pages/maintenance/TicketList';
import { TicketDetail } from './pages/maintenance/TicketDetail';
import { CreateTicket } from './pages/maintenance/CreateTicket';
import { MyTasks } from './pages/maintenance-portal/MyTasks';
import { TaskDetail } from './pages/maintenance-portal/TaskDetail';
import { ReportWarning } from './pages/maintenance-portal/ReportWarning';
import { MeterReadingsPortal } from './pages/maintenance-portal/MeterReadings';
import { InspectionChecklist } from './pages/maintenance-portal/InspectionChecklist';
import { MeterPoints } from './pages/meters/MeterPoints';
import { ProjectList } from './pages/projects/ProjectList';
import { ProjectDetail } from './pages/projects/ProjectDetail';
import { VendorList } from './pages/vendors/VendorList';
import { ExpenseList } from './pages/vendors/ExpenseList';
import { AnnouncementList } from './pages/announcements/AnnouncementList';
import { DocumentLibrary } from './pages/documents/DocumentLibrary';
import { AdminDashboard } from './pages/dashboard/AdminDashboard';
import { ResidentDashboard } from './pages/dashboard/ResidentDashboard';
import { MaintenanceDashboard } from './pages/dashboard/MaintenanceDashboard';
import { Reports } from './pages/reports/Reports';
import { AuditLogs } from './pages/reports/AuditLogs';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { SettingsPage } from './pages/Settings';
import { ReportIssue } from './pages/residents/ReportIssue';
import { ConfirmProvider } from './components/ui/ConfirmDialog';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConfirmProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Authenticated routes */}
          <Route element={<AppShell />}>
            {/* Dashboard */}
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/dashboard/resident" element={<ResidentDashboard />} />
            <Route path="/dashboard/maintenance" element={<MaintenanceDashboard />} />

            {/* Units */}
            <Route path="/units" element={<UnitList />} />
            <Route path="/units/:id" element={<UnitDetail />} />
            <Route path="/my-unit" element={<MyUnit />} />

            {/* Users */}
            <Route path="/users" element={<UserManagement />} />
            <Route path="/users/:userId/profile" element={<ResidentProfilePage />} />

            {/* Billing */}
            <Route path="/billing" element={<MonthlyCharges />} />

            {/* Payments */}
            <Route path="/payments" element={<PaymentList />} />

            {/* Collections */}
            <Route path="/collections" element={<CollectionStatusPage />} />
            <Route path="/collections/:unitId" element={<CollectionDetail />} />

            {/* Notifications */}
            <Route path="/notifications/rules" element={<NotificationRules />} />
            <Route path="/notifications/templates" element={<NotificationTemplates />} />

            {/* Maintenance */}
            <Route path="/maintenance" element={<TicketList />} />
            <Route path="/maintenance/:id" element={<TicketDetail />} />
            <Route path="/maintenance/new" element={<CreateTicket />} />

            {/* Maintenance Mobile Portal */}
            <Route path="/my-tasks" element={<MyTasks />} />
            <Route path="/my-tasks/:id" element={<TaskDetail />} />
            <Route path="/report-warning" element={<ReportWarning />} />

            {/* Meters */}
            <Route path="/meters" element={<MeterPoints />} />
            <Route path="/meter-readings" element={<MeterReadingsPortal />} />

            {/* Projects */}
            <Route path="/projects" element={<ProjectList />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />

            {/* Vendors & Expenses */}
            <Route path="/vendors" element={<VendorList />} />
            <Route path="/expenses" element={<ExpenseList />} />

            {/* Announcements & Documents */}
            <Route path="/announcements" element={<AnnouncementList />} />
            <Route path="/documents" element={<DocumentLibrary />} />

            {/* Reports */}
            <Route path="/reports" element={<Reports />} />

            {/* Audit */}
            <Route path="/audit-logs" element={<AuditLogs />} />

            {/* Inspections */}
            <Route path="/inspections" element={<InspectionChecklist />} />

            {/* Settings */}
            <Route path="/settings" element={<SettingsPage />} />

            {/* Profile — redirect to settings */}
            <Route path="/profile" element={<Navigate to="/settings" replace />} />

            {/* Resident specific */}
            <Route path="/report-issue" element={<ReportIssue />} />
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        </ConfirmProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
