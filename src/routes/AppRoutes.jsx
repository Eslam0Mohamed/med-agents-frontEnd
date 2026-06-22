import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';
import NotFound from '../components/NotFound';
import AiChat from '../pages/ai-chat/AiChat';
import DrugSafety from '../pages/drug-safety/DrugSafety';
import PatientsList from '../pages/patients/PatientsList';
import PatientForm from '../pages/patients/PatientForm';
import PatientHistory from '../pages/patients/PatientHistory';

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
      { path:"/", element: <Navigate to="patients" replace /> },
      // { index: true, element: <Navigate to="/ai-chat" replace /> },
     { path: 'patients', element: <PatientsList /> },
      { path: 'patients/add', element: <PatientForm /> },
      { path: 'patients/edit/:id', element: <PatientForm /> },
      { path: 'patients/history/:id', element: <PatientHistory /> },


      { path: 'consultations', element: <div>Consultations page</div> },
      { path: 'prescriptions', element: <div>Prescriptions page</div> },
      { path: 'followups', element: <div>Follow-ups page</div> },
      { path: 'ai-chat', element: <AiChat/> },
     
      { path: 'drug-safety', element: <DrugSafety /> },
    ],
  },
  {
    path: '*',
    element: <NotFound/>,
  },
]);

export default router;