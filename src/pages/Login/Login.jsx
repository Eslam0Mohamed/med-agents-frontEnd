import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { loginSchema } from '../../schemas/loginSchema';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function Login() {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError('');

    try {
      await login(data.email, data.password);
      navigate('/patients');
    } catch (err) {
      setServerError(t('auth.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-50 relative">
      <div className="absolute top-4 end-4">
        <LanguageSwitcher />
      </div>
      <div className="bg-white rounded-xl shadow-md p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-xl font-semibold text-gray-900">
            Med<span className="text-blue-600">Agents</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">{t('auth.welcomeBack')}</p>
        </div>

        {serverError && (
          <div className="bg-red-50 text-red-600 text-sm rounded-md p-2 mb-4 text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t('auth.email')}
            </label>
            <input
              type="email"
              {...register('email')}
              className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 ${
                errors.email ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="doctor@medagents.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {t('auth.password')}
            </label>
            <input
              type="password"
              {...register('password')}
              className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 ${
                errors.password ? 'border-red-400' : 'border-gray-300'
              }`}
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
          >
            {isLoading ? t('auth.loggingIn') : t('auth.loginButton')}
          </button>
        </form>
      </div>
    </div>
  );
}