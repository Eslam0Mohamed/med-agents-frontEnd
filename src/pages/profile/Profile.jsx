import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const initials =
    user?.name
      ?.split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'DR';

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
      <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-8">
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-600 text-white text-lg sm:text-xl font-semibold flex items-center justify-center flex-shrink-0">
            {initials}
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-semibold text-gray-900">
              {user?.name || 'Doctor'}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 capitalize">
              {user?.role || 'doctor'}
            </p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-5 sm:pt-6 space-y-3 sm:space-y-4 mb-5 sm:mb-6">
          {[
            { label: t('common.name'), value: user?.name },
            { label: t('profile.specialty'), value: user?.specialty },
            { label: t('profile.role'), value: user?.role },
            {
              label: t('settings.language'),
              value: user?.language === 'ar'
                ? t('settings.arabic')
                : t('settings.english'),
            },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-sm">
              <span className="text-gray-500">{item.label}</span>
              <span className="text-gray-900 font-medium capitalize">
                {item.value || '—'}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="w-full bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
        >
          {t('common.edit')} / {t('profile.changePassword')}
        </button>
      </div>
    </div>
  );
}