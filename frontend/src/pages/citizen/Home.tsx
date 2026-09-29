import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Mic, List, LogOut } from 'lucide-react';
import { auth } from '../../lib/firebase';

const CitizenHome: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    localStorage.removeItem('mock_role');
    await auth.signOut();
    window.location.href = '/login';
  };

  return (
    <div className="p-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">JanSetu</h1>
        <button onClick={handleLogout} className="p-2 text-gray-500 hover:text-gray-700">
          <LogOut size={24} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-md mt-12 space-y-12">
        <button
          onClick={() => navigate('/citizen/submit')}
          className="w-48 h-48 rounded-full bg-primary-500 text-white shadow-2xl flex flex-col items-center justify-center transform transition-transform active:scale-95 hover:bg-primary-600"
        >
          <Mic size={64} className="mb-2" />
          <span className="text-xl font-bold text-center px-4 leading-tight">{t('record_voice')}</span>
        </button>

        <button
          onClick={() => navigate('/citizen/requests')}
          className="w-full p-4 bg-white rounded-xl shadow border border-gray-100 flex items-center justify-between mt-8 active:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
              <List size={24} />
            </div>
            <span className="text-lg font-semibold text-gray-800">{t('my_requests')}</span>
          </div>
        </button>
      </div>
    </div>
  );
};

export default CitizenHome;
