import { useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

const MOCK_REGIONS = [
  { id: 1, state: 'Uttar Pradesh', district: 'Lucknow', block: 'Gomti Nagar', status: 'Active' },
  { id: 2, state: 'Uttar Pradesh', district: 'Lucknow', block: 'Alambagh', status: 'Active' },
  { id: 3, state: 'Uttar Pradesh', district: 'Varanasi', block: 'Lanka', status: 'Active' },
  { id: 4, state: 'Bihar', district: 'Patna', block: 'Kankarbagh', status: 'Inactive' },
];

export default function Regions() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRegions = MOCK_REGIONS.filter(r => 
    r.state.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.district.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.block.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold mb-2">Manage Regions</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Add and manage operational states, districts, and blocks for the platform.
          </p>
        </div>
        
        <button className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          <Plus size={20} />
          Add Region
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg leading-5 bg-white dark:bg-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Search by state, district or block..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">State</th>
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">District</th>
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Block</th>
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Status</th>
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredRegions.map((region) => (
                <tr key={region.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="p-4">{region.state}</td>
                  <td className="p-4">{region.district}</td>
                  <td className="p-4">{region.block}</td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      region.status === 'Active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {region.status}
                    </span>
                  </td>
                  <td className="p-4 flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30">
                      <Edit2 size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30">
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {filteredRegions.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No regions found matching "{searchTerm}"
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
