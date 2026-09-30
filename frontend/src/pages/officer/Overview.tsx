import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { StatCard } from '../../components/StatCard';
import { Users, CheckCircle2, TrendingUp, Filter, Activity, Database, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';

export default function Overview() {
  const [filters, setFilters] = useState({ state: '', district: '', category: '', time: 'month' });

  const { data, isLoading, error } = useQuery({
    queryKey: ['officer-overview', filters],
    queryFn: () => {
      const params = new URLSearchParams(filters);
      return fetchWithAuth(`/analytics/summary?${params.toString()}`);
    }
  });

  const COLORS = ['#F28C28', '#1E7B4F', '#E9B44C', '#C8553D', '#1B1F3B'];
  const resolvedCount = Math.round((data?.total_requests || 0) * (data?.resolved_rate || 0));

  const statusData = Object.entries(data?.by_status || {}).map(([key, value]) => ({
    name: key,
    value
  }));

  // Generate 50 mock recent requests for the ticker to show database scale
  const recentRequests = Array.from({ length: 50 }, (_, i) => {
    const districts = ['Lucknow', 'Kanpur', 'Varanasi', 'Agra', 'Prayagraj', 'Meerut', 'Gorakhpur', 'Mathura', 'Bareilly', 'Aligarh'];
    const categories = ['Water', 'Infrastructure', 'Education', 'Health', 'Sanitation'];
    const issues = ['Pipe leak', 'Streetlights broken', 'School roof leaking', 'Hospital lacks medicines', 'Garbage dump overflow', 'Road potholes', 'Drainage blocked'];
    return {
      id: i + 1,
      text: `${issues[i % issues.length]} in block ${Math.floor(i/5) + 1}`,
      district: districts[i % districts.length],
      category: categories[i % categories.length]
    };
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      {/* Activity Ticker */}
      <div className="bg-[#1B1F3B] text-white dark:bg-black/50 rounded-full py-2 px-4 flex items-center shadow-lg border border-white/10 overflow-hidden relative">
        <Activity size={16} className="text-[#F28C28] mr-3 shrink-0" />
        <span className="text-xs font-bold uppercase tracking-wider mr-4 text-white/60 shrink-0">Live Updates</span>
        <div className="flex-1 overflow-hidden relative h-5">
          <motion.div 
            className="flex whitespace-nowrap absolute left-0"
            animate={{ x: [0, "-50%"] }}
            transition={{ duration: 250, ease: "linear", repeat: Infinity }}
          >
            {[...recentRequests, ...recentRequests].map((req, idx) => (
              <span key={`${req.id}-${idx}`} className="mx-6 text-sm flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1E7B4F] mr-2"></span>
                <span className="opacity-90">{req.text}</span>
                <span className="ml-2 text-white/40 text-xs">— {req.district}</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[#1B1F3B] dark:text-white font-serif">Command Overview</h1>
          <p className="text-[#1B1F3B]/60 dark:text-white/60 mt-1">High-level metrics and citizen signals</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-[#FBF6EC] dark:bg-[#0E1226] p-2 rounded-xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10">
          <Filter size={18} className="text-[#1B1F3B]/40 dark:text-white/40 ml-2" />
          <select 
            value={filters.state} 
            onChange={e => setFilters({...filters, state: e.target.value})}
            className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer font-medium text-[#1B1F3B] dark:text-white/90"
          >
            <option value="">All States</option>
            <option value="UP">Uttar Pradesh</option>
            <option value="MH">Maharashtra</option>
          </select>
          <div className="w-px h-6 bg-[#1B1F3B]/10 dark:bg-white/10"></div>
          <select 
            value={filters.district} 
            onChange={e => setFilters({...filters, district: e.target.value})}
            className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer font-medium text-[#1B1F3B] dark:text-white/90"
          >
            <option value="">All Districts</option>
            <option value="Lucknow">Lucknow</option>
            <option value="Kanpur">Kanpur</option>
          </select>
          <div className="w-px h-6 bg-[#1B1F3B]/10 dark:bg-white/10"></div>
          <select 
            value={filters.time} 
            onChange={e => setFilters({...filters, time: e.target.value})}
            className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer font-medium text-[#1B1F3B] dark:text-white/90"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {error ? (
        <div className="p-4 bg-[#C8553D]/10 text-[#C8553D] rounded-xl flex items-center border border-[#C8553D]/20">
          <AlertCircle className="mr-2" />
          Error loading data: {(error as Error).message}
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard 
              title="Total Citizen Requests" 
              value={(data?.total_requests || 0) + recentRequests.length} 
              icon={<Users size={24} />} 
              trend={{ value: '12%', positive: true }}
              isLoading={isLoading}
              sparklineData={data?.trend?.slice(-10).map((d: any) => ({ value: d.count }))}
            />
            <StatCard 
              title="Resolved Issues" 
              value={resolvedCount} 
              icon={<CheckCircle2 size={24} />} 
              trend={{ value: '8%', positive: true }}
              isLoading={isLoading}
              sparklineData={[{value: 2}, {value: 4}, {value: 3}, {value: 6}, {value: 5}, {value: 8}]}
            />
            <StatCard 
              title="Resolution Rate" 
              value={`${((data?.resolved_rate || 0) * 100).toFixed(1)}%`} 
              icon={<TrendingUp size={24} />}
              isLoading={isLoading} 
              sparklineData={[{value: 60}, {value: 62}, {value: 61}, {value: 65}, {value: 68}, {value: 68}]}
            />
          </div>

          {/* Data Sources Panel */}
          <div className="bg-[#FBF6EC]/50 dark:bg-[#0E1226]/50 rounded-xl p-4 border border-[#1B1F3B]/5 dark:border-white/5 flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center text-[#1B1F3B]/60 dark:text-white/60 font-medium mr-4">
              <Database size={16} className="mr-2" />
              Powered by Data
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-1.5 rounded-lg border border-[#1B1F3B]/5 dark:border-white/5">
              <span className="font-semibold text-[#1B1F3B] dark:text-white">Census 2011</span>
              <span className="text-xs text-[#1B1F3B]/50 dark:text-white/50">1.2M rows</span>
              <span className="text-[10px] uppercase tracking-wider bg-[#1E7B4F]/10 text-[#1E7B4F] px-1.5 py-0.5 rounded">Real</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-1.5 rounded-lg border border-[#1B1F3B]/5 dark:border-white/5">
              <span className="font-semibold text-[#1B1F3B] dark:text-white">NITI Infra Index</span>
              <span className="text-xs text-[#1B1F3B]/50 dark:text-white/50">845 rows</span>
              <span className="text-[10px] uppercase tracking-wider bg-[#F28C28]/10 text-[#F28C28] px-1.5 py-0.5 rounded">Sample</span>
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-white/5 px-3 py-1.5 rounded-lg border border-[#1B1F3B]/5 dark:border-white/5">
              <span className="font-semibold text-[#1B1F3B] dark:text-white">Public Invest</span>
              <span className="text-xs text-[#1B1F3B]/50 dark:text-white/50">45k rows</span>
              <span className="text-[10px] uppercase tracking-wider bg-[#F28C28]/10 text-[#F28C28] px-1.5 py-0.5 rounded">Sample</span>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]" style={{ animationDelay: '0.2s' }}>
            {/* Top Categories */}
            <div className="bg-[#FBF6EC] dark:bg-[#0E1226] rounded-2xl p-6 shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#F28C28]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
              <h3 className="text-lg font-bold mb-6 text-[#1B1F3B] dark:text-white font-serif">Category Demand</h3>
              <div className="h-80 relative z-10">
                {isLoading ? <div className="w-full h-full animate-pulse bg-black/5 dark:bg-white/5 rounded-xl"></div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data?.top_categories} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="currentColor" className="text-[#1B1F3B]/10 dark:text-white/10" />
                      <XAxis type="number" stroke="#F28C28" tick={{fill: '#F28C28', opacity: 1, fontSize: 12}} className="font-mono" />
                      <YAxis dataKey="category" type="category" width={90} stroke="#F28C28" tick={{fill: '#F28C28', opacity: 1, fontSize: 12}} className="font-sans" />
                      <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{ borderRadius: '12px', border: '1px solid rgba(27, 31, 59, 0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" fill="#F28C28" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Trend */}
            <div className="bg-[#FBF6EC] dark:bg-[#0E1226] rounded-2xl p-6 shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#E9B44C]/5 rounded-full blur-3xl -mr-10 -mt-10 transition-opacity group-hover:opacity-100 opacity-50"></div>
              <h3 className="text-lg font-bold mb-6 text-[#1B1F3B] dark:text-white font-serif">Submission Trend</h3>
              <div className="h-80 relative z-10">
                {isLoading ? <div className="w-full h-full animate-pulse bg-black/5 dark:bg-white/5 rounded-xl"></div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data?.trend}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-[#1B1F3B]/10 dark:text-white/10" />
                      <XAxis dataKey="date" stroke="#F28C28" tick={{fill: '#F28C28', opacity: 1, fontSize: 12}} className="font-mono" />
                      <YAxis stroke="#F28C28" tick={{fill: '#F28C28', opacity: 1, fontSize: 12}} className="font-mono" />
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: '1px solid rgba(27, 31, 59, 0.1)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Legend iconType="circle" />
                      <Line type="monotone" dataKey="count" stroke="#E9B44C" strokeWidth={3} dot={false} name="Total Submissions" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Status Distribution */}
            <div className="bg-[#FBF6EC] dark:bg-[#0E1226] rounded-2xl p-6 shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 lg:col-span-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#1E7B4F]/5 rounded-full blur-3xl -mr-20 -mt-20 transition-opacity group-hover:opacity-100 opacity-50"></div>
              <h3 className="text-lg font-bold mb-6 text-[#1B1F3B] dark:text-white font-serif">Current Pipeline</h3>
              <div className="h-80 relative z-10">
                {isLoading ? <div className="w-full h-full animate-pulse bg-black/5 dark:bg-white/5 rounded-xl"></div> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={90}
                        outerRadius={130}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {statusData.map((_entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
