import { useTranslation } from "react-i18next";

/**
 * Segmented EN/AR pill toggle for choosing the language the AI agent should
 * respond in for THIS consultation/follow-up. This is a plain controlled
 * input (value + onChange) — it does NOT change the site's UI language.
 * Position it with a wrapping `flex justify-end` (or similar); it will
 * naturally land on the right for English and the left for Arabic since the
 * page's `dir` attribute flips with the site's UI language.
 */
export default function LanguageToggle({
  value,
  onChange,
  className = "",
  variant = "dark",
}) {
  const { i18n } = useTranslation();
  const current = value === "ar" ? "ar" : "en";

  const isDark = variant === "dark";
  const containerClasses = isDark
    ? "bg-white/15 border border-white/20 backdrop-blur-sm"
    : "bg-slate-100 border border-slate-200";
  const inactiveClasses = isDark
    ? "text-white/70 hover:text-white"
    : "text-slate-500 hover:text-slate-700";

  return (
    <div
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
      className={`inline-flex items-center gap-1 rounded-xl p-1 ${containerClasses} ${className}`}
    >
      <button
        type="button"
        onClick={() => onChange?.("en")}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
          current === "en"
            ? "bg-white text-blue-700 shadow-sm"
            : inactiveClasses
        }`}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => onChange?.("ar")}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
          current === "ar"
            ? "bg-white text-blue-700 shadow-sm"
            : inactiveClasses
        }`}
      >
        AR
      </button>
    </div>
  );
}
