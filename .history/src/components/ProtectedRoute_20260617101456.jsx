import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen text-gray-400">Loading...</div>;
  }

  if (isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  return children;
}