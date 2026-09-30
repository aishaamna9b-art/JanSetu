import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { Database, MapPin, Users, LogOut, Menu, X } from 'lucide-react';

export default function AdminLayout() {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/admin', icon: Database, label: 'Datasets', end: true },
    { to: '/admin/regions', icon: MapPin, label: 'Regions' },
    { to: '/admin/users', icon: Users, label: 'Users & Roles' },
  ];

  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <Menu size={24} />
          </button>
          <h1 className="text-xl font-bold text-blue-600 dark:text-blue-400">JanSetu Admin</h1>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsMobileMenuOpen(false)} 
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 transition-transform duration-300 ease-in-out
        w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">JanSetu Admin</h1>
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-medium' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                }`
              }
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
