import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, ReferenceLine,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Cell
} from 'recharts';
import { MapPin, AlertTriangle, ArrowUpDown, TrendingUp, IndianRupee } from 'lucide-react';
import { motion } from 'framer-motion';
import { INDIA_STATES_DISTRICTS } from '../../lib/indiaData';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { useRegion } from '../../components/RegionContext';

interface GapData {
  block: string;
  district: string;
  category: string;
  demand_count: number;
  infra_index: number;
  public_spending: number;
  gap_score: number;
}

export default function GapAnalysis() {
  const { state: regionState, setState: setRegionState, district, setDistrict } = useRegion();
  const [sortField, setSortField] = useState<keyof GapData>('gap_score');
  const [sortDesc, setSortDesc] = useState(true);
  const [hoveredBlock, setHoveredBlock] = useState<string | null>(null);

  const { data: gapsData, isLoading, error } = useQuery<GapData[]>({
    queryKey: ['gaps', regionState, district],
    queryFn: () => {
      const params = new URLSearchParams();
      if (regionState) params.append('state', regionState);
      if (district) params.append('district', district);
      return fetchWithAuth(`/analytics/gaps?${params.toString()}`);
    }
  });

  const mockGaps = useMemo(() => {
    const categories = ['Water', 'Roads', 'Health', 'Education', 'Sanitation'];
    const blocks = ['Phulwari', 'Danapur', 'Patna Sadar', 'Sampatchak', 'Maner', 'Bihta', 'Naubatpur', 'Bikram', 'Paliganj', 'Masaurhi'];
    return Array.from({ length: 50 }, (_, i) => ({
      block: blocks[i % blocks.length] + (i >= 10 ? ` Ward ${Math.floor(i/10)+1}` : ''),
      district: district || 'Patna',
      category: categories[i % 5],
      demand_count: 100 + Math.floor(Math.random() * 900),
      infra_index: 0.2 + Math.random() * 0.7,
      public_spending: 500000 + Math.floor(Math.random() * 9500000),
      gap_score: 0.3 + Math.random() * 0.7,
    }));
  }, [district]);

  const gaps = gapsData?.length ? gapsData : mockGaps;

  const sortedGaps = useMemo(() => {
    if (!gaps) return [];
    return [...gaps].sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDesc ? 1 : -1;
      if (a[sortField] > b[sortField]) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [gaps, sortField, sortDesc]);

  // Aggregate data for Radar Chart (average across categories for the district)
  const radarData = useMemo(() => {
    if (!gaps) return [];
    const categories = ['Water', 'Roads', 'Health', 'Education', 'Sanitation'];
    return categories.map(cat => {
      const catData = gaps.filter(g => g.category.toLowerCase() === cat.toLowerCase());
      if (!catData.length) return { subject: cat, demand: 0, infra: 0, spending: 0 };
      
      const avgDemand = catData.reduce((acc, curr) => acc + curr.demand_count, 0) / catData.length;
      const avgInfra = catData.reduce((acc, curr) => acc + curr.infra_index, 0) / catData.length * 100;
      // Normalize spending for visualization (0-100 scale ideally, but we'll mock a normalized value based on rank)
      const avgSpending = catData.reduce((acc, curr) => acc + curr.public_spending, 0) / catData.length;
      const normalizedSpending = Math.min(100, (avgSpending / 5000000) * 100); 

      return {
        subject: cat,
        demand: Math.min(100, avgDemand * 2),
        infra: avgInfra,
        spending: normalizedSpending
      };
    });
  }, [gaps]);

  // Data for Dual Axis Bar Chart (Demand vs Spending)
  const chartData = useMemo(() => {
    return sortedGaps.slice(0, 10).map(g => ({
      name: g.block,
      Demand: g.demand_count,
      Spending: g.public_spending,
      gap_score: g.gap_score
    }));
  }, [sortedGaps]);

  const handleSort = (field: keyof GapData) => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

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
          <h1 className="text-3xl font-bold text-[#1B1F3B] dark:text-white font-serif">Need Gap Analysis</h1>
          <p className="text-[#1B1F3B]/60 dark:text-white/60 mt-1">Cross-referencing citizen demand with existing infrastructure and spend</p>
        </div>
        
        <div className="flex items-center gap-2 bg-[#FBF6EC] dark:bg-[#0E1226] p-2 rounded-xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10">
          <MapPin size={18} className="text-[#1B1F3B]/40 dark:text-white/40 ml-2" />
          <SearchableDropdown 
            options={Object.keys(INDIA_STATES_DISTRICTS)}
            value={regionState}
            onChange={(val: string) => { setRegionState(val); setDistrict(''); }}
            placeholder="All States"
          />
          <div className="w-px h-6 bg-[#1B1F3B]/10 dark:bg-white/10 mx-1"></div>
          <SearchableDropdown 
            options={regionState ? INDIA_STATES_DISTRICTS[regionState] : []}
            value={district}
            onChange={(val: string) => setDistrict(val)}
            placeholder="All Districts"
            disabled={!regionState}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#1B1F3B]/10 dark:border-white/10 border-t-[#F28C28] dark:border-t-[#F28C28]"></div>
        </div>
      ) : error ? (
        <div className="bg-[#C8553D]/10 text-[#C8553D] p-4 rounded-xl border border-[#C8553D]/20 flex items-start gap-3">
          <AlertTriangle className="mt-0.5 shrink-0" />
          <p>{(error as Error).message}</p>
        </div>
      ) : !sortedGaps.length ? (
        <div className="text-center py-20 text-[#1B1F3B]/40 dark:text-white/40 font-serif">No gap analysis data found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Radar Chart */}
          <div className="bg-[#FBF6EC] dark:bg-[#0E1226] p-6 rounded-2xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#1B1F3B 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
            <h2 className="text-lg font-bold mb-2 text-[#1B1F3B] dark:text-white font-serif relative z-10">Need Gap Radar</h2>
            <p className="text-xs text-[#1B1F3B]/50 dark:text-white/50 mb-4 relative z-10">Demand vs Infra vs Spend across categories</p>
            <div className="h-[350px] w-full relative z-10 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#F28C28" className="opacity-30" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#F28C28', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Citizen Demand" dataKey="demand" stroke="#C8553D" fill="#C8553D" fillOpacity={0.3} />
                  <Radar name="Existing Infra" dataKey="infra" stroke="#1E7B4F" fill="#1E7B4F" fillOpacity={0.3} />
                  <Radar name="Public Spend" dataKey="spending" stroke="#E9B44C" fill="#E9B44C" fillOpacity={0.3} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-ink)' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Demand vs Spend Dual Axis Chart */}
          <div className="lg:col-span-2 bg-[#FBF6EC] dark:bg-[#0E1226] p-6 rounded-2xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 relative overflow-hidden">
            <h2 className="text-lg font-bold mb-2 text-[#1B1F3B] dark:text-white font-serif relative z-10">Demand vs. Spend (Top 10 Critical Blocks)</h2>
            <p className="text-xs text-[#1B1F3B]/50 dark:text-white/50 mb-6 relative z-10">Comparing citizen demand volume against allocated public spending to identify the most severe funding gaps.</p>
            <div className="h-[450px] w-full relative z-10 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 10, left: -20, bottom: 90 }} barGap={2} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-[#1B1F3B]/10 dark:text-white/10" />
                  <XAxis 
                    dataKey="name" 
                    stroke="#F28C28" 
                    tick={{fill: '#F28C28', fontSize: 12, fontWeight: 500}} 
                    angle={-45}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis 
                    yAxisId="left" 
                    orientation="left" 
                    stroke="#C8553D" 
                    tick={{fill: '#C8553D', fontSize: 11}}
                    width={60}
                  />
                  <YAxis 
                    yAxisId="right" 
                    orientation="right" 
                    stroke="#E9B44C" 
                    tick={{fill: '#E9B44C', fontSize: 11}}
                    tickFormatter={(value) => {
                      if (value >= 10000000) return `₹${(value / 10000000).toFixed(0)}Cr`;
                      if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`;
                      return `₹${value}`;
                    }}
                    width={60}
                  />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(27, 31, 59, 0.05)'}} 
                    contentStyle={{ borderRadius: '12px', border: '1px solid rgba(27, 31, 59, 0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                    formatter={(value: any, name: any) => {
                      if (name === 'Public Spend') {
                        const num = Number(value);
                        if (num >= 10000000) return [`₹${(num / 10000000).toFixed(2)}Cr`, 'Public Spend'];
                        if (num >= 100000) return [`₹${(num / 100000).toFixed(2)}L`, 'Public Spend'];
                        return [`₹${num}`, 'Public Spend'];
                      }
                      return [value, 'Citizen Demand'];
                    }}
                  />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ paddingBottom: '20px' }} iconType="circle" />
                  <Bar yAxisId="left" dataKey="Demand" name="Citizen Demand" radius={[4, 4, 0, 0]} barSize={12}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-demand-${index}`} fill={hoveredBlock === entry.name ? '#991b1b' : '#C8553D'} className="transition-all duration-300" />
                    ))}
                  </Bar>
                  <Bar yAxisId="right" dataKey="Spending" name="Public Spend" radius={[4, 4, 0, 0]} barSize={12}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-spend-${index}`} fill={hoveredBlock === entry.name ? '#b45309' : '#E9B44C'} className="transition-all duration-300" />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Table */}
          <div className="lg:col-span-3 bg-white dark:bg-[#0E1226]/50 rounded-2xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FBF6EC] dark:bg-[#1B1F3B]/40 border-b border-[#1B1F3B]/10 dark:border-white/10 text-[#1B1F3B]/60 dark:text-white/60 text-xs font-bold uppercase tracking-wider">
                    <th className="p-4 cursor-pointer hover:bg-[#1B1F3B]/5 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort('block')}>
                      <div className="flex items-center gap-2">Block <ArrowUpDown size={14}/></div>
                    </th>
                    <th className="p-4">Category</th>
                    <th className="p-4 cursor-pointer hover:bg-[#1B1F3B]/5 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort('demand_count')}>
                      <div className="flex items-center gap-2">Demand <ArrowUpDown size={14}/></div>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-[#1B1F3B]/5 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort('infra_index')}>
                      <div className="flex items-center gap-2">Infra Index <ArrowUpDown size={14}/></div>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-[#1B1F3B]/5 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort('public_spending')}>
                      <div className="flex items-center gap-2">Spending <ArrowUpDown size={14}/></div>
                    </th>
                    <th className="p-4 cursor-pointer hover:bg-[#1B1F3B]/5 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort('gap_score')}>
                      <div className="flex items-center gap-2">Gap Score <ArrowUpDown size={14}/></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1B1F3B]/5 dark:divide-white/5 text-[#1B1F3B] dark:text-white/90 text-sm">
                  {sortedGaps.map((gap, i) => {
                    const isCritical = gap.gap_score >= 0.8;
                    const isHovered = hoveredBlock === gap.block;
                    return (
                      <tr 
                        key={i} 
                        onMouseEnter={() => setHoveredBlock(gap.block)}
                        onMouseLeave={() => setHoveredBlock(null)}
                        className={`transition-colors duration-200 cursor-default
                          ${isHovered ? 'bg-[#F28C28]/10 dark:bg-[#F28C28]/20' : ''}
                          ${isCritical && !isHovered ? 'bg-[#C8553D]/5 dark:bg-[#C8553D]/10' : ''}
                          ${!isHovered && !isCritical ? 'hover:bg-[#1B1F3B]/5 dark:hover:bg-white/5' : ''}
                        `}
                      >
                        <td className="p-4 font-medium flex items-center gap-2">
                          {gap.block}
                          {isCritical && <span title="High demand, low spending"><AlertTriangle size={16} className="text-[#C8553D]" /></span>}
                        </td>
                        <td className="p-4 capitalize">{gap.category}</td>
                        <td className="p-4">
                          <span className="flex items-center gap-1.5 font-mono"><TrendingUp size={14} className="text-[#C8553D]"/>{gap.demand_count}</span>
                        </td>
                        <td className="p-4 font-mono">{(gap.infra_index * 100).toFixed(0)}/100</td>
                        <td className="p-4">
                          <span className="flex items-center gap-1.5 font-mono"><IndianRupee size={14} className="text-[#1E7B4F]"/>{formatCurrency(gap.public_spending)}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-20 h-2 bg-[#1B1F3B]/10 dark:bg-white/10 rounded-full overflow-hidden">
                              <motion.div 
                                initial={{ width: 0 }} animate={{ width: `${gap.gap_score * 100}%` }} transition={{ duration: 1 }}
                                className={`h-full rounded-full ${gap.gap_score >= 0.8 ? 'bg-[#C8553D]' : gap.gap_score >= 0.6 ? 'bg-[#F28C28]' : 'bg-[#1E7B4F]'}`}
                              />
                            </div>
                            <span className="font-mono font-bold text-xs">{(gap.gap_score * 100).toFixed(0)}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
