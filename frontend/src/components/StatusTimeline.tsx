import React from 'react';
import { useTranslation } from 'react-i18next';

interface TimelineItem {
  status: string;
  timestamp: string;
}

interface StatusTimelineProps {
  timeline: TimelineItem[];
  currentStatus: string;
}

const ALL_STATUSES = ['received', 'verified', 'under_review', 'funded', 'completed'];

export const StatusTimeline: React.FC<StatusTimelineProps> = ({ timeline, currentStatus }) => {
  const { t } = useTranslation();
  
  const currentIndex = ALL_STATUSES.indexOf(currentStatus);

  return (
    <div className="relative pl-4 mt-6 space-y-8">
      {ALL_STATUSES.map((status, index) => {
        const isPast = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const item = timeline.find(t => t.status === status);

        return (
          <div key={status} className="relative">
            {/* Connecting line */}
            {index < ALL_STATUSES.length - 1 && (
              <div className={`absolute left-[-21px] top-6 bottom-[-32px] w-0.5 ${isPast && !isCurrent ? 'bg-primary-500' : 'bg-gray-200'}`}></div>
            )}
            
            <div className="flex items-start">
              <div className={`absolute left-[-28px] w-4 h-4 rounded-full border-2 bg-white flex items-center justify-center ${
                isPast ? 'border-primary-500' : 'border-gray-300'
              }`}>
                {isPast && <div className="w-2 h-2 rounded-full bg-primary-500"></div>}
              </div>
              
              <div className="-mt-1">
                <h4 className={`text-base font-bold ${isPast ? 'text-gray-900' : 'text-gray-400'}`}>
                  {t(status)}
                </h4>
                {item?.timestamp && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
