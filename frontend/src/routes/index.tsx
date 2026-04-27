import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../shared/layouts/MainLayout';
import { LoginPage } from '../modules/auth/pages/Login';
import { ChangePasswordPage } from '../modules/auth/pages/ChangePassword';
import { DashboardPage } from '../modules/dashboard/pages/Dashboard';
import { PatientListPage } from '../modules/patients/pages/PatientList';
import { PatientFormPage } from '../modules/patients/pages/PatientForm';
import { ProfessionalListPage } from '../modules/professionals/pages/ProfessionalList';
import { DoctorFormPage } from '../modules/professionals/pages/DoctorForm';
import { NurseFormPage } from '../modules/professionals/pages/NurseForm';
import { StructureListPage } from '../modules/structure/pages/StructureList';
import { SchedulingPage } from '../modules/scheduling/pages/Scheduling';
import { HospitalizationListPage } from '../modules/hospitalizations/pages/HospitalizationList';
import { MedicalRecordViewPage } from '../modules/medical-records/pages/MedicalRecordView';
import { MedicationListPage } from '../modules/medication/pages/MedicationList';
import { ReportsPage } from '../modules/reports/pages/Reports';
import { BillingListPage } from '../modules/billing/pages/BillingList';

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
        <Route path="/professionals/doctor/new" element={<MainLayout><DoctorFormPage /></MainLayout>} />
        <Route path="/professionals/doctor/edit/:id" element={<MainLayout><DoctorFormPage /></MainLayout>} />
        <Route path="/professionals/nurse/new" element={<MainLayout><NurseFormPage /></MainLayout>} />
        <Route path="/professionals/nurse/edit/:id" element={<MainLayout><NurseFormPage /></MainLayout>} />

        <Route path="/admin" element={<MainLayout><StructureListPage /></MainLayout>} />

        <Route path="/scheduling" element={<MainLayout><SchedulingPage /></MainLayout>} />
        
        <Route path="/hospitalizations" element={<MainLayout><HospitalizationListPage /></MainLayout>} />

        <Route path="/medical-records/:patientId" element={<MainLayout><MedicalRecordViewPage /></MainLayout>} />
        
        <Route path="/medication" element={<MainLayout><MedicationListPage /></MainLayout>} />
        
        <Route path="/reports" element={<MainLayout><ReportsPage /></MainLayout>} />

        {/* Módulo de Faturamento */}
        <Route path="/billing" element={<MainLayout><BillingListPage /></MainLayout>} />
        
        <Route path="/exams" element={<MainLayout><h1>Exames</h1></MainLayout>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default AppRoutes;