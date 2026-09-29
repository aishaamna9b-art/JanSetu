import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchWithAuth } from '../../lib/api';
import { StatCard } from '../../components/StatCard';
import { Users, CheckCircle2, Clock, IndianRupee, Filter } from 'lucide-react';
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
      return fetchWithAuth(`/dashboard/overview?${params.toString()}`);
    }
  });

  if (isLoading) return <div className="p-8 text-gray-500">Loading overview data...</div>;
  if (error) return <div className="p-8 text-red-500">Error loading data: {(error as Error).message}</div>;

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header & Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">High-level metrics and trends</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
          <Filter size={18} className="text-gray-400 ml-2" />
          <select 
            value={filters.state} 
            onChange={e => setFilters({...filters, state: e.target.value})}
            className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer"
          >
            <option value="">All States</option>
            <option value="UP">Uttar Pradesh</option>
            <option value="MH">Maharashtra</option>
          </select>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
          <select 
            value={filters.district} 
            onChange={e => setFilters({...filters, district: e.target.value})}
            className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer"
          >
            <option value="">All Districts</option>
            <option value="Lucknow">Lucknow</option>
            <option value="Kanpur">Kanpur</option>
          </select>
          <div className="w-px h-6 bg-gray-200 dark:bg-gray-700"></div>
          <select 
            value={filters.time} 
            onChange={e => setFilters({...filters, time: e.target.value})}
            className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Requests" 
          value={data?.kpis?.total_requests?.toLocaleString() || 0} 
          icon={<Users size={24} />} 
          trend={{ value: '12%', positive: true }}
        />
        <StatCard 
          title="Resolved" 
          value={data?.kpis?.resolved_requests?.toLocaleString() || 0} 
          icon={<CheckCircle2 size={24} />} 
          trend={{ value: '8%', positive: true }}
        />
        <StatCard 
          title="Avg. Resolution (Days)" 
          value={data?.kpis?.avg_resolution_days || 0} 
          icon={<Clock size={24} />} 
          trend={{ value: '1.2 days', positive: false }}
        />
        <StatCard 
          title="Total Spending" 
          value={`₹${((data?.kpis?.total_spending || 0) / 10000000).toFixed(1)} Cr`} 
          icon={<IndianRupee size={24} />} 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Categories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Top Categories</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.top_categories} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Submission vs Resolution Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data?.trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="date" />
                <YAxis />
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="raised" stroke="#f59e0b" strokeWidth={3} dot={false} name="Raised" />
                <Line type="monotone" dataKey="resolved" stroke="#10b981" strokeWidth={3} dot={false} name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 lg:col-span-2">
          <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Status Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.status_distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data?.status_distribution?.map((_entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
