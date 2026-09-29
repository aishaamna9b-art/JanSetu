import React from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Copy, Home, Volume2 } from 'lucide-react';

const Confirmation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Data passed via react-router state
  const data = location.state?.data;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(id || '');
    alert("Copied!");
  };

  return (
    <div className="p-4 h-full bg-primary-50 flex flex-col items-center">
      <div className="mt-8 text-primary-600">
        <CheckCircle size={80} className="mx-auto" />
      </div>
      
      <h1 className="text-3xl font-bold text-gray-900 mt-6 text-center">
        {t('confirmation_title')}
      </h1>

      <div className="w-full bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mt-8">
        {data && (
          <div className="space-y-4 mb-6 text-center">
            <p className="text-gray-700 text-lg leading-relaxed">
              {data.confirmation_message}
            </p>
            {data.confirmation_audio_url && (
              <button className="mx-auto flex items-center space-x-2 text-primary-600 bg-primary-50 py-2 px-4 rounded-full">
                <Volume2 size={20} />
                <span>Play Message</span>
              </button>
            )}
            <div className="flex justify-center space-x-4 mt-4">
              <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                {t('category')}: {data.category}
              </span>
              <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                {t('urgency')}: {data.urgency}/5
              </span>
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-6">
          <p className="text-sm text-gray-500 text-center mb-2">{t('tracking_id')}</p>
          <div className="flex items-center justify-center space-x-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
            <span className="font-mono text-xl font-bold text-gray-900">{id}</span>
            <button onClick={copyToClipboard} className="text-primary-600 p-2 hover:bg-primary-50 rounded-lg">
              <Copy size={24} />
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/citizen')}
        className="w-full py-4 mt-8 bg-white border-2 border-primary-600 text-primary-600 font-bold text-lg rounded-xl flex justify-center items-center space-x-2"
      >
        <Home size={20} />
        <span>{t('home')}</span>
      </button>
    </div>
  );
};

export default Confirmation;
