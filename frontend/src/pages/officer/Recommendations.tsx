import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { MapPin, AlertTriangle, Users, DollarSign, Lightbulb } from 'lucide-react';
import ScoreBreakdown from '../../components/ScoreBreakdown';

interface Recommendation {
  project_id: string;
  cluster_id: string;
  title: string;
  category: string;
  region: string;
  people_served: number;
  cost_estimate: number;
  priority_score: number;
  score_breakdown: {
    volume: number;
    urgency: number;
    severity: number;
    infra_gap: number;
    population: number;
  };
  ai_justification: string;
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
    if (score >= 90) return 'border-red-500 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400';
    if (score >= 70) return 'border-orange-500 bg-orange-50 dark:bg-orange-900/10 text-orange-700 dark:text-orange-400';
    return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10 text-yellow-700 dark:text-yellow-400';
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Recommendations</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Data-driven project proposals optimizing budget and impact</p>
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
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load recommendations</h3>
            <p className="text-sm mt-1">{(error as Error).message}</p>
          </div>
        </div>
      ) : !recommendations?.length ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <Lightbulb className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Recommendations Available</h3>
        </div>
      ) : (
        <div className="grid gap-8">
          {recommendations.map((rec) => (
            <div 
              key={rec.project_id} 
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border-l-4 border-y border-r border-y-gray-100 border-r-gray-100 dark:border-y-gray-700 dark:border-r-gray-700 overflow-hidden hover:shadow-md transition-all ${getPriorityColor(rec.priority_score).split(' ')[0]}`}
            >
              <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8">
                
                {/* Left Column: Details */}
                <div className="flex-1 space-y-6">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs font-semibold px-2.5 py-0.5 rounded uppercase tracking-wide">
                        {rec.category.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <MapPin size={14} /> {rec.region}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{rec.title}</h2>
                  </div>

                  <div className="flex flex-wrap gap-6">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                        <Users size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">People Served</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{rec.people_served.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">
                        <DollarSign size={24} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Est. Cost</p>
                        <p className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(rec.cost_estimate)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-lg border border-blue-100 dark:border-blue-900/30 relative">
                    <Lightbulb className="absolute top-5 right-5 text-blue-200 dark:text-blue-900/50" size={48} />
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2 flex items-center gap-2">
                      AI Justification
                    </h4>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed relative z-10">
                      {rec.ai_justification}
                    </p>
                  </div>
                </div>

                {/* Right Column: Score Breakdown */}
                <div className="lg:w-[350px] shrink-0 flex flex-col justify-center">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-800">
                    <ScoreBreakdown scores={rec.score_breakdown} totalScore={rec.priority_score} />
                    
                    <div className="mt-8">
                      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-sm shadow-blue-600/20">
                        Add to Budget Simulator
                      </button>
                    </div>
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
