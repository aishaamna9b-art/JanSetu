import { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { MapPin, Calculator, Play, IndianRupee, Users, CheckCircle, BrainCircuit, Pin, SplitSquareHorizontal, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedCounter } from '../../components/StatCard';

interface SimulatorResponse {
  selected: Array<{
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
  }>;
  total_cost: number;
  remaining_budget: number;
  people_served: number;
  gaps_closed: number;
  ai_justification: string;
}

const CATEGORIES = [
  { id: 'water', label: 'Water Supply' },
  { id: 'roads', label: 'Road Networks' },
  { id: 'electricity', label: 'Power Grid' },
  { id: 'sanitation', label: 'Sanitation' },
  { id: 'healthcare', label: 'Healthcare' }
];

const RingChart = ({ percentage }: { percentage: number }) => (
  <div className="relative w-16 h-16 flex items-center justify-center">
    <svg className="w-full h-full transform -rotate-90">
      <circle cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-[#1B1F3B]/10 dark:text-white/10" />
      <motion.circle 
        cx="32" cy="32" r="28" fill="transparent" stroke="currentColor" strokeWidth="6" 
        strokeDasharray="176" 
        initial={{ strokeDashoffset: 176 }}
        animate={{ strokeDashoffset: 176 - (176 * percentage) / 100 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="text-[#F28C28]" strokeLinecap="round" 
      />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center text-[#F28C28] font-bold text-sm font-mono">
      {percentage}%
    </div>
  </div>
);

export default function BudgetSimulator() {
  const [budget, setBudget] = useState(5000000);
  const [district, setDistrict] = useState('Lucknow');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['water', 'roads']);
  
  const [pinnedResult, setPinnedResult] = useState<{ budget: number; data: SimulatorResponse } | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);

  const mutation = useMutation({
    mutationFn: async (): Promise<SimulatorResponse> => {
      return fetchWithAuth('/simulator/run', {
        method: 'POST',
        body: JSON.stringify({
          budget: budget,
          state: 'Uttar Pradesh',
          district,
          categories: selectedCategories
        })
      });
    }
  });

  // Debounced auto-run
  useEffect(() => {
    const timer = setTimeout(() => {
      mutation.mutate();
    }, 600);
    return () => clearTimeout(timer);
  }, [budget, district, selectedCategories]);

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter(c => c !== id);
      }
      return [...prev, id];
    });
  };

  const formatCurrency = (value?: number) => {
    if (value === undefined || value === null) return '₹0';
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  const data = mutation.data;
  
  const percentUsed = data ? (data.total_cost / budget) * 100 : 0;
  const isFullyUsed = percentUsed >= 98;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-[#1B1F3B] dark:text-white font-serif flex items-center gap-3">
            <Calculator className="text-[#F28C28]" />
            Budget Simulator
          </h1>
          <p className="text-[#1B1F3B]/60 dark:text-white/60 mt-1 font-medium">
            Dynamically reallocate resources. Let AI optimize the impact per rupee.
          </p>
        </div>
        
        {pinnedResult && (
          <button 
            onClick={() => setIsCompareMode(!isCompareMode)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${isCompareMode ? 'bg-[#1B1F3B] text-white dark:bg-white dark:text-[#1B1F3B]' : 'bg-[#FBF6EC] dark:bg-[#0E1226] text-[#1B1F3B] dark:text-white border border-[#1B1F3B]/10 dark:border-white/10 hover:border-[#1B1F3B]/30'}`}
          >
            <SplitSquareHorizontal size={16} />
            {isCompareMode ? 'Exit Compare' : 'Compare Saved'}
          </button>
        )}
      </div>

      <div className={`grid grid-cols-1 ${isCompareMode ? 'lg:grid-cols-1' : 'lg:grid-cols-12'} gap-8`}>
        
        {/* Left Column: Controls (Hide in Compare Mode or make it top bar) */}
        {!isCompareMode && (
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#FBF6EC] dark:bg-[#0E1226] p-6 rounded-2xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 space-y-8 relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1B1F3B 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
              
              {/* Location */}
              <div className="space-y-2 relative z-10">
                <label className="text-xs font-bold text-[#1B1F3B]/60 dark:text-white/60 uppercase tracking-wider flex items-center gap-2">
                  <MapPin size={14} /> Focus Region
                </label>
                <select 
                  value={district} 
                  onChange={e => setDistrict(e.target.value)}
                  className="w-full bg-white dark:bg-[#1B1F3B]/30 border border-[#1B1F3B]/10 dark:border-white/10 rounded-xl p-3 text-[#1B1F3B] dark:text-white font-medium focus:ring-2 focus:ring-[#F28C28] focus:border-transparent outline-none transition-shadow"
                >
                  <option value="Lucknow">Lucknow District</option>
                  <option value="Kanpur">Kanpur District</option>
                  <option value="Varanasi">Varanasi District</option>
                </select>
              </div>

              {/* Budget Input & Slider */}
              <div className="space-y-4 relative z-10">
                <div className="flex justify-between items-end">
                  <label className="text-xs font-bold text-[#1B1F3B]/60 dark:text-white/60 uppercase tracking-wider">Total Corpus</label>
                  <span className="text-2xl font-bold text-[#1E7B4F] dark:text-[#1E7B4F] font-mono tabular-nums">{formatCurrency(budget)}</span>
                </div>
                <div className="relative pt-2 pb-2">
                  <input 
                    type="range" 
                    min="1000000" 
                    max="50000000" 
                    step="500000"
                    value={budget} 
                    onChange={e => setBudget(Number(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer relative z-10 bg-transparent"
                    style={{
                      background: `linear-gradient(to right, #F28C28 0%, #F28C28 ${(budget - 1000000) / (50000000 - 1000000) * 100}%, rgba(27,31,59,0.1) ${(budget - 1000000) / (50000000 - 1000000) * 100}%, rgba(27,31,59,0.1) 100%)`
                    }}
                  />
                  <style>{`
                    input[type=range]::-webkit-slider-thumb {
                      -webkit-appearance: none;
                      appearance: none;
                      width: 24px;
                      height: 24px;
                      border-radius: 50%;
                      background: #1B1F3B;
                      cursor: pointer;
                      border: 2px solid #FBF6EC;
                      box-shadow: 0 4px 10px rgba(0,0,0,0.3);
                      transition: transform 0.1s;
                    }
                    input[type=range]::-webkit-slider-thumb:hover {
                      transform: scale(1.1);
                    }
                    .dark input[type=range]::-webkit-slider-thumb {
                      background: #FBF6EC;
                      border-color: #0E1226;
                    }
                  `}</style>
                </div>
                <div className="flex justify-between text-xs font-bold text-[#1B1F3B]/40 dark:text-white/40 font-mono">
                  <span>₹10L</span>
                  <span>₹5Cr</span>
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3 relative z-10">
                <label className="text-xs font-bold text-[#1B1F3B]/60 dark:text-white/60 uppercase tracking-wider">Strategic Priorities</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleCategoryToggle(cat.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-200 border ${
                          isSelected 
                            ? 'bg-[#1B1F3B] text-white border-[#1B1F3B] shadow-md dark:bg-white dark:text-[#1B1F3B] dark:border-white scale-105'
                            : 'bg-white text-[#1B1F3B]/60 border-[#1B1F3B]/10 hover:bg-[#F28C28]/10 dark:bg-[#1B1F3B]/30 dark:text-white/60 dark:border-white/10 dark:hover:bg-[#F28C28]/20 hover:border-[#F28C28]/30'
                        }`}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Right Column: Results */}
        <div className={isCompareMode ? 'col-span-1 grid grid-cols-2 gap-6' : 'lg:col-span-8'}>
          
          {/* Main Current View */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {!data && !mutation.isPending && (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center bg-white dark:bg-[#0E1226]/50 rounded-2xl border-2 border-dashed border-[#1B1F3B]/10 dark:border-white/10 p-8 text-center"
                >
                  <BrainCircuit className="w-20 h-20 text-[#1B1F3B]/10 dark:text-white/10 mb-6" />
                  <h3 className="text-xl font-bold text-[#1B1F3B] dark:text-white mb-2 font-serif">Awaiting Parameters</h3>
                  <p className="text-[#1B1F3B]/50 dark:text-white/50 max-w-md font-medium">
                    Adjust the corpus size and thematic priorities to generate an optimal portfolio of interventions.
                  </p>
                </motion.div>
              )}

              {/* Show spinner conditionally when loading, but only if we don't have data yet to avoid full unmounts */}
              {mutation.isPending && !data && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="h-full min-h-[500px] flex flex-col items-center justify-center space-y-6"
                >
                  <div className="relative w-24 h-24">
                    <div className="absolute inset-0 rounded-full border-4 border-[#1B1F3B]/10 dark:border-white/10"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-t-[#F28C28] animate-spin"></div>
                    <BrainCircuit className="absolute inset-0 m-auto text-[#F28C28] animate-pulse" size={32} />
                  </div>
                  <div className="text-[#1B1F3B] dark:text-white font-mono text-sm tracking-widest uppercase animate-pulse">Running Neural Optima</div>
                </motion.div>
              )}

              {data && (
                <motion.div 
                  key="results"
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className={`space-y-6 ${mutation.isPending ? 'opacity-50 blur-sm pointer-events-none transition-all duration-300' : 'transition-all duration-300'}`}
                >
                  {/* Top Bar: Draining Budget & Pin */}
                  <div className="flex items-center justify-between bg-white dark:bg-[#1B1F3B]/30 p-4 rounded-2xl border border-[#1B1F3B]/10 dark:border-white/10">
                    <div className="flex-1 mr-6">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-xs font-bold text-[#1B1F3B]/60 dark:text-white/60 uppercase tracking-wider flex items-center gap-1">
                          Remaining Budget {isFullyUsed && <Sparkles size={14} className="text-[#1E7B4F]" />}
                        </span>
                        <span className={`font-mono font-bold ${isFullyUsed ? 'text-[#1E7B4F]' : 'text-[#E9B44C]'}`}>
                          {formatCurrency(data.remaining_budget)}
                        </span>
                      </div>
                      <div className="h-2 w-full bg-[#1B1F3B]/10 dark:bg-white/10 rounded-full overflow-hidden relative">
                        <motion.div 
                          className={`absolute top-0 left-0 bottom-0 ${isFullyUsed ? 'bg-[#1E7B4F]' : 'bg-[#F28C28]'}`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentUsed}%` }}
                          transition={{ type: 'spring', bounce: 0, duration: 1 }}
                        />
                      </div>
                    </div>
                    {!isCompareMode && (
                      <button 
                        onClick={() => setPinnedResult({ budget, data })}
                        className="flex items-center gap-2 text-sm font-bold text-[#1B1F3B] dark:text-white bg-[#1B1F3B]/5 dark:bg-white/10 hover:bg-[#1B1F3B]/10 dark:hover:bg-white/20 px-3 py-2 rounded-lg transition-colors shrink-0"
                      >
                        <Pin size={16} /> Pin Result
                      </button>
                    )}
                  </div>

                  {/* Summary Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <motion.div variants={itemVariants} className="bg-[#FBF6EC] dark:bg-[#0E1226] p-5 rounded-2xl border border-[#1B1F3B]/10 dark:border-white/10 shadow-sm relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                        <CheckCircle size={100} />
                      </div>
                      <p className="text-[10px] font-bold text-[#1B1F3B]/50 dark:text-white/50 uppercase tracking-widest mb-1">Funded</p>
                      <p className="text-3xl font-bold text-[#1B1F3B] dark:text-white font-mono">
                        <AnimatedCounter value={data.selected?.length || 0} />
                      </p>
                      <p className="text-xs text-[#1B1F3B]/40 dark:text-white/40 font-medium mt-1">Interventions</p>
                    </motion.div>
                    
                    <motion.div variants={itemVariants} className="bg-[#FBF6EC] dark:bg-[#0E1226] p-5 rounded-2xl border border-[#1B1F3B]/10 dark:border-white/10 shadow-sm relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 text-[#1E7B4F]">
                        <IndianRupee size={100} />
                      </div>
                      <p className="text-[10px] font-bold text-[#1B1F3B]/50 dark:text-white/50 uppercase tracking-widest mb-1">Allocated</p>
                      <p className="text-3xl font-bold text-[#1E7B4F] dark:text-[#1E7B4F] font-mono">
                        <AnimatedCounter value={data.total_cost || 0} />
                      </p>
                      <p className="text-xs text-[#1B1F3B]/40 dark:text-white/40 font-medium mt-1">Total INR</p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-[#1B1F3B] dark:bg-white p-5 rounded-2xl shadow-lg relative overflow-hidden group">
                      <div className="absolute -right-4 -bottom-4 opacity-[0.03] dark:opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500 text-white dark:text-[#1B1F3B]">
                        <Users size={100} />
                      </div>
                      <p className="text-[10px] font-bold text-white/50 dark:text-[#1B1F3B]/50 uppercase tracking-widest mb-1">Impact</p>
                      <p className="text-3xl font-bold text-white dark:text-[#1B1F3B] font-mono">
                        <AnimatedCounter value={data.people_served || 0} />
                      </p>
                      <p className="text-xs text-white/40 dark:text-[#1B1F3B]/40 font-medium mt-1">Citizens Served</p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="bg-[#FBF6EC] dark:bg-[#0E1226] p-3 rounded-2xl border border-[#1B1F3B]/10 dark:border-white/10 shadow-sm flex items-center justify-between gap-2">
                      <div className="flex-1 pl-2">
                        <p className="text-[10px] font-bold text-[#1B1F3B]/50 dark:text-white/50 uppercase tracking-widest mb-1">Gaps Closed</p>
                        <p className="text-[11px] text-[#1B1F3B]/60 dark:text-white/60 font-medium leading-tight">Overall needs addressed</p>
                      </div>
                      <RingChart percentage={Math.min(100, Math.floor(data.gaps_closed || 42))} />
                    </motion.div>
                  </div>

                  {/* Selected Projects */}
                  <motion.div variants={itemVariants}>
                    <h3 className="text-xl font-bold text-[#1B1F3B] dark:text-white mb-6 font-serif flex items-center gap-2">
                      <div className="w-2 h-6 bg-[#F28C28] rounded-full"></div>
                      Intervention Portfolio {isCompareMode && "(Current)"}
                    </h3>
                    <div className="space-y-4">
                      <AnimatePresence>
                        {(data.selected || []).map((project: any) => (
                          <motion.div 
                            key={project.cluster_id} 
                            layout
                            initial={{ opacity: 0, x: -20, scale: 0.95 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                            className="bg-white dark:bg-[#1B1F3B]/30 p-5 rounded-2xl border border-[#1B1F3B]/5 dark:border-white/5 shadow-sm relative overflow-hidden"
                          >
                            <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#1E7B4F]"></div>
                            <div className="flex justify-between items-start mb-2 pl-2">
                              <span className="bg-[#1B1F3B]/5 text-[#1B1F3B] dark:bg-white/10 dark:text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                                {project.category.replace('_', ' ')}
                              </span>
                              <span className="font-bold text-[#1B1F3B] dark:text-white font-mono text-sm">{formatCurrency(project.cost_estimate)}</span>
                            </div>
                            <h4 className="font-bold text-[#1B1F3B] dark:text-white text-md font-serif pl-2 leading-tight">{project.title}</h4>
                            {!isCompareMode && (
                              <p className="text-xs text-[#1B1F3B]/60 dark:text-white/60 mt-2 pl-2 line-clamp-2">
                                {project.ai_justification}
                              </p>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>

                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Compare View - Pinned Result */}
          {isCompareMode && pinnedResult && (
            <div className="space-y-6 opacity-80 filter saturate-50 hover:saturate-100 hover:opacity-100 transition-all border-l-2 border-dashed border-[#1B1F3B]/10 dark:border-white/10 pl-6 h-full">
              
              <div className="flex items-center justify-between bg-white dark:bg-[#1B1F3B]/30 p-4 rounded-2xl border border-[#1B1F3B]/10 dark:border-white/10">
                <div className="flex-1 mr-6">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-[#1B1F3B]/60 dark:text-white/60 uppercase tracking-wider flex items-center gap-1">
                      Target Budget (Pinned)
                    </span>
                    <span className="font-mono font-bold text-[#1B1F3B]/50 dark:text-white/50">
                      {formatCurrency(pinnedResult.budget)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary Metrics Pinned */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#FBF6EC] dark:bg-[#0E1226] p-4 rounded-2xl border border-[#1B1F3B]/10 dark:border-white/10 shadow-sm">
                  <p className="text-[10px] font-bold text-[#1B1F3B]/50 dark:text-white/50 uppercase tracking-widest mb-1">Funded</p>
                  <p className="text-2xl font-bold text-[#1B1F3B]/80 dark:text-white/80 font-mono">{pinnedResult.data.selected?.length || 0}</p>
                </div>
                <div className="bg-[#FBF6EC] dark:bg-[#0E1226] p-4 rounded-2xl border border-[#1B1F3B]/10 dark:border-white/10 shadow-sm">
                  <p className="text-[10px] font-bold text-[#1B1F3B]/50 dark:text-white/50 uppercase tracking-widest mb-1">Allocated</p>
                  <p className="text-2xl font-bold text-[#1B1F3B]/80 dark:text-white/80 font-mono">{formatCurrency(pinnedResult.data.total_cost || 0)}</p>
                </div>
                <div className="bg-[#FBF6EC] dark:bg-[#0E1226] p-4 rounded-2xl border border-[#1B1F3B]/10 dark:border-white/10 shadow-sm">
                  <p className="text-[10px] font-bold text-[#1B1F3B]/50 dark:text-white/50 uppercase tracking-widest mb-1">Impact</p>
                  <p className="text-2xl font-bold text-[#1B1F3B]/80 dark:text-white/80 font-mono">{pinnedResult.data.people_served || 0}</p>
                </div>
                <div className="bg-[#FBF6EC] dark:bg-[#0E1226] p-3 rounded-2xl border border-[#1B1F3B]/10 dark:border-white/10 shadow-sm flex items-center justify-between">
                  <div className="flex-1 pl-1">
                    <p className="text-[10px] font-bold text-[#1B1F3B]/50 dark:text-white/50 uppercase tracking-widest mb-1">Gaps</p>
                  </div>
                  <RingChart percentage={Math.min(100, Math.floor(pinnedResult.data.gaps_closed || 42))} />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-[#1B1F3B]/60 dark:text-white/60 mb-6 font-serif flex items-center gap-2">
                  <div className="w-2 h-6 bg-[#1B1F3B]/20 dark:bg-white/20 rounded-full"></div>
                  Intervention Portfolio (Pinned)
                </h3>
                <div className="space-y-4">
                  {(pinnedResult.data.selected || []).map((project: any) => (
                    <div key={project.cluster_id} className="bg-white/50 dark:bg-[#1B1F3B]/20 p-5 rounded-2xl border border-[#1B1F3B]/5 dark:border-white/5 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-[#1B1F3B]/20 dark:bg-white/20"></div>
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <span className="bg-[#1B1F3B]/5 text-[#1B1F3B]/60 dark:bg-white/5 dark:text-white/60 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">
                          {project.category.replace('_', ' ')}
                        </span>
                        <span className="font-bold text-[#1B1F3B]/60 dark:text-white/60 font-mono text-sm">{formatCurrency(project.cost_estimate)}</span>
                      </div>
                      <h4 className="font-bold text-[#1B1F3B]/70 dark:text-white/70 text-md font-serif pl-2 leading-tight">{project.title}</h4>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </motion.div>
  );
}
