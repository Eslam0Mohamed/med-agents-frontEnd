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

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'DR';

  return (
    <nav className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-3">
      {/* Logo */}
      <div className="flex items-center gap-8">
        <h1 className="text-lg font-bold text-gray-900">
          Med<span className="text-blue-600">Agents</span>
        </h1>

        {/* Nav links */}
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

      {/* Right side */}
      <div className="flex items-center gap-4">

        {/* Add Consultation Button */}
        <button
          onClick={() => navigate('/consultations/search-patient')}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md transition flex items-center gap-1.5"
        >
          <span className="text-base leading-none">+</span>
          Add Consultation
        </button>

        <div className="flex items-center bg-gray-100 rounded-md p-0.5">
          <button className="px-2.5 py-1 rounded text-xs font-medium bg-white shadow-sm text-gray-900">
            EN
          </button>
          <button className="px-2.5 py-1 rounded text-xs font-medium text-gray-500">
            AR
          </button>
        </div>

        <button className="text-gray-400 hover:text-gray-600">
          🔔
        </button>

        <div className="relative group">
          <button className="w-9 h-9 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">
            {initials}
          </button>
          <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition">
            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
              {user?.name || 'Doctor'}
            </div>
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}