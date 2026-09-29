import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { 
  Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ComposedChart, Line
} from 'recharts';
import { MapPin, AlertTriangle, ArrowUpDown, TrendingUp, DollarSign } from 'lucide-react';

interface GapData {
  block: string;
  district: string;
  category: string;
  demand_count: number;
  infra_index: number;
  spending: number;
  gap_score: number;
}

export default function GapAnalysis() {
  const [district, setDistrict] = useState('');
  const [sortField, setSortField] = useState<keyof GapData>('gap_score');
  const [sortDesc, setSortDesc] = useState(true);

  const { data: gaps, isLoading, error } = useQuery<GapData[]>({
    queryKey: ['gaps', district],
    queryFn: () => {
      const params = new URLSearchParams();
      if (district) params.append('district', district);
      return fetchWithAuth(`/analytics/gaps?${params.toString()}`);
    }
  });

  const sortedGaps = useMemo(() => {
    if (!gaps) return [];
    return [...gaps].sort((a, b) => {
      if (a[sortField] < b[sortField]) return sortDesc ? 1 : -1;
      if (a[sortField] > b[sortField]) return sortDesc ? -1 : 1;
      return 0;
    });
  }, [gaps, sortField, sortDesc]);

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

  const isHighDemandLowSpending = (gap: GapData) => {
    return gap.gap_score >= 0.8;
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Infrastructure Gap Analysis</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Identify regions with high citizen demand and low infrastructure spending</p>
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
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 flex items-start gap-3">
          <AlertTriangle className="mt-0.5" />
          <p>{(error as Error).message}</p>
        </div>
      ) : !sortedGaps.length ? (
        <div className="text-center py-20 text-gray-500">No gap analysis data found.</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h2 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Demand vs Spending by Block</h2>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={sortedGaps} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="block" tick={{fill: '#6b7280'}} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" tick={{fill: '#6b7280'}} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" tick={{fill: '#6b7280'}} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any, name: any) => {
                        if (name === 'Spending') return formatCurrency(Number(value));
                        if (name === 'Demand') return value + ' requests';
                        return value;
                      }}
                    />
                    <Legend />
                    <Bar yAxisId="left" dataKey="demand_count" name="Demand" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                    <Line yAxisId="right" type="monotone" dataKey="spending" name="Spending" stroke="#10b981" strokeWidth={3} dot={{r: 6, fill: '#10b981'}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium">
                      <th className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('block')}>
                        <div className="flex items-center gap-2">Block <ArrowUpDown size={14}/></div>
                      </th>
                      <th className="p-4">District</th>
                      <th className="p-4">Category</th>
                      <th className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('demand_count')}>
                        <div className="flex items-center gap-2">Demand <ArrowUpDown size={14}/></div>
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('infra_index')}>
                        <div className="flex items-center gap-2">Infra Index <ArrowUpDown size={14}/></div>
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('spending')}>
                        <div className="flex items-center gap-2">Spending <ArrowUpDown size={14}/></div>
                      </th>
                      <th className="p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" onClick={() => handleSort('gap_score')}>
                        <div className="flex items-center gap-2">Gap Score <ArrowUpDown size={14}/></div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-800 dark:text-gray-200 text-sm">
                    {sortedGaps.map((gap, i) => {
                      const isCritical = isHighDemandLowSpending(gap);
                      return (
                        <tr key={i} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isCritical ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                          <td className="p-4 font-medium flex items-center gap-2">
                            {gap.block}
                            {isCritical && <span title="High demand, low spending"><AlertTriangle size={16} className="text-red-500" /></span>}
                          </td>
                          <td className="p-4">{gap.district}</td>
                          <td className="p-4 capitalize">{gap.category}</td>
                          <td className="p-4">
                            <span className="flex items-center gap-1"><TrendingUp size={14} className="text-blue-500"/>{gap.demand_count}</span>
                          </td>
                          <td className="p-4">{(gap.infra_index * 100).toFixed(0)}/100</td>
                          <td className="p-4">
                            <span className="flex items-center gap-1"><DollarSign size={14} className="text-green-500"/>{formatCurrency(gap.spending)}</span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full ${gap.gap_score >= 0.8 ? 'bg-red-500' : gap.gap_score >= 0.6 ? 'bg-orange-500' : 'bg-blue-500'}`}
                                  style={{ width: `${gap.gap_score * 100}%` }}
                                />
                              </div>
                              <span className="font-medium text-xs">{(gap.gap_score * 100).toFixed(0)}</span>
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
        </div>
      )}
    </div>
  );
}
