import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../pages/Login/Login';
import ProtectedRoute from '../components/ProtectedRoute';
import Layout from '../components/Layout';
import NotFound from '../components/NotFound';
import AiChat from '../pages/ai-chat/AiChat';
import DrugSafety from '../pages/drug-safety/DrugSafety';

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
      // { index: true, element: <Navigate to="/ai-chat" replace /> },
      { path: 'patients', element: <div>Patients page — coming next</div> },
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