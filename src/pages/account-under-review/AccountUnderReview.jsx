import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function AccountUnderReview() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const isRejected = user?.verificationStatus === 'rejected';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center justify-center p-6 transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50/50 text-gray-800"
    }`}>
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>

      <div className={`rounded-xl border p-8 w-full max-w-md text-center transition-colors ${
        isDark ? "bg-slate-900 border-slate-800 shadow-xl shadow-slate-950/50" : "bg-white border-gray-100 shadow-md"
      }`}>
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl ${
          isRejected
            ? (isDark ? 'bg-red-950/40 text-red-400' : 'bg-red-50 text-red-500')
            : (isDark ? 'bg-amber-950/40 text-amber-400' : 'bg-amber-50 text-amber-500')
        }`}>
          {isRejected ? '✕' : '⏳'}
        </div>

        <h1 className={`text-lg font-semibold mb-2 transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>
          {isRejected ? t('auth.accountRejectedTitle') : t('auth.accountPendingTitle')}
        </h1>

        <p className={`text-sm mb-4 transition-colors ${isDark ? "text-slate-400" : "text-gray-500"}`}>
          {isRejected ? t('auth.accountRejectedSubtitle') : t('auth.accountPendingSubtitle')}
        </p>

        {isRejected && user?.rejectionReason && (
          <div className={`text-sm rounded-md p-3 mb-4 text-start ${
            isDark ? 'bg-red-950/30 text-red-300 border border-red-900/30' : 'bg-red-50 text-red-700'
          }`}>
            <strong>{t('auth.rejectionReasonLabel')}:</strong> {user.rejectionReason}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="bg-blue-600 text-white rounded-md py-2 px-6 text-sm font-medium hover:bg-blue-700 transition"
        >
          {t('nav.logout')}
        </button>
      </div>
    </div>
  );
}