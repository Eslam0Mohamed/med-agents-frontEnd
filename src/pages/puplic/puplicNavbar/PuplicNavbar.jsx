import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import LanguageSwitcher from "../../../components/LanguageSwitcher";

const PublicNavbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const loggedIn = isLoggedIn();

  const linkClass = (path) =>
    `text-sm font-medium transition ${
      location.pathname === path
        ? "text-blue-600"
        : "text-gray-600 hover:text-blue-600"
    }`;

  return (
    <header className="border-b border-gray-100/80 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-bold text-gray-900 flex items-center gap-2 tracking-tight">
          <svg className="w-6 h-6 text-blue-600 animate-pulse" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
          </svg>
          <span>Med<span className="text-blue-600">Agents</span></span>
        </Link>

        <nav className="flex items-center gap-8">
          <Link to="/" className={linkClass("/")}>
            {t("nav.home")}
          </Link>
          <Link to="/contact" className={linkClass("/contact")}>
            {t("nav.contactUs")}
          </Link>
          <LanguageSwitcher />
          {loggedIn ? (
            <Link
              to="/patients"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {t("nav.goToDashboard")}
            </Link>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              {t("home.doctorLogin")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default PublicNavbar;