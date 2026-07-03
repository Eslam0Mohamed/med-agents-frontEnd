import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";

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
    <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="text-xl font-semibold text-gray-900">
          Med<span className="text-blue-600">Agents</span>
        </Link>

        <nav className="flex items-center gap-8">
          <Link to="/" className={linkClass("/")}>
            {t("nav.home")}
          </Link>
          <Link to="/contact" className={linkClass("/contact")}>
            {t("nav.contactUs")}
          </Link>
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