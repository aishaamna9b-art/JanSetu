import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Clock } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';
import { StatusTimeline } from '../../components/StatusTimeline';
import { motion } from 'framer-motion';

const TrackRequest: React.FC = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: request, isLoading } = useQuery({
    queryKey: ['request', id],
    queryFn: () => fetchWithAuth(`/requests/${id}`),
  });

  if (isLoading) {
    return (
      <div className="p-4 flex h-full justify-center items-center bg-primary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="p-4 text-center h-full flex items-center justify-center bg-primary-50">
        <div className="text-ink font-sans text-xl">Request not found.</div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 bg-primary-50 min-h-full max-w-2xl mx-auto"
    >
      <div className="flex items-center space-x-4 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm border border-primary-200 hover:bg-primary-100 transition-colors">
          <ArrowLeft size={24} className="text-ink" />
        </button>
        <h1 className="text-3xl font-serif font-bold text-ink">Tracking</h1>
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-primary-100 mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-100 rounded-bl-full opacity-50 pointer-events-none"></div>
        <p className="text-sm text-ink/60 font-bold uppercase tracking-widest mb-2">{t('tracking_id')}</p>
        <p className="font-mono text-2xl font-bold text-ink mb-6">{request.request_details?.tracking_id || request.tracking_id}</p>
        
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="bg-primary-50/50 p-4 rounded-2xl border border-primary-100">
            <p className="text-xs text-ink/60 font-bold uppercase tracking-wider mb-1">{t('category')}</p>
            <p className="font-sans font-bold text-ink capitalize text-lg">{request.request_details?.category || request.category}</p>
          </div>
          <div className="bg-primary-50/50 p-4 rounded-2xl border border-primary-100">
            <p className="text-xs text-ink/60 font-bold uppercase tracking-wider mb-1">{t('urgency')}</p>
            <p className="font-sans font-bold text-accent-500 text-lg">{request.request_details?.urgency || request.urgency} <span className="text-ink/40 text-sm">/ 5</span></p>
          </div>
        </div>

        {((request.request_details?.original_text || request.original_text) && 
          <div className="bg-primary-50 p-5 rounded-2xl border border-primary-200 relative mb-6">
            <div className="absolute -left-2 top-6 w-1 h-12 bg-primary-500 rounded-r-full"></div>
            <p className="text-xs font-bold text-primary-900/60 uppercase tracking-wider mb-2">Original Request</p>
            <p className="text-ink font-serif text-lg leading-relaxed italic">"{request.request_details?.original_text || request.original_text}"</p>
          </div>
        )}

        {(request.request_details?.photo_url || request.photo_url) && (
          (request.request_details?.photo_analysis?.matches_request ?? request.photo_analysis?.matches_request) !== false ? (
            <div className="bg-primary-50 p-5 rounded-2xl border border-primary-200 relative">
              <p className="text-xs font-bold text-primary-900/60 uppercase tracking-wider mb-2">Attached Photo</p>
              <img src={request.request_details?.photo_url || request.photo_url} alt="User reported issue" className="w-full rounded-xl object-cover" />
            </div>
          ) : (
            <div className="bg-red-50 p-5 rounded-2xl border border-red-200 relative">
              <p className="text-xs font-bold text-red-900/60 uppercase tracking-wider mb-2">Photo Excluded</p>
              <p className="text-red-700 font-sans text-sm">Your attached photo was flagged as unrelated to the reported category and has been excluded from this request.</p>
            </div>
          )
        )}
      </motion.div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-6 md:p-8 rounded-3xl shadow-lg border border-primary-100 mb-8 relative"
      >
        <div className="flex items-center space-x-3 mb-8">
          <div className="p-2 bg-secondary-500/10 text-secondary-500 rounded-xl">
            <Clock size={24} />
          </div>
          <h3 className="font-bold text-2xl font-serif text-ink">{t('status_timeline')}</h3>
        </div>
        
        <StatusTimeline timeline={request.status_timeline || []} currentStatus={request.status} />
      </motion.div>
    </motion.div>
  );
};

export default TrackRequest;
