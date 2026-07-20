import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import LanguageSwitcher from "../../../components/LanguageSwitcher";

const PublicNavbar = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const { isLoggedIn } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const loggedIn = isLoggedIn();

  // حالة التحكم في فتح وإغلاق قائمة الموبايل
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const linkClass = (path) =>
    `text-sm font-medium transition ${
      location.pathname === path
        ? "text-blue-600"
        : isDark
        ? "text-slate-300 hover:text-blue-400"
        : "text-gray-600 hover:text-blue-600"
    }`;

  return (
    <header
      className={`border-b sticky top-0 z-50 shadow-sm backdrop-blur-md transition-colors duration-200 ${
        isDark ? "border-slate-800 bg-slate-950/80" : "border-gray-100/80 bg-white/80"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            onClick={closeMenu}
            className={`text-xl font-bold flex items-center gap-1.5 tracking-tight transition-colors ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            <div className="flex items-center gap-1">
              <svg
                className="w-5 h-5 text-blue-600 animate-pulse"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <span>
              Med<span className="text-blue-600">Agents</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className={linkClass("/")}>
              {t("nav.home")}
            </Link>
            <Link to="/contact" className={linkClass("/contact")}>
              {t("nav.contactUs")}
            </Link>
            <LanguageSwitcher />

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                isDark
                  ? "bg-slate-900 text-yellow-400 hover:bg-slate-800"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              aria-label="Toggle Theme"
            >
              {isDark ? (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.364l-.707-.707M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  ></path>
                </svg>
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                  ></path>
                </svg>
              )}
            </button>

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

          {/* Mobile Hamburger Button */}
          <div className="flex md:hidden items-center gap-2">
            {/* إظهار زرار الـ Theme السريع في الموبايل للمستخدم */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? "text-yellow-400" : "text-slate-600"
              }`}
            >
              {isDark ? "☀️" : "🌙"}
            </button>

            <button
              onClick={toggleMenu}
              className={`p-2 rounded-lg focus:outline-none ${
                isDark ? "text-slate-300 hover:bg-slate-900" : "text-gray-600 hover:bg-gray-100"
              }`}
              aria-label="Toggle Menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {isOpen && (
          <div
            className={`md:hidden border-t py-4 px-2 space-y-4 transition-all duration-200 ${
              isDark ? "border-slate-800" : "border-gray-100"
            }`}
          >
            <div className="flex flex-col space-y-3">
              <Link to="/" onClick={closeMenu} className={linkClass("/")}>
                {t("nav.home")}
              </Link>
              <Link to="/contact" onClick={closeMenu} className={linkClass("/contact")}>
                {t("nav.contactUs")}
              </Link>
            </div>

            <div className="pt-2 border-t border-gray-100/10 flex items-center justify-between">
              <LanguageSwitcher />
            </div>

            <div className="pt-2">
              {loggedIn ? (
                <Link
                  to="/patients"
                  onClick={closeMenu}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                  {t("nav.goToDashboard")}
                </Link>
              ) : (
                <Link
                  to="/login"
                  onClick={closeMenu}
                  className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2.5 rounded-lg transition"
                >
                  {t("home.doctorLogin")}
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default PublicNavbar;