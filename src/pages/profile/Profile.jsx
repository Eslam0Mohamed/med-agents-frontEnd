import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ?.split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || 'DR';

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <div className="bg-white border border-gray-200 rounded-xl p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-600 text-white text-xl font-semibold flex items-center justify-center">
            {initials}
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{user?.name || 'Doctor'}</h1>
            <p className="text-sm text-gray-500 capitalize">{user?.role || 'doctor'}</p>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-6 space-y-4 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Name</span>
            <span className="text-gray-900 font-medium">{user?.name || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Specialty</span>
            <span className="text-gray-900 font-medium">{user?.specialty || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Role</span>
            <span className="text-gray-900 font-medium capitalize">{user?.role || '—'}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Preferred language</span>
            <span className="text-gray-900 font-medium">
              {user?.language === 'ar' ? 'Arabic' : 'English'}
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/settings')}
          className="w-full bg-blue-600 text-white rounded-md py-2.5 text-sm font-medium hover:bg-blue-700 transition cursor-pointer"
        >
          Edit profile / Change password
        </button>
      </div>
    </div>
  );
}