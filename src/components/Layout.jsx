import { useEffect, useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { getMySubscription } from '../api/subscription';

// المسارات المستثناة من فحص الاشتراك - لازم الدكتور يقدر يوصلها حتى لو
// اشتراكه منتهي، عشان يقدر يجدد فعليًا (وميدخلش في loop تحويل لا نهائي)
const SUBSCRIPTION_EXEMPT_PATHS = ['/subscriptions', '/payment/callback'];

export default function Layout() {
  const { isDark } = useTheme();
  const { user } = useAuth();
  const location = useLocation();

  // null = لسه بنتأكد / مش عارفين، true = منتهي فعلاً، false = سليم
  const [isExpired, setIsExpired] = useState(false);
  const [checked, setChecked] = useState(false);

  const isExemptPath = SUBSCRIPTION_EXEMPT_PATHS.some((p) =>
    location.pathname.startsWith(p),
  );

  // حساب مش approved (تحت المراجعة أو مرفوض) - بنفحصها الأول قبل حتى
  // الاشتراك، لأن دكتور مش موافَق عليه مالوش صلاحيات أصلاً بغض النظر عن
  // حالة اشتراكه
  const isApproved = user?.role === 'admin' || user?.verificationStatus === 'approved';

  useEffect(() => {
    // الأدمن مالوش اشتراك أصلاً، والصفحات المستثناة مش محتاجة فحص، وأي
    // حساب مش approved أصلاً مش هيوصل للفحص ده (هيتحول قبل ما يوصل هنا)
    if (user?.role === 'admin' || isExemptPath || !isApproved) {
      setChecked(true);
      return;
    }

    let cancelled = false;
    setChecked(false);

    getMySubscription()
      .then((res) => {
        if (cancelled) return;
        setIsExpired(res?.data?.status === 'expired');
      })
      .catch(() => {
        // لو الفحص نفسه فشل (مشكلة شبكة مثلاً)، منمنعش الدكتور من الاستخدام -
        // الـ interceptor في apiInstance هيتصرف لو أي نداء تاني رجع
        // SUBSCRIPTION_EXPIRED فعليًا
        if (!cancelled) setIsExpired(false);
      })
      .finally(() => {
        if (!cancelled) setChecked(true);
      });

    return () => {
      cancelled = true;
    };
    // بنعيد الفحص كل ما الدكتور يتنقل بين الصفحات، عشان لو الاشتراك خلص
    // أثناء الجلسة نمسكها بسرعة مش بس أول ما يفتح التطبيق
  }, [location.pathname, user?.role, isExemptPath, isApproved]);

  // فحص الموافقة له الأولوية - حساب تحت المراجعة يتحول فورًا من غير ما
  // نستنى أي فحص اشتراك أصلاً
  if (!isApproved) {
    return <Navigate to="/account-under-review" replace />;
  }

  if (checked && isExpired && !isExemptPath) {
    return <Navigate to="/subscriptions?expired=1" replace />;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-355 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'
    }`}>
      <Navbar />
      <main className="p-6 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}