import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, TrendingUp, Play, Pause, ChevronRight } from 'lucide-react';
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

// Custom markers using DivIcon for smooth CSS animation
function AnimatedMarkers({ districts, activeCategory, timeIndex, onSelect }: any) {
  const map = useMap();
  
  // Clean up old markers
  useEffect(() => {
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer);
      }
    });

    districts.forEach((d: any) => {
      // Calculate current volume based on time slider and category
      const timeScale = (timeIndex + 1) / 60; // 0 to 1
      let categoryVol = d.baseVol;
      
      if (activeCategory !== 'All') {
        categoryVol = d.categories[activeCategory] || 0;
      }
      
      const currentVol = Math.floor(categoryVol * timeScale);
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
    });
  }, [map, districts, activeCategory, timeIndex]);

  return null;
}

export default function HotspotMap() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [timeIndex, setTimeIndex] = useState(59); // 60 days (0-59)
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCluster, setSelectedCluster] = useState<any>(null);
  
  // Determine if dark mode is active to switch tiles
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimeIndex(prev => {
          if (prev >= 59) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

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
          style={{ height: '100%', width: '100%', background: isDark ? '#0E1226' : '#FBF6EC' }}
          zoomControl={false}
        >
          <TileLayer
            url={isDark 
              ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png' 
              : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'}
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          />
          <AnimatedMarkers 
            districts={DISTRICTS} 
            activeCategory={activeCategory} 
            timeIndex={timeIndex} 
            onSelect={setSelectedCluster} 
          />
        </MapContainer>

        {/* Floating Controls Overlay */}
        <div className="absolute top-6 left-6 z-[400] flex flex-col gap-4 max-w-sm w-full">
          {/* Category Filter */}
          <div className="bg-white/80 dark:bg-[#1B1F3B]/90 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-[#1B1F3B]/10 dark:border-white/10 flex gap-1 p-2">
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

          {/* Time Slider */}
          <div className="bg-white/80 dark:bg-[#1B1F3B]/90 backdrop-blur-md p-4 rounded-2xl shadow-lg border border-[#1B1F3B]/10 dark:border-white/10 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#1B1F3B]/60 dark:text-white/60 uppercase tracking-wide">Last 60 Days</span>
              <span className="text-xs font-mono font-bold text-[#F28C28]">Day {timeIndex + 1}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                  if (timeIndex === 59) setTimeIndex(0);
                  setIsPlaying(!isPlaying);
                }}
                className="w-10 h-10 shrink-0 rounded-full bg-[#F28C28]/10 text-[#F28C28] flex items-center justify-center hover:bg-[#F28C28]/20 transition-colors"
              >
                {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
              </button>
              <input 
                type="range" 
                min="0" 
                max="59" 
                value={timeIndex}
                onChange={(e) => {
                  setIsPlaying(false);
                  setTimeIndex(parseInt(e.target.value));
                }}
                className="flex-1 accent-[#F28C28] h-1.5 bg-[#1B1F3B]/10 dark:bg-white/10 rounded-full appearance-none outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Side Panel for selected cluster */}
      <AnimatePresence>
        {selectedCluster && (
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
