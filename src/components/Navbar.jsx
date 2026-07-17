import { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = [
  { label: "Patients", path: "/patients" },
  { label: "Consultations", path: "/consultations" },
  { label: "Add Consultation", path: "/consultations/search-patient" },
  { label: "Prescriptions", path: "/prescriptions" },
  { label: "Follow-ups", path: "/followups" },
  { label: "AI Chat", path: "/ai-chat" },
  { label: "Drug Safety", path: "/drug-safety" },
  { label: "Subscriptions", path: "/Subscriptions" },
];

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  const navItems = [
    { label: t("nav.patients"), path: "/patients" },
    { label: t("nav.consultations"), path: "/consultations" },
    { label: t("nav.addConsultation"), path: "/consultations/search-patient" },
    { label: t("nav.prescriptions"), path: "/prescriptions" },
    { label: t("nav.followups"), path: "/followups" },
    { label: t("nav.aiChat"), path: "/ai-chat" },
    { label: t("nav.drugSafety"), path: "/drug-safety" },
    { label: t("nav.reports"), path: "/reports" },
    { label: t("nav.subscriptions"), path: "/subscriptions" },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials =
    user?.name
      ?.split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "DR";

  return (
    <nav
      className={`border-b sticky top-0 z-50 transition-colors duration-200 ${
        isDark ? "bg-slate-950 border-slate-900" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            className="md:hidden flex flex-col gap-1.5 p-1 cursor-pointer"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <span
              className={`block w-5 h-0.5 transition-all duration-200 ${
                isDark ? "bg-slate-300" : "bg-gray-600"
              } ${mobileOpen ? "rotate-45 translate-y-2" : ""}`}
            ></span>
            <span
              className={`block w-5 h-0.5 transition-all duration-200 ${
                isDark ? "bg-slate-300" : "bg-gray-600"
              } ${mobileOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`block w-5 h-0.5 transition-all duration-200 ${
                isDark ? "bg-slate-300" : "bg-gray-600"
              } ${mobileOpen ? "-rotate-45 -translate-y-2" : ""}`}
            ></span>
          </button>

          <h1
            className={`text-lg font-bold cursor-pointer transition-colors ${
              isDark ? "text-white" : "text-gray-900"
            }`}
            onClick={() => navigate("/")}
          >
            Med<span className="text-blue-600">Agents</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              end
              to={item.path}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "text-blue-600 bg-blue-50/10"
                    : isDark
                      ? "text-slate-300 hover:text-white hover:bg-slate-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
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
                xmlns="http://www.w3.org/2000/svg"
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
                xmlns="http://www.w3.org/2000/svg"
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

          <button
            className={`hover:opacity-80 transition ${isDark ? "text-slate-300" : "text-gray-500"}`}
          >
            🔔
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center cursor-pointer"
            >
              {initials}
            </button>

            {menuOpen && (
              <div
                className={`absolute end-0 mt-2 w-48 border rounded-lg shadow-lg z-50 transition-colors ${
                  isDark
                    ? "bg-slate-900 border-slate-800 shadow-slate-950/80"
                    : "bg-white border-gray-200"
                }`}
              >
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/profile");
                  }}
                  className={`w-full text-left px-4 py-2 text-sm border-b cursor-pointer transition-colors ${
                    isDark
                      ? "text-slate-200 hover:bg-slate-800 border-slate-800"
                      : "text-gray-700 hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  {user?.name || "Doctor"}
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/");
                  }}
                  className={`w-full text-left px-4 py-2 text-sm border-b cursor-pointer transition-colors ${
                    isDark
                      ? "text-slate-200 hover:bg-slate-800 border-slate-800"
                      : "text-gray-700 hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  {t("nav.home")}
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/contact");
                  }}
                  className={`w-full text-left px-4 py-2 text-sm border-b cursor-pointer transition-colors ${
                    isDark
                      ? "text-slate-200 hover:bg-slate-800 border-slate-800"
                      : "text-gray-700 hover:bg-gray-50 border-gray-200"
                  }`}
                >
                  {t("nav.contactUs")}
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    logout();
                  }}
                  className={`w-full text-left px-4 py-2 text-sm cursor-pointer transition-colors ${
                    isDark
                      ? "text-red-400 hover:bg-slate-800"
                      : "text-red-600 hover:bg-red-50"
                  }`}
                >
                  {t("nav.logout")}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div
          className={`md:hidden border-t px-4 py-3 flex flex-col gap-1 transition-colors ${
            isDark
              ? "bg-slate-950 border-slate-900"
              : "bg-white border-gray-100"
          }`}
        >
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive
                    ? "text-blue-600 bg-blue-50/10"
                    : isDark
                      ? "text-slate-300 hover:text-white hover:bg-slate-900"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
