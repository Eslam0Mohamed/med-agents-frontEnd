import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Patients', path: '/patients' },
  { label: 'Consultations', path: '/consultations' },
  { label: 'Add Consultation', path: '/consultations/search-patient' },
  { label: 'Prescriptions', path: '/prescriptions' },
  { label: 'Follow-ups', path: '/followups' },
  { label: 'AI Chat', path: '/ai-chat' },
  { label: 'Drug Safety', path: '/drug-safety' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);

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
      {/* Hamburger - mobile only */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-1 cursor-pointer"
        onClick={() => setMobileOpen((prev) => !prev)}
      >
        <span className={`block w-5 h-0.5 bg-gray-600 transition-transform ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`}></span>
        <span className={`block w-5 h-0.5 bg-gray-600 transition-opacity ${mobileOpen ? 'opacity-0' : ''}`}></span>
        <span className={`block w-5 h-0.5 bg-gray-600 transition-transform ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`}></span>
      </button>

      {/* Logo */}
      <h1 className="text-lg font-bold text-gray-900">
        Med<span className="text-blue-600">Agents</span>
      </h1>
    </div>   
    {/* Desktop links */}
    <div className="hidden md:flex items-center gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          end
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm font-medium transition ${
              isActive
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`
          }
        >
          {item.label}
        </NavLink>
      ))}
    </div>

    {/* Right side */}
    <div className="flex items-center gap-3">
      <button className="text-gray-400 hover:text-gray-600">🔔</button>

      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center cursor-pointer"
        >
          {initials}
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
            <button
              onClick={() => { setMenuOpen(false); navigate('/profile'); }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b cursor-pointer"
            >
              {user?.name || 'Doctor'}
            </button>
            <button
              onClick={() => { setMenuOpen(false); logout(); }}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
       </div>
  {/* Mobile menu */}
  {mobileOpen && (
    <div className="md:hidden border-t border-gray-100 px-4 py-3 flex flex-col gap-1">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            `px-3 py-2 rounded-md text-sm font-medium transition ${
              isActive
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