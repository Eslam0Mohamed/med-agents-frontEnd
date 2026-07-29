// رسالة خطأ موحّدة تتعرض جوه الصفحة (مش popup) - نفس الشكل في كل مكان
// في التطبيق بدل ما كل صفحة تعمل الـ styling بتاعها لوحدها
//
// بنستخدم هنا قيم لون صريحة (hex) ومش أسماء كلاسات Tailwind زي bg-red-50،
// لأن أسماء الألوان دي مش بتتولّد صح في هذا المشروع (jit/scan مش شايفها
// صح لملف جديد زي ده)، فبدل ما نتأكد من التوليد نستخدم قيم مباشرة أضمن
import { useTheme } from "../context/ThemeContext";

export default function InlineError({ message, className = "" }) {
  const { isDark } = useTheme();
  if (!message) return null;

  const colors = isDark
    ? { bg: "rgba(127, 29, 29, 0.35)", text: "#f87171", border: "rgba(153, 27, 27, 0.4)" }
    : { bg: "#fef2f2", text: "#dc2626", border: "#fee2e2" };

  return (
    <div
      role="alert"
      className={`flex items-start gap-2 rounded-md p-3 mb-4 text-sm border ${className}`}
      style={{
        backgroundColor: colors.bg,
        color: colors.text,
        borderColor: colors.border,
      }}
    >
      <svg
        className="w-4 h-4 mt-0.5 shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v3.75m0 3.75h.007v.008H12v-.008ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}