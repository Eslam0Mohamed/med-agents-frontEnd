import { createBrowserRouter, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <ProtectedRout>
        <Layout />
      </ProtectedRout>
    ),
    children: [
      { index: true, element: <Navigate to="/patients" replace /> },
      { path: 'patients', element: <div>Patients page — coming next</div> },
      { path: 'consultations', element: <div>Consultations page</div> },
      { path: 'prescriptions', element: <div>Prescriptions page</div> },
      { path: 'followups', element: <div>Follow-ups page</div> },
      { path: 'ai-chat', element: <div>AI Chat page</div> },
      { path: 'drug-safety', element: <div>Drug Safety page</div> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

export default router;