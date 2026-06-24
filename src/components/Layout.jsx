import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

export default function Layout() {
  return (
    <div className=" bg-gray-50">
      <Navbar />
      <main className="p-6 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}