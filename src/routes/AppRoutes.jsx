import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';
import NotFound from '../components/NotFound';
import AiChat from '../pages/ai-chat/AiChat';
import DrugSafety from '../pages/drug-safety/DrugSafety';

import Profile from '../pages/profile/Profile';
import Settings from '../pages/settings/Settings';

import ConsultationList from '../pages/consultations/ConsultationList';
import ConsultationForm from '../pages/consultations/ConsultationForm';
import PatientSearch from '../pages/consultations/PatientSearch';
import PatientHistory from '../pages/patients/PatientHistory';
import PatientReport from '../pages/patients/PatientReport';

import FollowUps from '../pages/followups/FollowUps';
import PatientsList from '../pages/patients/PatientsList';
import PatientForm from '../pages/patients/PatientForm';


const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },

  {
    path: '/',
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),

    children: [
      { index: true, element: <Navigate to="/patients" replace /> },

      // Patients
      { path: 'patients', element: <PatientsList /> },
      { path: 'patients/add', element: <PatientForm /> },
      { path: 'patients/edit/:id', element: <PatientForm /> },
      { path: 'patients/history/:id', element: <PatientHistory /> },
      { path: 'patients/report/:id', element: <PatientReport /> },

      // Consultations
      { path: 'consultations', element: <ConsultationList /> },

      // Add Consultation Workflow
      { path: 'consultations/search-patient', element: <PatientSearch /> },

      { path: 'consultations/patient/:id/history', element: <PatientHistory /> },

      { path: 'consultations/add/:patientId', element: <ConsultationForm /> },

      { path: 'consultations/edit/:id', element: <ConsultationForm /> },

      // Prescriptions
      { path: 'prescriptions', element: <div>Prescriptions page</div> },

      { path: 'ai-chat', element: <AiChat/> },
     { path: 'profile', element: <Profile /> },


      // Follow Ups
      { path: 'followups', element: <FollowUps /> },

      // AI Chat
      { path: 'ai-chat', element: <AiChat /> },

      // Drug Safety

      { path: 'drug-safety', element: <DrugSafety /> },
      { path: 'settings', element: <Settings /> },
    ],
  },

  {
    path: '*',
    element: <NotFound />,
  },
]);

export default router;