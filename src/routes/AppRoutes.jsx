import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';
import NotFound from '../components/NotFound';
import AiChat from '../pages/ai-chat/AiChat';
import DrugSafety from '../pages/drug-safety/DrugSafety';
import ConsultationList from '../pages/consultations/ConsultationList';
import ConsultationForm from '../pages/consultations/ConsultationForm';
import PatientSearch from '../pages/consultations/PatientSearch';
import PatientHistory from '../pages/consultations/PatientHistory';



const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login/>,
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
      { path: 'patients', element: <div>Patients page — coming next</div> },
      { path: 'consultations', element: <ConsultationList /> },
      { path: 'consultations/add', element: <ConsultationForm /> },
      { path: 'consultations/edit/:id', element: <ConsultationForm /> },
      { path: 'prescriptions', element: <div>Prescriptions page</div> },
      { path: 'followups', element: <div>Follow-ups page</div> },
      { path: 'ai-chat', element: <AiChat/> },
      { path: 'drug-safety', element: <DrugSafety /> },
      { path: 'consultations/search-patient', element: <PatientSearch /> },
       { path: 'consultations/patient/:id/history', element: <PatientHistory /> }
    ],
  },
  {
    path: '*',
    element: <NotFound/>,
  },
]);

export default router;