import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { MapPin, TrendingUp, ChevronRight, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Sample district data for UP & MH
const DISTRICTS = [
  { id: 'd1', name: 'Lucknow', lat: 26.8467, lng: 80.9462, baseVol: 100, priorityBase: 80, categories: { Water: 40, Roads: 30, Health: 30 } },
  { id: 'd2', name: 'Kanpur', lat: 26.4499, lng: 80.3319, baseVol: 80, priorityBase: 90, categories: { Water: 60, Roads: 20, Health: 0 } },
  { id: 'd3', name: 'Varanasi', lat: 25.3176, lng: 82.9739, baseVol: 60, priorityBase: 50, categories: { Water: 10, Roads: 40, Health: 10 } },
  { id: 'd4', name: 'Pune', lat: 18.5204, lng: 73.8567, baseVol: 120, priorityBase: 70, categories: { Water: 20, Roads: 50, Health: 50 } },
  { id: 'd5', name: 'Nagpur', lat: 21.1458, lng: 79.0882, baseVol: 50, priorityBase: 40, categories: { Water: 10, Roads: 20, Health: 20 } },
];

const CATEGORIES = ['All', 'Water', 'Roads', 'Health'];

// Heatmap Layer Component
function HeatmapLayer({ districts, activeCategory }: any) {
  const map = useMap();
  
  useEffect(() => {
    const points = districts.map((d: any) => {
      let categoryVol = d.baseVol;
      if (activeCategory !== 'All') {
        categoryVol = d.categories[activeCategory] || 0;
      }
      
      // We use priority for the color intensity (severity)
      // If the category has no volume, don't show the point
      return categoryVol > 0 ? [d.lat, d.lng, d.priorityBase] : null;
    }).filter(Boolean);

    // @ts-ignore
    const heatLayer = L.heatLayer(points, {
      radius: 50,
      blur: 35,
      maxZoom: 6,
      max: 100, // Priority ranges up to 100
      minOpacity: 0.6,
      gradient: { 
        0.4: '#1E7B4F', // Low - Green
        0.7: '#E9B44C', // Medium - Yellow/Turmeric
        0.9: '#C8553D', // Critical - Terracotta/Red
        1.0: '#8B0000'  // Extreme - Dark Red
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, districts, activeCategory]);

  return null;
}

// Custom markers using DivIcon for smooth CSS animation
function AnimatedMarkers({ districts, activeCategory, onSelect }: any) {
  const map = useMap();
  
  useEffect(() => {
    // Keep track of markers to remove them on cleanup
    const markers: any[] = [];

    districts.forEach((d: any) => {
      let categoryVol = d.baseVol;
      
      if (activeCategory !== 'All') {
        categoryVol = d.categories[activeCategory] || 0;
      }
      
      const currentVol = categoryVol;
      if (currentVol === 0) return;

      const priority = d.priorityBase;
      let color = '#1E7B4F'; // green
      if (priority > 75) color = '#C8553D'; // terracotta
      else if (priority > 45) color = '#E9B44C'; // turmeric

      const size = Math.max(20, Math.min(80, currentVol * 0.8)); // map volume to size

      const iconHtml = `
        <div style="
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          opacity: 0.8;
          box-shadow: 0 0 15px ${color}80;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 10px;
          transition: all 0.5s ease-out;
        ">
          ${currentVol > 10 ? currentVol : ''}
          <div style="
            position: absolute;
            inset: 0;
            border-radius: 50%;
            border: 2px solid ${color};
            animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;
          "></div>
        </div>
      `;

      const icon = L.divIcon({
        html: iconHtml,
        className: 'custom-div-icon',
        iconSize: [size, size],
        iconAnchor: [size/2, size/2]
      });

      const marker = L.marker([d.lat, d.lng], { icon }).addTo(map);
      marker.on('click', () => onSelect({...d, currentVol, priority, color}));
      markers.push(marker);
    });

    return () => {
      markers.forEach(marker => map.removeLayer(marker));
    };
  }, [map, districts, activeCategory]);

  return null;
}

export default function HotspotMap() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [mapType, setMapType] = useState<'standard' | 'heat'>('standard');
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] md:h-screen flex flex-col md:flex-row bg-[#FBF6EC] dark:bg-[#0E1226] relative overflow-hidden">
      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
      
      {/* Map Area */}
      <div className="flex-1 relative h-full">
        <MapContainer 
          center={[23.5, 78.5]} 
          zoom={6} 
          className="absolute inset-0 w-full h-full z-0"
          style={{ background: isDark ? '#0E1226' : '#FBF6EC' }}
          zoomControl={false}
        >
          <TileLayer
            url={isDark 
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
              : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {mapType === 'standard' ? (
            <AnimatedMarkers 
              districts={DISTRICTS} 
              activeCategory={activeCategory} 
              onSelect={setSelectedCluster} 
            />
          ) : (
            <HeatmapLayer 
              districts={DISTRICTS} 
              activeCategory={activeCategory} 
            />
          )}
        </MapContainer>

        {/* Floating Controls Overlay */}
        <div className="absolute top-4 left-4 right-4 md:right-auto md:top-6 md:left-6 z-[400] flex flex-col gap-4 max-w-[calc(100%-2rem)] md:max-w-sm w-full">
          {/* Map Type Filter */}
          <div className="bg-white/80 dark:bg-[#1B1F3B]/90 backdrop-blur-md rounded-2xl shadow-lg border border-[#1B1F3B]/10 dark:border-white/10 flex gap-1 p-2">
            <button
              onClick={() => {
                setMapType('standard');
                setSelectedCluster(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                mapType === 'standard' 
                  ? 'bg-[#1B1F3B] text-[#FBF6EC] dark:bg-white dark:text-[#1B1F3B]' 
                  : 'text-[#1B1F3B]/70 dark:text-white/70 hover:bg-[#1B1F3B]/5 dark:hover:bg-white/5'
              }`}
            >
              <MapPin size={16} />
              Standard
            </button>
            <button
              onClick={() => {
                setMapType('heat');
                setSelectedCluster(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                mapType === 'heat' 
                  ? 'bg-[#1B1F3B] text-[#FBF6EC] dark:bg-white dark:text-[#1B1F3B]' 
                  : 'text-[#1B1F3B]/70 dark:text-white/70 hover:bg-[#1B1F3B]/5 dark:hover:bg-white/5'
              }`}
            >
              <Layers size={16} />
              Heatmap
            </button>
          </div>

          {/* Category Filter */}
          <div className="bg-white/80 dark:bg-[#1B1F3B]/90 backdrop-blur-md rounded-2xl shadow-lg border border-[#1B1F3B]/10 dark:border-white/10 flex gap-1 p-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-1 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  activeCategory === cat 
                    ? 'bg-[#1B1F3B] text-[#FBF6EC] dark:bg-white dark:text-[#1B1F3B]' 
                    : 'text-[#1B1F3B]/70 dark:text-white/70 hover:bg-[#1B1F3B]/5 dark:hover:bg-white/5'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Side Panel for selected cluster */}
      <AnimatePresence>
        {selectedCluster && mapType === 'standard' && (
          <motion.div 
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full md:w-96 bg-[#FBF6EC] dark:bg-[#0E1226] shadow-2xl z-[500] border-l border-[#1B1F3B]/10 dark:border-white/10 flex flex-col absolute right-0 h-full overflow-y-auto"
          >
            <div className="p-6 border-b border-[#1B1F3B]/10 dark:border-white/10 flex justify-between items-center sticky top-0 bg-[#FBF6EC]/90 dark:bg-[#0E1226]/90 backdrop-blur-md z-10">
              <h3 className="font-bold text-xl font-serif text-[#1B1F3B] dark:text-white flex items-center gap-2">
                <MapPin className="text-[#F28C28]" />
                {selectedCluster.name}
              </h3>
              <button 
                onClick={() => setSelectedCluster(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1B1F3B]/5 dark:bg-white/5 text-[#1B1F3B]/60 dark:text-white/60 hover:bg-[#1B1F3B]/10 dark:hover:bg-white/10 transition-colors"
              >
                &times;
              </button>
            </div>
            
            <div className="p-6 space-y-8 flex-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white dark:bg-[#1B1F3B]/40 p-4 rounded-2xl border border-[#1B1F3B]/5 dark:border-white/5">
                  <p className="text-xs text-[#1B1F3B]/50 dark:text-white/50 mb-1 font-medium">Top Category</p>
                  <p className="font-bold capitalize text-[#1B1F3B] dark:text-white text-lg">{activeCategory === 'All' ? Object.keys(selectedCluster.categories).reduce((a, b) => selectedCluster.categories[a] > selectedCluster.categories[b] ? a : b) : activeCategory}</p>
                </div>
                <div className="bg-white dark:bg-[#1B1F3B]/40 p-4 rounded-2xl border border-[#1B1F3B]/5 dark:border-white/5">
                  <p className="text-xs text-[#1B1F3B]/50 dark:text-white/50 mb-1 font-medium">Active Issues</p>
                  <p className="font-bold text-[#1B1F3B] dark:text-white text-lg flex items-center gap-1 font-mono">
                    {selectedCluster.currentVol} <TrendingUp size={16} className="text-[#C8553D]" />
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <p className="text-sm font-semibold text-[#1B1F3B] dark:text-white">Gap Score</p>
                  <span className="font-mono font-bold text-lg" style={{ color: selectedCluster.color }}>{selectedCluster.priority}/100</span>
                </div>
                <div className="h-3 bg-[#1B1F3B]/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedCluster.priority}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: selectedCluster.color }}
                  />
                </div>
              </div>

              <div className="bg-[#1B1F3B]/5 dark:bg-white/5 rounded-2xl p-4 border border-[#1B1F3B]/10 dark:border-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: selectedCluster.color }}></div>
                <h4 className="font-bold text-[#1B1F3B] dark:text-white mb-2 text-sm flex justify-between items-center">
                  AI Justification 
                  <span className="text-[10px] bg-[#1B1F3B]/10 dark:bg-white/10 px-2 py-1 rounded text-[#1B1F3B] dark:text-white font-mono">JanSetu AI</span>
                </h4>
                <p className="text-sm text-[#1B1F3B]/70 dark:text-white/70 leading-relaxed italic">
                  "High volume of requests related to {activeCategory !== 'All' ? activeCategory.toLowerCase() : 'infrastructure'} paired with a historic underspend in this district indicates an urgent need for intervention. Sentiment analysis of voice notes shows growing frustration."
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-[#1B1F3B] dark:text-white mb-3 flex items-center justify-between">
                  Representative Reports
                  <button className="text-xs text-[#F28C28] flex items-center hover:underline">View All <ChevronRight size={14}/></button>
                </p>
                <div className="space-y-3">
                  {[1,2,3].map((i) => (
                    <div key={i} className="flex gap-3 items-start p-3 bg-white dark:bg-[#1B1F3B]/30 rounded-xl border border-[#1B1F3B]/5 dark:border-white/5">
                      <div className="w-10 h-10 rounded bg-[#1B1F3B]/10 dark:bg-white/10 shrink-0"></div>
                      <div>
                        <p className="text-xs font-mono text-[#1B1F3B]/50 dark:text-white/50 mb-0.5">JS-REQ-{9000 + i}</p>
                        <p className="text-sm text-[#1B1F3B] dark:text-white">"Water supply completely stopped for 3 days in main ward..."</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
