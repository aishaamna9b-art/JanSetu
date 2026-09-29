import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { auth } from '../lib/firebase';
import { LayoutDashboard, Map, BarChart3, LogOut, Lightbulb, Calculator, FileText, Activity } from 'lucide-react';

export default function OfficerLayout() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { to: '/officer', icon: LayoutDashboard, label: 'Overview', end: true },
    { to: '/officer/hotspots', icon: Map, label: 'Hotspot Map' },
    { to: '/officer/gaps', icon: BarChart3, label: 'Gap Analysis' },
    { to: '/officer/recommendations', icon: Lightbulb, label: 'Recommendations' },
    { to: '/officer/simulator', icon: Calculator, label: 'Budget Simulator' },
    { to: '/officer/policy', icon: FileText, label: 'Policy Brief' },
    { to: '/officer/impact', icon: Activity, label: 'Impact Tracker' },
  ];

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">JanSetu Officer</h1>
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
