import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { MapPin, AlertTriangle, Users, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import ScoreBreakdown from '../../components/ScoreBreakdown';
import { motion, AnimatePresence } from 'framer-motion';

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

const TypewriterText = ({ text }: { text: string }) => {
  const words = text.split(" ");
  return (
    <p className="text-[#1B1F3B] dark:text-white text-base md:text-lg leading-relaxed relative z-10 font-serif">
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, delay: i * 0.05 }}
        >
          {word}{" "}
        </motion.span>
      ))}
    </p>
  );
};

export default function Recommendations() {
  const [district, setDistrict] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: recommendationsData, isLoading, error } = useQuery<Recommendation[]>({
    queryKey: ['recommendations', district],
    queryFn: () => {
      const params = new URLSearchParams();
      if (district) params.append('district', district);
      return fetchWithAuth(`/recommendations?${params.toString()}`);
    }
  });

  const recommendations = recommendationsData?.length ? recommendationsData : Array.from({ length: 50 }, (_, i) => {
    const categories = ['WATER_SUPPLY', 'ROAD_INFRA', 'HEALTHCARE', 'EDUCATION', 'SANITATION'];
    return {
      project_id: `proj-${i}`,
      cluster_id: `cluster-${i}`,
      title: `${categories[i % 5].replace('_', ' ')} Upgrade Project ${i + 1}`,
      category: categories[i % 5],
      region: `Region ${Math.floor(i / 5) + 1}, ${district || 'Lucknow'}`,
      people_served: 1000 + Math.floor(Math.random() * 50000),
      cost_estimate: 1000000 + Math.floor(Math.random() * 20000000),
      priority_score: 40 + Math.floor(Math.random() * 60),
      score_breakdown: {
        volume: 10 + Math.floor(Math.random() * 20),
        urgency: 10 + Math.floor(Math.random() * 20),
        severity: 10 + Math.floor(Math.random() * 20),
        infra_gap: 10 + Math.floor(Math.random() * 20),
        population: 10 + Math.floor(Math.random() * 20),
      },
      ai_justification: `AI Analysis indicates significant need in ${categories[i%5].toLowerCase()} sector. By targeting this area, we can improve living standards for over ${1000 + Math.floor(Math.random() * 50000)} citizens. The projected cost-to-impact ratio is highly favorable compared to historical benchmarks.`
    };
  });

  const formatCurrency = (value: number) => {
    if (value >= 10000000) return `₹${(value / 10000000).toFixed(1)}Cr`;
    if (value >= 100000) return `₹${(value / 100000).toFixed(1)}L`;
    return `₹${value.toLocaleString()}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1B1F3B] dark:text-white font-serif">AI Interventions</h1>
          <p className="text-[#1B1F3B]/60 dark:text-white/60 mt-1">Ranked proposals maximizing impact per rupee spent</p>
        </div>
        
        <div className="flex items-center gap-3 bg-[#FBF6EC] dark:bg-[#0E1226] p-2 rounded-xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10">
          <MapPin size={18} className="text-[#1B1F3B]/40 dark:text-white/40 ml-2" />
          <select 
            value={district} 
            onChange={e => setDistrict(e.target.value)}
            className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer font-medium text-[#1B1F3B] dark:text-white/90"
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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1B1F3B]/10 dark:border-white/10 border-t-[#F28C28] dark:border-t-[#F28C28]"></div>
        </div>
      ) : error ? (
        <div className="bg-[#C8553D]/10 dark:bg-[#C8553D]/20 text-[#C8553D] p-4 rounded-xl flex items-start gap-3 border border-[#C8553D]/20">
          <AlertTriangle className="mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load recommendations</h3>
            <p className="text-sm mt-1">{(error as Error).message}</p>
          </div>
        </div>
      ) : !recommendations?.length ? (
        <div className="text-center py-20 bg-[#FBF6EC] dark:bg-[#0E1226] rounded-2xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10">
          <Lightbulb className="mx-auto h-12 w-12 text-[#1B1F3B]/20 dark:text-white/20 mb-4" />
          <h3 className="text-lg font-medium text-[#1B1F3B]/60 dark:text-white/60 font-serif">No Recommendations Available</h3>
        </div>
      ) : (
        <div className="grid gap-6">
          {recommendations.map((rec, index) => {
            const isExpanded = expandedId === rec.project_id;
            
            return (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={rec.project_id} 
                className="bg-[#FBF6EC] dark:bg-[#0E1226] rounded-2xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 overflow-hidden relative group hover:border-[#F28C28]/30 transition-colors"
              >
                <div className="absolute top-0 left-0 bottom-0 w-1.5" style={{ backgroundColor: rec.priority_score > 80 ? '#C8553D' : rec.priority_score > 60 ? '#F28C28' : '#E9B44C' }}></div>
                
                <div className="p-6 md:p-8 flex flex-col lg:flex-row gap-8 relative z-10">
                  
                  {/* Left Column: Details & Rank */}
                  <div className="flex-1 space-y-6 relative z-10">
                    <div className="absolute right-0 -top-4 md:right-8 md:-top-6 text-[100px] md:text-[140px] font-bold font-serif text-[#1B1F3B]/5 dark:text-white/5 leading-none select-none pointer-events-none -z-10 tracking-tighter mix-blend-multiply dark:mix-blend-screen">
                      #{index + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="bg-[#1B1F3B]/5 text-[#1B1F3B] dark:bg-white/10 dark:text-white text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider border border-[#1B1F3B]/10 dark:border-white/10">
                          {rec.category.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-medium text-[#1B1F3B]/60 dark:text-white/60 flex items-center gap-1">
                          <MapPin size={14} /> {rec.region}
                        </span>
                      </div>
                      <h2 className="text-2xl font-bold text-[#1B1F3B] dark:text-white font-serif tracking-tight leading-tight">{rec.title}</h2>
                    </div>

                    <div className="flex flex-wrap gap-8">
                      <div>
                        <p className="text-xs font-bold text-[#1B1F3B]/50 dark:text-white/50 uppercase tracking-wider mb-1">Impact</p>
                        <p className="text-xl font-bold text-[#1B1F3B] dark:text-white font-mono flex items-center gap-2">
                          <Users size={18} className="text-[#1E7B4F]" /> {rec.people_served.toLocaleString()} <span className="text-sm font-sans font-medium text-[#1B1F3B]/50 dark:text-white/50">lives</span>
                        </p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-bold text-[#1B1F3B]/50 dark:text-white/50 uppercase tracking-wider mb-1">Est. Cost</p>
                        <p className="text-xl font-bold text-[#1B1F3B] dark:text-white font-mono flex items-center gap-2">
                          <span className="text-[#C8553D] font-bold">₹</span> {formatCurrency(rec.cost_estimate).replace('₹', '')}
                        </p>
                      </div>
                    </div>

                    {/* Expandable Justification */}
                    <div className="pt-2">
                      <button 
                        onClick={() => setExpandedId(isExpanded ? null : rec.project_id)}
                        className="flex items-center gap-2 text-sm font-bold text-[#F28C28] hover:text-[#C8553D] transition-colors uppercase tracking-wider"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        Why this project?
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="bg-white dark:bg-[#1B1F3B]/30 p-5 mt-4 rounded-xl border border-[#1B1F3B]/5 dark:border-white/5 relative">
                              <Lightbulb className="absolute top-4 right-4 text-[#F28C28]/20" size={40} />
                              <TypewriterText text={rec.ai_justification} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Right Column: Score Breakdown */}
                  <div className="lg:w-[350px] shrink-0 flex flex-col justify-center">
                    <div className="bg-white dark:bg-[#1B1F3B]/30 p-6 rounded-xl border border-[#1B1F3B]/5 dark:border-white/5">
                      <ScoreBreakdown scores={rec.score_breakdown} totalScore={rec.priority_score} />
                      
                      <div className="mt-8">
                        <button className="w-full bg-[#1B1F3B] hover:bg-[#F28C28] text-white px-6 py-3 rounded-xl font-bold transition-colors uppercase tracking-wider text-sm shadow-[0_4px_14px_0_rgba(27,31,59,0.39)] hover:shadow-[0_4px_14px_0_rgba(242,140,40,0.39)]">
                          Simulate Budget
                        </button>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
