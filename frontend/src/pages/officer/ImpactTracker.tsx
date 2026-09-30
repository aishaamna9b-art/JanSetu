import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { AlertTriangle, BrainCircuit, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface ImpactData {
  district: string;
  raised: number;
  resolved: number;
  resolution_rate: number;
}

export default function ImpactTracker() {
  const { data, isLoading, error } = useQuery<ImpactData[]>({
    queryKey: ['impact'],
    queryFn: () => fetchWithAuth('/impact')
  });

  const allData = (data || []).map(d => ({
    ...d,
    rate: Math.round(d.resolution_rate * 100)
  }));

  // Take top 15 districts by volume for charts to prevent UI congestion
  const chartData = [...allData].sort((a, b) => b.raised - a.raised).slice(0, 15);
  
  // Full data sorted by rate for the table
  const tableData = [...allData].sort((a, b) => b.rate - a.rate);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="relative w-24 h-24">
          <div className="absolute inset-0 rounded-full border-4 border-[#1B1F3B]/10 dark:border-white/10"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-[#1E7B4F] animate-spin"></div>
          <Activity className="absolute inset-0 m-auto text-[#1E7B4F] animate-pulse" size={32} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#C8553D]/10 text-[#C8553D] p-4 rounded-xl flex items-start gap-3 max-w-6xl mx-auto mt-8 border border-[#C8553D]/20">
        <AlertTriangle className="mt-0.5 shrink-0" />
        <div>
          <h3 className="font-bold font-serif">Failed to load impact data</h3>
          <p className="text-sm mt-1">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden" animate="show" variants={containerVariants}
      className="p-4 md:p-8 max-w-7xl mx-auto space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-[#1B1F3B] dark:text-white font-serif flex items-center gap-3">
          <Activity className="text-[#1E7B4F]" />
          Impact Tracker
        </h1>
        <p className="text-[#1B1F3B]/60 dark:text-white/60 mt-1 font-medium">
          Monitor request resolution rates across districts to evaluate operational efficiency.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <motion.div variants={itemVariants} className="bg-[#FBF6EC] dark:bg-[#0E1226] rounded-2xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 p-6 relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(#1B1F3B 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
          <h3 className="text-lg font-bold mb-6 text-[#1B1F3B] dark:text-white font-serif relative z-10">Raised vs Resolved</h3>
          <div className="h-80 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-[#1B1F3B]/10 dark:text-white/10" vertical={false} />
                <XAxis dataKey="district" stroke="#F28C28" tick={{fill: '#F28C28', opacity: 1, fontSize: 11}} className="font-mono" tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#F28C28" tick={{fill: '#F28C28', opacity: 1, fontSize: 12}} className="font-mono" tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(27, 31, 59, 0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-ink)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Bar dataKey="resolved" stackId="a" name="Resolved" fill="#1E7B4F" radius={[0, 0, 0, 0]} barSize={30} />
                <Bar dataKey="raised" stackId="a" name="Raised (Pending)" fill="#1B1F3B" radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="bg-[#FBF6EC] dark:bg-[#0E1226] rounded-2xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 p-6 relative overflow-hidden">
          <h3 className="text-lg font-bold mb-6 text-[#1B1F3B] dark:text-white font-serif relative z-10">Resolution Velocity</h3>
          <div className="h-80 relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-[#1B1F3B]/10 dark:text-white/10" vertical={false} />
                <XAxis dataKey="district" stroke="#F28C28" tick={{fill: '#F28C28', opacity: 1, fontSize: 11}} className="font-mono" tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#F28C28" tick={{fill: '#F28C28', opacity: 1, fontSize: 12}} className="font-mono" domain={[0, 100]} tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: 'var(--color-primary-50)', color: 'var(--color-ink)' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', paddingTop: '20px' }} />
                <Line type="monotone" dataKey="rate" name="Resolution Rate %" stroke="#F28C28" strokeWidth={4} dot={{ r: 6, fill: '#F28C28', strokeWidth: 0 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      
      <motion.div variants={itemVariants} className="bg-white dark:bg-[#1B1F3B]/30 rounded-2xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 overflow-hidden">
        <div className="p-5 border-b border-[#1B1F3B]/10 dark:border-white/10 bg-[#FBF6EC] dark:bg-[#0E1226] flex items-center justify-between">
          <h3 className="font-bold text-[#1B1F3B] dark:text-white font-serif">Performance Matrix</h3>
          <BrainCircuit className="text-[#1B1F3B]/20 dark:text-white/20" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1B1F3B]/10 dark:border-white/10 bg-white dark:bg-transparent">
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-[#1B1F3B]/50 dark:text-white/50">District</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-[#1B1F3B]/50 dark:text-white/50">Issues Raised</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-[#1B1F3B]/50 dark:text-white/50">Issues Resolved</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-[#1B1F3B]/50 dark:text-white/50">Resolution Rate</th>
                <th className="p-4 font-bold text-[10px] uppercase tracking-widest text-[#1B1F3B]/50 dark:text-white/50">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1B1F3B]/5 dark:divide-white/5">
              {tableData.map((data, index) => (
                <tr key={data.district} className="hover:bg-[#1B1F3B]/5 dark:hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-bold text-[#1B1F3B] dark:text-white flex items-center gap-2">
                    {index === 0 && <span className="text-xl" title="1st Place">🥇</span>}
                    {index === 1 && <span className="text-xl" title="2nd Place">🥈</span>}
                    {index === 2 && <span className="text-xl" title="3rd Place">🥉</span>}
                    {index > 2 && <span className="w-5 inline-block text-center text-[#1B1F3B]/30 dark:text-white/30 font-mono text-sm">{index + 1}</span>}
                    {data.district}
                  </td>
                  <td className="p-4 font-mono text-[#1B1F3B]/70 dark:text-white/70">{data.raised.toLocaleString()}</td>
                  <td className="p-4 font-mono text-[#1B1F3B]/70 dark:text-white/70">{data.resolved.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-[#1B1F3B]/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${data.rate}%` }}
                          transition={{ duration: 1.5, type: 'spring' }}
                          className={`h-full rounded-full ${data.rate >= 70 ? 'bg-[#1E7B4F]' : data.rate >= 50 ? 'bg-[#E9B44C]' : 'bg-[#C8553D]'}`}
                        />
                      </div>
                      <span className="font-mono font-bold text-sm text-[#1B1F3B] dark:text-white">{data.rate}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {data.rate >= 70 ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#1E7B4F]/10 text-[#1E7B4F] uppercase tracking-wider">On Track</span>
                    ) : data.rate >= 50 ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#E9B44C]/10 text-[#E9B44C] uppercase tracking-wider">Needs Attention</span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#C8553D]/10 text-[#C8553D] uppercase tracking-wider">Critical</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
}
