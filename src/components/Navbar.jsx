import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

  const navItems = [
    { label: t('nav.patients'), path: '/patients' },
    { label: t('nav.consultations'), path: '/consultations' },
    { label: t('nav.addConsultation'), path: '/consultations/search-patient' },
    { label: t('nav.prescriptions'), path: '/prescriptions' },
    { label: t('nav.followups'), path: '/followups' },
    { label: t('nav.aiChat'), path: '/ai-chat' },
    { label: t('nav.drugSafety'), path: '/drug-safety' },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const initials =
    user?.name
      ?.split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || 'DR';

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">

        <div className="flex items-center gap-3">
          <button
            className="md:hidden flex flex-col gap-1.5 p-1 cursor-pointer"
            onClick={() => setMobileOpen((prev) => !prev)}
          >
            <span className={`block w-5 h-0.5 bg-gray-600 transition-transform ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-gray-600 transition-opacity ${mobileOpen ? 'opacity-0' : ''}`}></span>
            <span className={`block w-5 h-0.5 bg-gray-600 transition-transform ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
          </button>

        <h1
  className="text-lg font-bold text-gray-900 cursor-pointer"
  onClick={() => navigate('/')}
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
                `px-3 py-2 rounded-md text-sm font-medium transition ${isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <button className="text-gray-400 hover:text-gray-600">🔔</button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((prev) => !prev)}
              className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center cursor-pointer"
            >
              {initials}
            </button>

            {menuOpen && (
              // <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  <div className="absolute end-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                
                <button
                  onClick={() => { setMenuOpen(false); navigate('/profile'); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b cursor-pointer"
                >
                  {user?.name || 'Doctor'}
                </button>

                <button
                  onClick={() => { setMenuOpen(false); navigate('/'); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b cursor-pointer"
                >
                  Home
                </button>

                <button
                  onClick={() => { setMenuOpen(false); navigate('/contact'); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b cursor-pointer"
                >
                  Contact Us
                </button>

                <button
                  onClick={() => { setMenuOpen(false); logout(); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
                >
                  {t('nav.logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 px-4 py-3 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2 rounded-md text-sm font-medium transition ${isActive
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
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