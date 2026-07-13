import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import PuplicNavbar from "../pages/puplic/puplicNavbar/PuplicNavbar" 

const NotFound = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isLoggedIn } = useAuth();

  const handleGoHome = () => {
    navigate(isLoggedIn() ? '/patients' : '/');
  };

  return (
  <>
<PuplicNavbar/>
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="text-center max-w-md">

        <h1 className="text-8xl font-extrabold text-blue-600 mb-2">404</h1>

        <h2 className="text-2xl font-bold text-gray-900 mb-3">
          {t('notFound.title', 'Page Not Found')}
        </h2>

        <p className="text-gray-500 mb-8">
          {t('notFound.message', "The page you're looking for doesn't exist or has been moved.")}
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition"
          >
            {t('notFound.goBack', 'Go Back')}
          </button>

          <button
            onClick={handleGoHome}
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition"
          >
            {t('notFound.goHome', 'Go Home')}
          </button>
        </div>

      </div>
    </div>
      </>
  );
};

export default NotFound;