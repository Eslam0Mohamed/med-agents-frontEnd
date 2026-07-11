import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Footer = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const isRtl = currentLang === "ar";

  return (
    <footer className="py-8 border-t bg-blue-100 border-blue-200 text-slate-700 mt-auto">
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-6 ${isRtl ? "text-right" : "text-left"}`}
      >
        {/* Logo & Description */}
        <div className="md:col-span-5 space-y-3">
          <Link
            to="/"
            className="text-xl font-bold tracking-tight text-slate-900"
          >
            Med<span className="text-blue-600">Agents</span>
          </Link>
          <p className="text-sm leading-relaxed max-w-sm text-slate-650">
            {t(
              "footer.description",
              "AI-powered platform for doctors to manage patients, consultations, and prescriptions with ease.",
            )}
          </p>
        </div>

        {/* Column 2: Navigation */}
        <div className="md:col-span-3 space-y-3">
          <h4 className="text-xs font-bold tracking-wider uppercase text-slate-800">
            {isRtl ? "الموقع" : "Navigation"}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                to="/"
                className="text-slate-700 hover:text-blue-600 transition"
              >
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="text-slate-700 hover:text-blue-650 transition"
              >
                {t("nav.contactUs")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Features */}
        <div className="md:col-span-4 space-y-3">
          <h4 className="text-xs font-bold tracking-wider uppercase text-slate-800">
            {isRtl ? "المميزات" : "Key Features"}
          </h4>
          <ul className="space-y-2 text-sm text-slate-750">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              <span>{t("home.feature1Title")}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-600"></span>
              <span>{t("home.feature2Title")}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              <span>{t("home.feature3Title")}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="max-w-6xl mx-auto px-6 pt-4 mt-6 border-t border-blue-200 text-center text-xs tracking-wide text-slate-500">
        <p>
          © {new Date().getFullYear()} MedAgents. {t("home.allRights")}
        </p>
      </div>
    </footer>
  );
};

export default Footer;
