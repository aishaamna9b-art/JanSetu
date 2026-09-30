import { motion } from 'framer-motion';

interface ScoreBreakdownProps {
  scores: {
    volume: number;
    urgency: number;
    severity: number;
    infra_gap: number;
    population: number;
  };
  totalScore: number;
}

export default function ScoreBreakdown({ scores, totalScore }: ScoreBreakdownProps) {
  const totalWeight = scores.volume + scores.urgency + scores.severity + scores.infra_gap + scores.population;
  
  const segments = [
    { label: 'Volume', value: scores.volume, color: 'bg-[#F28C28]' }, // Saffron
    { label: 'Urgency', value: scores.urgency, color: 'bg-[#C8553D]' }, // Terracotta
    { label: 'Severity', value: scores.severity, color: 'bg-[#1B1F3B]' }, // Ink
    { label: 'Infra Gap', value: scores.infra_gap, color: 'bg-[#1E7B4F]' }, // Green
    { label: 'Population', value: scores.population, color: 'bg-[#E9B44C]' }, // Turmeric
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end mb-1">
        <span className="text-xs font-bold text-[#1B1F3B]/60 dark:text-white/60 uppercase tracking-wider">Priority Breakdown</span>
        <span className="text-3xl font-mono font-bold text-[#1B1F3B] dark:text-white">{totalScore}</span>
      </div>
      
      {/* The Stacked Bar */}
      <div className="h-5 w-full flex rounded-full overflow-hidden bg-[#1B1F3B]/10 dark:bg-white/10 shadow-inner group">
        {segments.map((segment, index) => {
          const width = (segment.value / totalWeight) * 100;
          return (
            <motion.div 
              key={segment.label}
              title={`${segment.label}: ${segment.value}`}
              initial={{ width: 0 }}
              animate={{ width: `${width}%` }}
              transition={{ duration: 1, delay: index * 0.1, type: 'spring', bounce: 0 }}
              className={`h-full ${segment.color} hover:opacity-90 relative cursor-crosshair border-r border-[#FBF6EC] dark:border-[#0E1226] last:border-r-0 flex items-center justify-center overflow-hidden group/segment`}
            >
              <div className="absolute opacity-0 group-hover/segment:opacity-100 transition-opacity bg-black/80 text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap z-10 font-medium">
                {segment.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-[10px] uppercase font-bold text-[#1B1F3B]/60 dark:text-white/60 tracking-wider">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full ${segment.color}`} />
            <span>{segment.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
