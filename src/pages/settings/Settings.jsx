import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { updateProfileRequest } from '../../api/Auth';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, setUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [specialty, setSpecialty] = useState(user?.specialty || '');
  const [language, setLanguage] = useState(user?.language || 'en');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!confirmEmail.trim()) {
      setError(t('settings.errorConfirmEmail'));
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setError(t('settings.errorPasswordMatch'));
      return;
    }

    setIsLoading(true);

    try {
      const payload = { confirmEmail, name, specialty, language };
      if (newPassword) payload.newPassword = newPassword;

      const res = await updateProfileRequest(payload);

      const updatedUser = {
        ...user,
        name: res.data.name,
        specialty: res.data.specialty,
        language: res.data.language,
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser?.(updatedUser);
      i18n.changeLanguage(language);

      setSuccess(t('settings.successUpdate'));
      setConfirmEmail('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || t('settings.failedUpdate'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-6 sm:py-10">
      <div className="bg-white border border-gray-200 rounded-xl p-5 sm:p-8">
        <h1 className="text-base sm:text-lg font-semibold text-gray-900 mb-5 sm:mb-6">
          {t('settings.title')}
        </h1>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm rounded-md p-3 mb-4">{error}</div>
        )}
        {success && (
          <div className="bg-green-50 text-green-700 text-sm rounded-md p-3 mb-4">{success}</div>
        )}

        <form onSubmit={handleSave} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('common.name')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('profile.specialty')}</label>
            <input
              type="text"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
              placeholder={t('settings.specialtyPlaceholder')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">{t('settings.language')}</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              <option value="en">{t('settings.english')}</option>
              <option value="ar">{t('settings.arabic')}</option>
            </select>
          </div>

          <div className="border-t border-gray-100 pt-4 sm:pt-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">
              {t('settings.changePassword')}
            </h2>
            <div className="space-y-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('settings.newPassword')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t('settings.confirmPassword')}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 sm:pt-5">
            <label className="block text-sm text-gray-600 mb-1">
              {t('settings.confirmEmail')}
            </label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder={t('settings.emailPlaceholder')}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 transition cursor-pointer"
          >
            {isLoading ? t('common.saving') : t('common.save')}
          </button>
        </form>
      </div>
    </div>
  );
}