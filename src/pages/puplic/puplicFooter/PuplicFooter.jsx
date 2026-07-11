import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const PublicFooter = () => {
  const { t, i18n } = useTranslation();
  const currentLang = i18n.language || "en";
  const isRtl = currentLang === "ar";

  return (
    <footer className="py-16 border-t bg-slate-950 border-slate-900 text-slate-400">
      <div
        dir={isRtl ? "rtl" : "ltr"}
        className={`max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10 ${isRtl ? "text-right" : "text-left"}`}
      >
        {/* Logo & Description */}
        <div className="md:col-span-5 space-y-4">
          <Link to="/" className="text-xl font-bold tracking-tight text-white">
            Med<span className="text-blue-600">Agents</span>
          </Link>
          <p className="text-sm leading-relaxed max-w-sm text-slate-400">
            {t(
              "footer.description",
              "AI-powered platform for doctors to manage patients, consultations, and prescriptions with ease.",
            )}
          </p>
        </div>

        {/* Column 2: Navigation */}
        <div className="md:col-span-3 space-y-4">
          <h4 className="text-xs font-bold tracking-wider uppercase text-slate-200">
            {isRtl ? "الموقع" : "Navigation"}
          </h4>
          <ul className="space-y-2.5 text-sm">
            <li>
              <Link
                to="/"
                className="text-slate-400 hover:text-blue-500 transition"
              >
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                className="text-slate-400 hover:text-blue-500 transition"
              >
                {t("nav.contactUs")}
              </Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Features */}
        <div className="md:col-span-4 space-y-4">
          <h4 className="text-xs font-bold tracking-wider uppercase text-slate-200">
            {isRtl ? "المميزات" : "Key Features"}
          </h4>
          <ul className="space-y-2.5 text-sm text-slate-400">
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              <span>{t("home.feature1Title")}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              <span>{t("home.feature2Title")}</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{t("home.feature3Title")}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Line */}
      <div className="max-w-6xl mx-auto px-6 pt-8 mt-10 border-t border-slate-900 text-center text-xs tracking-wide text-slate-500">
        <p>
          © {new Date().getFullYear()} MedAgents. {t("home.allRights")}
        </p>
      </div>
    </footer>
  );
};

export default PublicFooter;
