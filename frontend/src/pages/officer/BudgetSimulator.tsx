import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { MapPin, Calculator, Play, DollarSign, Users, CheckCircle, BrainCircuit, Activity } from 'lucide-react';
interface SimulatorResponse {
  status: string;
  data: {
    selected_projects: Array<{
      cluster_id: string;
      category: string;
      title?: string;
      location: { lat: number; lng: number; address: string };
      estimated_cost: number;
      impact_score: number;
      people_served: number;
      ai_justification: string;
    }>;
    summary: {
      total_allocated: number;
      remaining_budget: number;
      projects_funded: number;
      total_people_served: number;
    };
    ai_analysis: string;
  };
}

const CATEGORIES = [
  { id: 'water', label: 'Water' },
  { id: 'roads', label: 'Roads' },
  { id: 'electricity', label: 'Electricity' },
  { id: 'sanitation', label: 'Sanitation' },
  { id: 'healthcare', label: 'Healthcare' }
];

export default function BudgetSimulator() {
  const [budget, setBudget] = useState(5000000);
  const [district, setDistrict] = useState('Patna');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['water', 'roads']);
  
  // To handle smooth animations on result update
  const [prevSummary, setPrevSummary] = useState<SimulatorResponse['data']['summary'] | null>(null);
  
  const mutation = useMutation({
    mutationFn: async () => {
      return fetchWithAuth('/simulator/run', {
        method: 'POST',
        body: JSON.stringify({
          total_budget: budget,
          state: 'Bihar',
          district,
          prioritize_categories: selectedCategories,
          weights: {
            urgency: 0.4,
            volume: 0.3,
            severity: 0.2,
            infra_gap: 0.1
          }
        })
      });
    },
    onSuccess: (data: SimulatorResponse) => {
      // Keep track of previous for animation purposes
      if (mutation.data?.data?.summary) {
         setPrevSummary(mutation.data.data.summary);
      }
    }
  });

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories(prev => 
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  const data = mutation.data?.data;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Calculator className="text-blue-600" />
          AI Budget Simulator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Simulate allocations to maximize citizen impact and minimize infrastructure gaps.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Controls */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
            
            {/* Location */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <MapPin size={16} /> District
              </label>
              <select 
                value={district} 
                onChange={e => setDistrict(e.target.value)}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-gray-900 dark:text-white"
              >
                <option value="Patna">Patna</option>
                <option value="Lucknow">Lucknow</option>
                <option value="Kanpur">Kanpur</option>
              </select>
            </div>

            {/* Budget Input & Slider */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Total Budget (₹)</label>
                <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{formatCurrency(budget)}</span>
              </div>
              <input 
                type="range" 
                min="1000000" 
                max="50000000" 
                step="500000"
                value={budget} 
                onChange={e => setBudget(Number(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>₹10L</span>
                <span>₹5Cr</span>
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Prioritize Categories</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryToggle(cat.id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                      selectedCategories.includes(cat.id) 
                        ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800'
                        : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition-transform transform active:scale-95 disabled:opacity-70"
            >
              {mutation.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play size={18} className="fill-current" />
              )}
              {mutation.isPending ? 'Simulating...' : 'Run Simulation'}
            </button>
          </div>
        </div>

        {/* Right Column: Results */}
        <div className="lg:col-span-8">
          {!data && !mutation.isPending && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 p-8 text-center">
              <BrainCircuit className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Ready to Simulate</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md">
                Adjust your budget constraints and priorities on the left, then run the simulation to see AI-optimized project allocations.
              </p>
            </div>
          )}

          {data && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              
              {/* Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <CheckCircle size={40} className="text-green-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Projects Funded</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {data.summary.projects_funded}
                  </p>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <DollarSign size={40} className="text-blue-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Allocated</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(data.summary.total_allocated)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity size={40} className="text-orange-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Remaining</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {formatCurrency(data.summary.remaining_budget)}
                  </p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Users size={40} className="text-purple-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">People Served</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                    {data.summary.total_people_served.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* AI Analysis Banner */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800 flex gap-4 items-start">
                <BrainCircuit className="text-blue-600 dark:text-blue-400 shrink-0 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-1">AI Allocation Strategy</h4>
                  <p className="text-blue-800/80 dark:text-blue-200/80 text-sm leading-relaxed">
                    {data.ai_analysis}
                  </p>
                </div>
              </div>

              {/* Selected Projects */}
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Selected Projects</h3>
                <div className="space-y-4">
                  {data.selected_projects.map((project, idx) => (
                    <div 
                      key={project.cluster_id} 
                      className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-5 items-start sm:items-center hover:shadow-md transition-shadow"
                      style={{ animationDelay: `${idx * 100}ms` }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-semibold px-2 py-0.5 rounded uppercase">
                            {project.category}
                          </span>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <MapPin size={12} /> {project.location.address}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{project.title || `Priority ${project.category} intervention`}</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          {project.ai_justification}
                        </p>
                      </div>

                      <div className="flex gap-6 items-center shrink-0 w-full sm:w-auto bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Est. Cost</p>
                          <p className="font-bold text-gray-900 dark:text-white">{formatCurrency(project.estimated_cost)}</p>
                        </div>
                        <div className="w-px h-10 bg-gray-200 dark:bg-gray-700"></div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Impact Score</p>
                          <p className="font-bold text-blue-600 dark:text-blue-400">{project.impact_score}/100</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
