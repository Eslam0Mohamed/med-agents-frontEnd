import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { verifyEmailOtpRequest, resendEmailOtpRequest } from '../../api/Auth';
import PublicNavbar from "../puplic/puplicNavbar/PuplicNavbar";
import Footer from '../../components/Footer';
import LanguageSwitcher from '../../components/LanguageSwitcher';

const RESEND_COOLDOWN_SECONDS = 30;

export default function VerifyEmail() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // الإيميل بييجي من صفحة التسجيل (state)، ولو الدكتور فتح اللينك مباشرة
  // من غير ما يمر بالتسجيل (زي إعادة تحميل الصفحة)، نسيبه يكتبه بنفسه
  const [email, setEmail] = useState(location.state?.email || '');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setIsLoading(true);

    try {
      const res = await verifyEmailOtpRequest(email.trim().toLowerCase(), otp.trim());
      const { token, name, role, language, verificationStatus } = res.data;

      localStorage.setItem('token', token);
      const userData = { name, role, language, verificationStatus };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      // بعد تأكيد الإيميل، الـ Layout هو اللي هيقرر يوديه لصفحة "تحت
      // المراجعة" لو verificationStatus لسه pending، فمنحتاجش نفحص هنا
      navigate('/patients');
    } catch (err) {
      if (!err.response) {
        setServerError(t('auth.networkError'));
      } else {
        setServerError(err.response.data?.message || t('common.somethingWentWrong'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || !email) return;
    setResendMessage('');
    setServerError('');
    try {
      await resendEmailOtpRequest(email.trim().toLowerCase());
      setResendMessage(t('auth.otpResent'));
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setServerError(
        !err.response ? t('auth.networkError') : t('common.somethingWentWrong'),
      );
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
              {t('auth.verifyEmailTitle')}
            </h1>
            <p className={`text-sm mt-2 transition-colors ${isDark ? "text-slate-400" : "text-gray-500"}`}>
              {t('auth.verifyEmailSubtitle')}
            </p>
          </div>

          {serverError && (
            <div className={`text-sm rounded-md p-2 mb-4 text-center transition-colors ${
              isDark ? 'bg-red-950/40 text-red-400 border border-red-900/30' : 'bg-red-50 text-red-600'
            }`}>
              {serverError}
            </div>
          )}
          {resendMessage && !serverError && (
            <div className={`text-sm rounded-md p-2 mb-4 text-center transition-colors ${
              isDark ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {resendMessage}
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

            <div>
              <label className={`block text-sm mb-1 transition-colors ${isDark ? 'text-slate-300' : 'text-gray-600'}`}>
                {t('auth.otpCode')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                required
                className={`w-full border rounded-md px-3 py-2 text-sm outline-none focus:border-blue-500 tracking-[0.5em] text-center font-semibold transition-colors ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-white border-gray-300 text-gray-800'
                }`}
                placeholder="------"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || otp.length !== 6}
              className="bg-blue-600 text-white rounded-md py-2 text-sm font-medium hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {isLoading ? t('auth.verifying') : t('auth.verifyButton')}
            </button>
          </form>

          <div className="text-center mt-5">
            <button
              type="button"
              onClick={handleResend}
              disabled={resendCooldown > 0}
              className="text-blue-600 hover:underline text-sm font-medium disabled:text-gray-400 disabled:no-underline"
            >
              {resendCooldown > 0
                ? t('auth.resendIn', { seconds: resendCooldown })
                : t('auth.resendOtp')}
            </button>
          </div>

          <p className={`text-center text-sm mt-3 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
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