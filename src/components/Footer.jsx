import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "../context/ThemeContext";

const Footer = () => {
  const { t, i18n } = useTranslation();

  const { theme } = useTheme(); 
  
  const currentLang = i18n.language || "en";
  const isRtl = currentLang === "ar";
  
  const isDark = theme === "dark" || theme === true; 

  return (
    <footer className={`py-8 border-t mt-auto transition-colors duration-300 ${
      isDark ? "bg-[#0b1329] border-slate-850 text-slate-300" : "bg-blue-100 border-blue-200 text-slate-700"
    }`}>
      <div className={`max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-6 ${isRtl ? "text-right" : "text-left"}`}>
        
        {/* Column 1: Logo & Description */}
        <div className="md:col-span-5 space-y-3">
          <Link to="/" className={`text-xl font-bold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>
            Med<span className={isDark ? "text-blue-400" : "text-blue-600"}>Agents</span>
          </Link>
          <p className={`text-sm leading-relaxed max-w-sm ${isDark ? "text-slate-400" : "text-slate-600"}`}>
            {t("footer.description", "AI-powered platform for doctors to manage patients, consultations, and prescriptions with ease.")}
          </p>
          <a href="mailto:eslama202002@gmail.com" className={`block transition ${isDark ? "text-slate-300 hover:text-blue-400" : "text-slate-700 hover:text-blue-600"}`}>
            eslama202002@gmail.com
          </a>
          <a href="https://wa.me/201275772311" target="_blank" rel="noopener noreferrer" className={`block transition ${isDark ? "text-slate-300 hover:text-blue-400" : "text-slate-700 hover:text-blue-600"}`}>
            01275772311
          </a>
        </div>

        {/* Column 2: Navigation */}
        <div className="md:col-span-3 space-y-3">
          <h4 className={`text-xs font-bold tracking-wider uppercase ${isDark ? "text-slate-200" : "text-slate-800"}`}>
            {isRtl ? "الموقع" : "Navigation"}
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/" className={`transition ${isDark ? "text-slate-300 hover:text-blue-400" : "text-slate-700 hover:text-blue-600"}`}>
                {t("nav.home")}
              </Link>
            </li>
            <li>
              <Link to="/contact" className={`transition ${isDark ? "text-slate-300 hover:text-blue-400" : "text-slate-700 hover:text-blue-600"}`}>
                {t("nav.contactUs")}
              </Link>
            </li>
          </ul>
        </div>

       
   {/* Column 3: Features */}
<div className="md:col-span-4 space-y-4">
  <h4 className={`text-xs font-bold tracking-wider uppercase ${isDark ? "text-slate-200" : "text-slate-800"}`}>
    {isRtl ? "المميزات" : "Key Features"}
  </h4>
  <ul className={`space-y-2.5 text-sm p-0 ${isDark ? "text-slate-300" : "text-slate-600"}`}>
    

    <li className="flex items-center gap-2">
      <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-blue-400" : "bg-blue-500"}`}></span>
      <span>{t("home.feature1Title")}</span>
    </li>
    
    <li className="flex items-center gap-2">
      
      <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-purple-400" : "bg-purple-500"}`}></span>
      <span>{t("home.feature2Title")}</span>
    </li>
    

    <li className="flex items-center gap-2">

      <span className={`w-1.5 h-1.5 rounded-full ${isDark ? "bg-green-400" : "bg-green-500"}`}></span>
      <span>{t("home.feature3Title")}</span>
    </li>
  
  </ul>
</div>
      </div>

      {/* Bottom Line */}
      <div className={`max-w-6xl mx-auto px-6 pt-4 mt-6 border-t text-center text-xs tracking-wide ${
        isDark ? "border-slate-800 text-slate-400" : "border-blue-200 text-slate-500"
      }`}>
        <p>© {new Date().getFullYear()} MedAgents. {t("home.allRights")}</p>
      </div>
    </footer>
  );
};

export default Footer;