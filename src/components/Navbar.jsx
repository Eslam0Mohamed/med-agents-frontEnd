import { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Patients', path: '/patients' },
  { label: 'Consultations', path: '/consultations' },
  { label: 'Prescriptions', path: '/prescriptions' },
  { label: 'Follow-ups', path: '/followups' },
  { label: 'AI Chat', path: '/ai-chat' },
  { label: 'Drug Safety', path: '/drug-safety' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
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

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'DR';

  return (
    <nav className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
      <div className="flex items-center gap-8">
        <h1 className="text-lg font-bold text-gray-900">
          Med<span className="text-blue-600">Agents</span>
        </h1>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
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
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center bg-gray-100 rounded-md p-0.5">
          <button className="px-2.5 py-1 rounded text-xs font-medium bg-white shadow-sm text-gray-900">
            EN
          </button>
          <button className="px-2.5 py-1 rounded text-xs font-medium text-gray-500">
            AR
          </button>
        </div>

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
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 border-b border-gray-100 cursor-pointer"
              >
                {user?.name || 'Doctor'}
              </button>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg cursor-pointer"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}