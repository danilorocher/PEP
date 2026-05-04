import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../shared/layouts/MainLayout';
import { LoginPage } from '../modules/auth/pages/Login';
import { ChangePasswordPage } from '../modules/auth/pages/ChangePassword';
import { DashboardPage } from '../modules/dashboard/pages/Dashboard';
import { PatientListPage } from '../modules/patients/pages/PatientList';
import { PatientFormPage } from '../modules/patients/pages/PatientForm';
import { ProfessionalListPage } from '../modules/professionals/pages/ProfessionalList';
import { ProfessionalFormPage } from '../modules/professionals/pages/ProfessionalForm';
import { StructureListPage } from '../modules/structure/pages/StructureList';
import { SchedulingPage } from '../modules/scheduling/pages/Scheduling';
import { HospitalizationListPage } from '../modules/hospitalizations/pages/HospitalizationList';
import { MedicalRecordViewPage } from '../modules/medical-records/pages/MedicalRecordView';
import { MedicationListPage } from '../modules/medication/pages/MedicationList';
import { ReportsPage } from '../modules/reports/pages/Reports';
import { BillingListPage } from '../modules/billing/pages/BillingList';
import { ExamListPage } from '../modules/exams/pages/ExamList';
import { AttendanceListPage } from '../modules/attendance/pages/AttendanceList';
import { CompanyFormPage } from '../modules/companies/pages/CompanyForm';
import { PharmacyDashboardPage } from '../modules/pharmacy/pages/PharmacyDashboard';
import { SurgicalDashboardPage } from '../modules/surgical-center/pages/SurgicalDashboard';
import { HospitalBillingDashboard } from '../modules/hospital-billing/pages/HospitalBillingDashboard';
import { ClinicalDashboard as ClinicalDashboardPage } from '../modules/assistance/components/ClinicalDashboard';
import { LabDashboardPage } from '../modules/lab/pages/LabDashboard';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/change-password" element={<ChangePasswordPage />} />
      
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<MainLayout><DashboardPage /></MainLayout>} />
        <Route path="/patients" element={<MainLayout><PatientListPage /></MainLayout>} />
        <Route path="/patients/new" element={<MainLayout><PatientFormPage /></MainLayout>} />
        <Route path="/patients/edit/:id" element={<MainLayout><PatientFormPage /></MainLayout>} />
        <Route path="/professionals" element={<MainLayout><ProfessionalListPage /></MainLayout>} />
        <Route path="/professionals/new" element={<MainLayout><ProfessionalFormPage /></MainLayout>} />
        <Route path="/professionals/edit/:id" element={<MainLayout><ProfessionalFormPage /></MainLayout>} />
        <Route path="/companies" element={<MainLayout><CompanyFormPage /></MainLayout>} />
        <Route path="/admin" element={<MainLayout><StructureListPage /></MainLayout>} />
        <Route path="/scheduling" element={<MainLayout><SchedulingPage /></MainLayout>} />
        <Route path="/attendance" element={<MainLayout><AttendanceListPage /></MainLayout>} />
        <Route path="/hospitalizations" element={<MainLayout><HospitalizationListPage /></MainLayout>} />
        <Route path="/medical-records" element={<Navigate to="/patients" replace />} />
        <Route path="/medical-records/:patientId" element={<MainLayout><MedicalRecordViewPage /></MainLayout>} />
        <Route path="/medication" element={<MainLayout><MedicationListPage /></MainLayout>} />
        <Route path="/reports" element={<MainLayout><ReportsPage /></MainLayout>} />
        <Route path="/billing" element={<MainLayout><BillingListPage /></MainLayout>} />
        <Route path="/hospital-billing" element={<MainLayout><HospitalBillingDashboard /></MainLayout>} />
        <Route path="/exams" element={<MainLayout><ExamListPage /></MainLayout>} />
        
        {/* Rota Laboratório (LIS) Corrigida */}
        <Route path="/lab" element={<MainLayout><LabDashboardPage /></MainLayout>} />

        <Route path="/pharmacy" element={<MainLayout><PharmacyDashboardPage /></MainLayout>} />
        <Route path="/surgical-center" element={<MainLayout><SurgicalDashboardPage /></MainLayout>} />
        <Route path="/assistance" element={<MainLayout><ClinicalDashboardPage data={[]} /></MainLayout>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;