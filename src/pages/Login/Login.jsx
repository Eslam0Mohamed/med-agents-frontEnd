import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { loginSchema } from '../../schemas/loginSchema';
import PublicNavbar from "../puplic/puplicNavbar/PuplicNavbar"
import Footer from '../../components/Footer';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function Login() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const isRtl = currentLang === "ar";
  const { isDark } = useTheme();

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
      // مفيش أي response خالص معناه الطلب مووصلش للسيرفر أصلاً (مفيش نت،
      // أو السيرفر واقع) - ده مختلف تمامًا عن "بيانات دخول غلط" ولازم
      // الدكتور يعرف الفرق
      if (!err.response) {
        setServerError(t('auth.networkError'));
      } else if (err.response.status === 401) {
        setServerError(t('auth.invalidCredentials'));
      } else {
        setServerError(err.response.data?.message || t('common.somethingWentWrong'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50/50 text-gray-800"
    }`} dir={isRtl ? "rtl" : "ltr"}>
      <PublicNavbar/>
      
      <div className="flex-1 flex items-center justify-center relative p-6">
        <div className="absolute top-4 end-4">
          <LanguageSwitcher />
        </div>
        
        <div className={`rounded-xl border p-8 w-full max-w-sm transition-colors ${
          isDark ? "bg-slate-900 border-slate-800 shadow-xl shadow-slate-950/50" : "bg-white border-gray-100 shadow-md"
        }`}>
          <div className="text-center mb-6">
            <h1 className={`text-xl font-semibold transition-colors ${isDark ? "text-white" : "text-gray-900"}`}>
              Med<span className="text-blue-600">Agents</span>
            </h1>
            <p className={`text-sm mt-1 transition-colors ${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('auth.welcomeBack')}</p>
          </div>

          {serverError && (
            <div className={`text-sm rounded-md p-2 mb-4 text-center transition-colors ${
              isDark ? 'bg-red-950/40 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-600'
            }`}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <div>
              <label className={`block text-sm mb-1 transition-colors ${
                isDark ? 'text-slate-300' : 'text-gray-600'
              }`}>
                {t('auth.email')}
              </label>
              <input
                type="email"
                {...register('email')}
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors ${
                  errors.email 
                    ? 'border-red-400' 
                    : isDark 
                    ? 'bg-slate-950 border-slate-800 text-slate-100' 
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder="doctor@medagents.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm mb-1 transition-colors ${
                isDark ? 'text-slate-300' : 'text-gray-600'
              }`}>
                {t('auth.password')}
              </label>
              <input
                type="password"
                {...register('password')}
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors ${
                  errors.password 
                    ? 'border-red-400' 
                    : isDark 
                    ? 'bg-slate-950 border-slate-800 text-slate-100' 
                    : 'bg-white border-gray-300 text-gray-800'
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
      <Footer />
    </div>
  );
}