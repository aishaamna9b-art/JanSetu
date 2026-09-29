import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

const MyRequests: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => fetchWithAuth('/requests/mine'),
  });

  if (isLoading) {
    return <div className="p-4 flex justify-center mt-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="p-4 bg-gray-50 min-h-full">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('my_requests')}</h1>
      
      <div className="space-y-4">
        {requests?.map((req: any) => (
          <div 
            key={req.id} 
            onClick={() => navigate(`/citizen/requests/${req.tracking_id}`)}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between active:bg-gray-50"
          >
            <div>
              <p className="font-mono text-sm text-gray-500">{req.tracking_id}</p>
              <h3 className="font-bold text-gray-900 capitalize text-lg mt-1">{req.category}</h3>
              <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${
                req.status === 'completed' ? 'bg-green-100 text-green-800' :
                req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {t(req.status)}
              </span>
            </div>
            <ChevronRight className="text-gray-400" />
          </div>
        ))}

        {requests?.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            No requests found.
          </div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
