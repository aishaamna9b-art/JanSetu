import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Mic, List, LogOut, Home, User as UserIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';

const CitizenLayout: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      localStorage.removeItem('mock_role');
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-primary-50">
      <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-white to-green-500 shrink-0" />
      <header className="bg-white px-4 py-2 shadow-sm flex items-center justify-between border-b border-primary-200 z-50 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-xs font-bold text-gray-500">LOGO</div>
          <h1 className="font-serif font-bold text-xl text-ink">JanSetu</h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="hidden sm:flex items-center space-x-1 border-r border-gray-200 pr-3">
            <button className="text-sm font-bold text-gray-600 hover:text-blue-600 px-1">A-</button>
            <button className="text-base font-bold text-gray-600 hover:text-blue-600 px-1">A</button>
            <button className="text-lg font-bold text-gray-600 hover:text-blue-600 px-1">A+</button>
          </div>
          <select className="text-sm border-none bg-transparent text-gray-600 font-medium focus:ring-0 cursor-pointer">
            <option value="en">English</option>
            <option value="hi">हिन्दी</option>
            <option value="ta">தமிழ்</option>
          </select>
          <button 
            onClick={handleLogout}
            className="text-ink/60 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50 ml-2"
            aria-label="Logout"
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </div>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-primary-200 flex justify-around p-3 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.02)] z-50">
        <NavLink
          to="/citizen"
          end
          className={({ isActive }) =>
            `flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-primary-600 bg-primary-50 scale-105' : 'text-ink/50 hover:text-ink/70'}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive ? <Mic size={24} className="text-primary-600" /> : <Home size={24} />}
              <span className="text-xs mt-1 font-sans font-medium">Home</span>
            </>
          )}
        </NavLink>

        <NavLink
          to="/citizen/requests"
          className={({ isActive }) =>
            `flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-primary-600 bg-primary-50 scale-105' : 'text-ink/50 hover:text-ink/70'}`
          }
        >
          <List size={24} />
          <span className="text-xs mt-1 font-sans font-medium">{t('my_requests', 'My Requests')}</span>
        </NavLink>
        
        <NavLink
          to="/citizen/settings"
          className={({ isActive }) =>
            `flex flex-col items-center p-2 rounded-xl transition-all duration-300 ${isActive ? 'text-primary-600 bg-primary-50 scale-105' : 'text-ink/50 hover:text-ink/70'}`
          }
        >
          <UserIcon size={24} />
          <span className="text-xs mt-1 font-sans font-medium">Profile</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default CitizenLayout;
