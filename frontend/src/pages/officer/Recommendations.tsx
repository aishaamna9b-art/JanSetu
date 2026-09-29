import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { MapPin, AlertTriangle, MessageSquare, Tag, Users, TrendingUp } from 'lucide-react';

interface Recommendation {
  cluster_id: string;
  category: string;
  count: number;
  lat: number;
  lng: number;
  district: string;
  block: string;
  priority_score: number;
  example_text: string;
}

export default function Recommendations() {
  const [district, setDistrict] = useState('');

  const { data: recommendations, isLoading, error } = useQuery<Recommendation[]>({
    queryKey: ['recommendations', district],
    queryFn: () => {
      const params = new URLSearchParams();
      if (district) params.append('district', district);
      return fetchWithAuth(`/recommendations?${params.toString()}`);
    }
  });

  const getPriorityColor = (score: number) => {
    if (score >= 80) return 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800';
    if (score >= 50) return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800';
    return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800';
  };

  const getPriorityLabel = (score: number) => {
    if (score >= 80) return 'Critical Priority';
    if (score >= 50) return 'High Priority';
    return 'Medium Priority';
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Recommendations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Data-driven action plans based on semantic clustering of citizen requests</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <MapPin size={18} className="text-gray-400 ml-2" />
          <select 
            value={district} 
            onChange={e => setDistrict(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer dark:text-white"
          >
            <option value="">All Districts</option>
            <option value="Lucknow">Lucknow</option>
            <option value="Kanpur">Kanpur</option>
            <option value="Varanasi">Varanasi</option>
            <option value="Agra">Agra</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load recommendations</h3>
            <p className="text-sm opacity-90 mt-1">{(error as Error).message}</p>
          </div>
        </div>
      ) : !recommendations?.length ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Recommendations Available</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Check back later for new data insights.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {recommendations.map((rec) => (
            <div 
              key={rec.cluster_id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6">
                
                {/* Score & Category Column */}
                <div className="flex flex-col items-start gap-4 md:w-1/4">
                  <div className={`px-4 py-2 rounded-lg border font-bold text-lg flex items-center gap-2 ${getPriorityColor(rec.priority_score)}`}>
                    <AlertTriangle size={20} />
                    <span>Score: {Math.round(rec.priority_score)}</span>
                  </div>
                  
                  <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {getPriorityLabel(rec.priority_score)}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-auto pt-4 md:pt-0">
                    <Tag size={16} className="text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white capitalize">
                      {rec.category.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Details Column */}
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <TrendingUp className="text-blue-600" />
                      Emerging Issue Cluster
                    </h3>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
                      <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                        <Users size={14} />
                        {rec.count} related reports
                      </span>
                      {rec.district && (
                        <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                          <MapPin size={14} />
                          {rec.district}{rec.block ? `, ${rec.block}` : ''}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900/50">
                    <div className="flex gap-3">
                      <MessageSquare className="text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" size={20} />
                      <div>
                        <span className="text-sm font-semibold text-blue-900 dark:text-blue-300 uppercase tracking-wider block mb-1">
                          Representative Request
                        </span>
                        <p className="text-gray-800 dark:text-gray-200 italic">
                          "{rec.example_text}"
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-2">
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition-colors text-sm">
                      Take Action
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
