import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const MOCK_DATA = [
  { district: 'Lucknow', raised: 4500, resolved: 3200, rate: 71 },
  { district: 'Kanpur', raised: 3800, resolved: 2100, rate: 55 },
  { district: 'Varanasi', raised: 2900, resolved: 2400, rate: 82 },
  { district: 'Agra', raised: 1800, resolved: 1100, rate: 61 },
  { district: 'Patna', raised: 3100, resolved: 1900, rate: 61 },
];

export default function ImpactTracker() {
  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Impact Tracker</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor request resolution rates across districts to evaluate operational efficiency.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-6">Raised vs Resolved by District</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={MOCK_DATA}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="district" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Legend />
                <Bar dataKey="raised" name="Total Raised" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
          <h3 className="text-lg font-bold mb-6">Resolution Rate (%)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={MOCK_DATA}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="district" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" domain={[0, 100]} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#f3f4f6' }}
                  itemStyle={{ color: '#e5e7eb' }}
                />
                <Legend />
                <Line type="monotone" dataKey="rate" name="Resolution Rate %" stroke="#10b981" strokeWidth={3} dot={{ r: 6 }} activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-gray-900 dark:text-gray-100">Performance Matrix</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">District</th>
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Issues Raised</th>
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Issues Resolved</th>
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Resolution Rate</th>
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {MOCK_DATA.sort((a, b) => b.rate - a.rate).map((data) => (
                <tr key={data.district} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="p-4 font-medium">{data.district}</td>
                  <td className="p-4">{data.raised.toLocaleString()}</td>
                  <td className="p-4">{data.resolved.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${data.rate >= 70 ? 'bg-green-500' : data.rate >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                          style={{ width: `${data.rate}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">{data.rate}%</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {data.rate >= 70 ? (
                      <span className="text-green-600 dark:text-green-400 text-sm font-medium">On Track</span>
                    ) : data.rate >= 60 ? (
                      <span className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Needs Attention</span>
                    ) : (
                      <span className="text-red-600 dark:text-red-400 text-sm font-medium">Critical</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
