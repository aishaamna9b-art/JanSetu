import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, List, PlusCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CitizenLayout: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="flex-1 overflow-y-auto pb-16">
        <Outlet />
      </div>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 pb-safe">
        <NavLink
          to="/citizen"
          end
          className={({ isActive }) =>
            `flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-primary-600' : 'text-gray-500'}`
          }
        >
          <Home size={24} />
          <span className="text-xs mt-1 font-medium">{t('home')}</span>
        </NavLink>

        <NavLink
          to="/citizen/submit"
          className={({ isActive }) =>
            `flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-primary-600' : 'text-gray-500'}`
          }
        >
          <PlusCircle size={28} className="text-primary-600" />
          <span className="text-xs mt-1 font-medium">{t('submit')}</span>
        </NavLink>

        <NavLink
          to="/citizen/requests"
          className={({ isActive }) =>
            `flex flex-col items-center p-2 rounded-lg ${isActive ? 'text-primary-600' : 'text-gray-500'}`
          }
        >
          <List size={24} />
          <span className="text-xs mt-1 font-medium">{t('my_requests')}</span>
        </NavLink>
      </nav>
    </div>
  );
};

export default CitizenLayout;
