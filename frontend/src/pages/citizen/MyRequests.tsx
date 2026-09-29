import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ChevronRight, FileText, CheckCircle, Clock } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';
import { motion } from 'framer-motion';

const getStatusConfig = (status: string) => {
  switch (status) {
    case 'completed':
    case 'verified':
    case 'funded':
      return { bg: 'bg-secondary-500/10', text: 'text-secondary-500', border: 'border-secondary-500/20', icon: <CheckCircle size={14} className="mr-1.5" /> };
    case 'rejected':
      return { bg: 'bg-accent-500/10', text: 'text-accent-500', border: 'border-accent-500/20', icon: <FileText size={14} className="mr-1.5" /> };
    default:
      return { bg: 'bg-primary-500/10', text: 'text-primary-600', border: 'border-primary-500/20', icon: <Clock size={14} className="mr-1.5" /> };
  }
};

const MyRequests: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: requests, isLoading } = useQuery({
    queryKey: ['my-requests'],
    queryFn: () => fetchWithAuth('/requests/mine'),
  });

  if (isLoading) {
    return (
      <div className="p-4 flex h-full justify-center items-center bg-primary-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
      </div>
    );
  }

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="p-4 md:p-8 bg-primary-50 min-h-full pb-24">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center space-x-3 mb-8 pt-4">
          <div className="p-3 bg-white rounded-2xl shadow-sm border border-primary-200">
            <FileText className="text-primary-600" size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-serif font-bold text-ink">{t('my_requests')}</h1>
            <p className="text-ink/60 font-sans text-sm">Track the progress of your submissions</p>
          </div>
        </div>
        
        {requests && requests.length > 0 ? (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="space-y-4"
          >
            {requests.map((req: any) => {
              const statusConfig = getStatusConfig(req.status);
              return (
                <motion.div 
                  variants={item}
                  key={req.id} 
                  onClick={() => navigate(`/citizen/requests/${req.tracking_id}`)}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="bg-white p-5 rounded-2xl shadow-sm hover:shadow-md border border-primary-100 flex items-center justify-between cursor-pointer transition-all duration-300 group"
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <p className="font-mono text-xs font-bold text-ink/50 uppercase tracking-widest">{req.tracking_id}</p>
                      <span className={`flex items-center px-2.5 py-1 text-[11px] font-bold rounded-full uppercase tracking-wider border ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}>
                        {statusConfig.icon}
                        {t(req.status)}
                      </span>
                    </div>
                    <h3 className="font-serif font-bold text-ink text-xl capitalize leading-tight group-hover:text-primary-600 transition-colors">{req.category}</h3>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center group-hover:bg-primary-100 transition-colors shrink-0">
                    <ChevronRight className="text-primary-600" size={20} />
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center p-12 bg-white rounded-3xl shadow-sm border border-primary-100 mt-8"
          >
            <div className="w-20 h-20 mx-auto bg-primary-50 rounded-full flex items-center justify-center mb-6">
              <FileText className="text-primary-300" size={32} />
            </div>
            <h3 className="text-xl font-serif font-bold text-ink mb-2">No Requests Yet</h3>
            <p className="text-ink/60 font-sans mb-8">You haven't submitted any issues or feedback.</p>
            <button 
              onClick={() => navigate('/citizen')}
              className="px-6 py-3 bg-primary-600 text-white font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:bg-primary-700 transition-colors"
            >
              Submit a Request
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MyRequests;
