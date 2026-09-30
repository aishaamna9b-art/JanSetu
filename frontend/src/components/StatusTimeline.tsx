import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Inbox, CheckCircle, Search, IndianRupee, Trophy } from 'lucide-react';

interface TimelineItem {
  status: string;
  timestamp: string;
}

interface StatusTimelineProps {
  timeline: TimelineItem[];
  currentStatus: string;
}

const ALL_STATUSES = ['received', 'verified', 'under_review', 'funded', 'completed'];

const getStatusIcon = (status: string, size = 20) => {
  switch (status) {
    case 'received': return <Inbox size={size} />;
    case 'verified': return <CheckCircle size={size} />;
    case 'under_review': return <Search size={size} />;
    case 'funded': return <IndianRupee size={size} />;
    case 'completed': return <Trophy size={size} />;
    default: return <CheckCircle size={size} />;
  }
};

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ timeline, currentStatus }) => {
  const { t } = useTranslation();
  
  const currentIndex = ALL_STATUSES.indexOf(currentStatus);

  return (
    <div className="relative pl-6 mt-6 space-y-10">
      {ALL_STATUSES.map((status, index) => {
        const isPast = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isFuture = index > currentIndex;
        
        const item = timeline.find(t => t.status === status);

        let colorClass = 'text-ink/40 border-primary-200 bg-white';
        let iconColorClass = 'text-ink/40';
        if (isPast) {
          colorClass = 'border-secondary-500 bg-secondary-500 text-white shadow-md shadow-secondary-500/20';
          iconColorClass = 'text-white';
        } else if (isCurrent) {
          colorClass = 'border-primary-500 bg-white shadow-lg shadow-primary-500/30 border-[3px] scale-110';
          iconColorClass = 'text-primary-500';
        }

        return (
          <div key={status} className="relative z-10">
            {/* Connecting line */}
            {index < ALL_STATUSES.length - 1 && (
              <div className="absolute left-[-21px] top-10 bottom-[-40px] w-1 bg-primary-100 rounded-full z-0 overflow-hidden">
                {(isPast || (isCurrent && index < currentIndex)) && (
                  <motion.div 
                    initial={{ height: 0 }}
                    animate={{ height: '100%' }}
                    transition={{ duration: 0.8, delay: index * 0.2 }}
                    className="w-full bg-secondary-500 rounded-full"
                  />
                )}
              </div>
            )}
            
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="flex items-start"
            >
              <div className={`absolute left-[-35px] w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 z-10 ${colorClass}`}>
                {getStatusIcon(status, isCurrent ? 16 : 14)}
              </div>
              
              <div className="-mt-1 ml-2">
                <h4 className={`text-lg font-bold font-sans transition-colors duration-300 ${isCurrent ? 'text-primary-600' : isPast ? 'text-ink' : 'text-ink/40'}`}>
                  {t(status)}
                </h4>
                <div className="h-5">
                  {item?.timestamp && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-ink/60 mt-1 font-medium"
                    >
                      {new Date(item.timestamp).toLocaleDateString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </motion.p>
                  )}
                  {isCurrent && !item?.timestamp && (
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-sm text-primary-500 font-bold mt-1 animate-pulse"
                    >
                      In Progress...
                    </motion.p>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
};
