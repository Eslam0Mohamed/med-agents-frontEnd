import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { forgotPasswordRequest } from '../../api/Auth';
import PublicNavbar from "../puplic/puplicNavbar/PuplicNavbar";
import Footer from '../../components/Footer';
import LanguageSwitcher from '../../components/LanguageSwitcher';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setIsLoading(true);

    try {
      await forgotPasswordRequest(email.trim().toLowerCase());
      // الباك اند بيرجع نفس الرد سواء الإيميل موجود ولا لأ (عشان محدش
      // يقدر يستخدم الصفحة دي يتأكد مين مسجل في النظام) - فإحنا كمان
      // بنكمل بنفس الطريقة، وبنودّي الدكتور لصفحة إدخال الكود على طول
      navigate('/reset-password', { state: { email: email.trim().toLowerCase() } });
    } catch (err) {
      setServerError(
        !err.response ? t('auth.networkError') : t('common.somethingWentWrong'),
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-300 ${
      isDark ? "bg-slate-950 text-slate-100" : "bg-slate-50/50 text-gray-800"
    }`}>
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
              {t('auth.forgotPasswordTitle')}
            </h1>
            <p className={`text-sm mt-2 transition-colors ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              {t('auth.forgotPasswordSubtitle')}
            </p>
          </div>

          {serverError && (
            <div className={`text-sm rounded-md p-2 mb-4 text-center transition-colors ${
              isDark ? 'bg-red-950/40 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-600'
            }`}>
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className={`block text-sm mb-1 transition-colors ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {t('auth.email')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 transition-colors ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder="doctor@medagents.com"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {isLoading ? t('auth.sendingCode') : t('auth.sendResetCode')}
            </button>
          </form>

          <p className={`text-center text-sm mt-5 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              {t('auth.backToLogin')}
            </Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}