import { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin } from '@vis.gl/react-google-maps';
import { MapPin, AlertCircle, TrendingUp } from 'lucide-react';

const MAP_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Mock clusters
const MOCK_CLUSTERS = [
  { id: 'c1', lat: 26.8467, lng: 80.9462, count: 45, category: 'water', priority: 95 },
  { id: 'c2', lat: 26.85, lng: 80.95, count: 12, category: 'roads', priority: 60 },
  { id: 'c3', lat: 25.3176, lng: 82.9739, count: 89, category: 'sanitation', priority: 88 },
];

export default function HotspotMap() {
  const [selectedCluster, setSelectedCluster] = useState<any>(null);

  if (!MAP_API_KEY) {
    return (
      <div className="p-8 h-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Google Maps API Key Missing</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Please add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable the Hotspot Map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-gray-900 relative">
      {/* Map Area */}
      <div className="flex-1 relative h-full">
        <APIProvider apiKey={MAP_API_KEY}>
          <Map
            defaultCenter={{ lat: 26.8467, lng: 80.9462 }} // Lucknow
            defaultZoom={11}
            mapId="DEMO_MAP_ID"
            disableDefaultUI={true}
          >
            {MOCK_CLUSTERS.map(cluster => (
              <AdvancedMarker 
                key={cluster.id}
                position={{ lat: cluster.lat, lng: cluster.lng }}
                onClick={() => setSelectedCluster(cluster)}
              >
                <Pin 
                  background={cluster.priority > 80 ? '#ef4444' : cluster.priority > 50 ? '#f59e0b' : '#3b82f6'} 
                  borderColor={cluster.priority > 80 ? '#b91c1c' : '#b45309'}
                  glyphColor="#fff"
                />
              </AdvancedMarker>
            ))}
          </Map>
        </APIProvider>
      </div>

      {/* Side Panel for selected cluster */}
      {selectedCluster && (
        <div className="w-full md:w-96 bg-white dark:bg-gray-800 shadow-2xl z-10 border-l border-gray-200 dark:border-gray-700 flex flex-col absolute md:relative right-0 h-full overflow-y-auto transform transition-transform animate-in slide-in-from-right-8">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <MapPin className="text-blue-500" />
              Cluster Details
            </h3>
            <button 
              onClick={() => setSelectedCluster(null)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-2xl leading-none"
            >
              &times;
            </button>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Issue Category</p>
                <p className="font-bold capitalize text-gray-900 dark:text-gray-100">{selectedCluster.category}</p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-xs text-gray-500 mb-1">Reports</p>
                <p className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1">
                  {selectedCluster.count} <TrendingUp size={14} className="text-red-500" />
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Priority Score</p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${selectedCluster.priority > 80 ? 'bg-red-500' : 'bg-yellow-500'}`}
                    style={{ width: `${selectedCluster.priority}%` }}
                  />
                </div>
                <span className="font-bold">{selectedCluster.priority}</span>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Recent Photos</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 flex gap-3">
              <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium transition-colors">
                Escalate
              </button>
              <button className="flex-1 bg-white hover:bg-gray-50 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 py-2 rounded-lg font-medium transition-colors">
                Change Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
