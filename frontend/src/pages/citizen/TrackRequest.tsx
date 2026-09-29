import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';
import { StatusTimeline } from '../../components/StatusTimeline';

const TrackRequest: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => fetchWithAuth(`/requests/${id}`),
  });

  if (isLoading) {
    return <div className="p-4 flex justify-center mt-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>;
  }

  if (!request) {
    return <div className="p-4 text-center">Request not found.</div>;
  }

  return (
    <div className="p-4 bg-gray-50 min-h-full">
      <div className="flex items-center space-x-4 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm">
          <ArrowLeft size={24} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Tracking</h1>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
        <p className="text-sm text-gray-500 mb-1">{t('tracking_id')}</p>
        <p className="font-mono text-lg font-bold text-gray-900 mb-4">{request.request_details?.tracking_id || request.tracking_id}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-500">{t('category')}</p>
            <p className="font-semibold text-gray-900 capitalize">{request.request_details?.category || request.category}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('urgency')}</p>
            <p className="font-semibold text-gray-900">{request.request_details?.urgency || request.urgency}/5</p>
          </div>
        </div>

        {((request.request_details?.original_text || request.original_text) && 
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Original Request</p>
            <p className="text-gray-800 italic">"{request.request_details?.original_text || request.original_text}"</p>
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="font-bold text-lg text-gray-900 mb-4">{t('status_timeline')}</h3>
        <StatusTimeline timeline={request.status_timeline || []} currentStatus={request.status} />
      </div>
    </div>
  );
};

export default TrackRequest;
