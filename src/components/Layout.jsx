import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '../context/ThemeContext';

export default function Layout() {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-355 ${
      isDark ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'
    }`}>
      <Navbar />
      <main className="p-6 flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}