import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { registerSchema } from '../../schemas/registerSchema';
import { registerRequest } from '../../api/Auth';
import PublicNavbar from "../puplic/puplicNavbar/PuplicNavbar"
import Footer from '../../components/Footer';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const ALLOWED_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
const MAX_PROOF_SIZE = 8 * 1024 * 1024; // 8MB - نفس الحد بالظبط في الباك اند

export default function Register() {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const isRtl = currentLang === "ar";
  const { isDark } = useTheme();

  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [proofError, setProofError] = useState('');

  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const handleProofChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_PROOF_TYPES.includes(file.type)) {
      setProofError(t('auth.proofInvalidType'));
      setProofFile(null);
      return;
    }
    if (file.size > MAX_PROOF_SIZE) {
      setProofError(t('auth.proofTooLarge'));
      setProofFile(null);
      return;
    }

    setProofError('');
    setProofFile(file);
  };

  const onSubmit = async (data) => {
    setServerError('');

    // ملف الإثبات إلزامي بس مش جزء من zod schema (بيتحقق منه لوحده هنا)
    // عشان input الملف صعب يتظبط مع react-hook-form زي حقول النص العادية
    if (!proofFile) {
      setProofError(t('auth.proofRequired'));
      return;
    }

    setIsLoading(true);

    try {
      await registerRequest({
        name: data.name,
        email: data.email,
        password: data.password,
        specialty: data.specialty,
        language: currentLang,
        credentialProof: proofFile,
      });

      // الحساب اتعمل بس لسه محتاج تأكيد الإيميل الأول (وبعدها موافقة
      // الأدمن) - مش هنعمل login تلقائي زي الأول، هنودّيه لصفحة تأكيد
      // الكود اللي وصله في إيميله
      navigate('/verify-email', { state: { email: data.email } });
    } catch (err) {
      if (!err.response) {
        setServerError(t('auth.networkError'));
      } else if (err.response.status === 400) {
        setServerError(
          err.response.data?.message || t('auth.registerFailed'),
        );
      } else if (err.response.status === 429) {
        setServerError(t('auth.tooManyAttempts'));
      } else {
        setServerError(
          err.response.data?.message || t('common.somethingWentWrong'),
        );
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
            <p className={`text-sm mt-1 transition-colors ${isDark ? "text-slate-400" : "text-gray-500"}`}>{t('auth.createAccount')}</p>
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
                {t('auth.name')}
              </label>
              <input
                type="text"
                {...register('name')}
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors ${
                  errors.name
                    ? 'border-red-400'
                    : isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder={t('auth.namePlaceholder')}
              />
              {errors.name && (
                <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
              )}
            </div>

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
                {t('auth.specialty')} <span className="opacity-60">({t('common.optional')})</span>
              </label>
              <input
                type="text"
                {...register('specialty')}
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors ${
                  isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder={t('auth.specialtyPlaceholder')}
              />
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
              {!errors.password && (
                <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                  {t('auth.passwordHint')}
                </p>
              )}
            </div>

            <div>
              <label className={`block text-sm mb-1 transition-colors ${
                isDark ? 'text-slate-300' : 'text-gray-600'
              }`}>
                {t('auth.confirmPassword')}
              </label>
              <input
                type="password"
                {...register('confirmPassword')}
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors ${
                  errors.confirmPassword
                    ? 'border-red-400'
                    : isDark
                    ? 'bg-slate-950 border-slate-800 text-slate-100'
                    : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <div>
              <label className={`block text-sm mb-1 transition-colors ${
                isDark ? 'text-slate-300' : 'text-gray-600'
              }`}>
                {t('auth.credentialProof')}
              </label>
              <p className={`text-xs mb-2 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                {t('auth.credentialProofHint')}
              </p>
              <label
                className={`flex items-center justify-center gap-2 w-full border border-dashed rounded-md px-3 py-4 text-sm cursor-pointer transition-colors ${
                  proofError
                    ? 'border-red-400'
                    : isDark
                    ? 'bg-slate-950 border-slate-700 text-slate-300 hover:border-blue-600'
                    : 'bg-white border-gray-300 text-gray-600 hover:border-blue-400'
                }`}
              >
                📎 {proofFile ? proofFile.name : t('auth.credentialProofPlaceholder')}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleProofChange}
                  className="hidden"
                />
              </label>
              {proofError && (
                <p className="text-red-500 text-xs mt-1">{proofError}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {isLoading ? t('auth.registering') : t('auth.registerButton')}
            </button>
          </form>

          <p className={`text-center text-sm mt-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            {t('auth.alreadyHaveAccount')}{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              {t('auth.loginButton')}
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}