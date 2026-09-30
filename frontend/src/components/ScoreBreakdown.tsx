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
  const segments = [
    { label: 'Volume', value: scores.volume, max: 20, color: 'bg-[#F28C28]' }, // Saffron
    { label: 'Urgency', value: scores.urgency, max: 20, color: 'bg-[#C8553D]' }, // Terracotta
    { label: 'Severity', value: scores.severity, max: 20, color: 'bg-[#1B1F3B]' }, // Ink
    { label: 'Infra Gap', value: scores.infra_gap, max: 20, color: 'bg-[#1E7B4F]' }, // Green
    { label: 'Population', value: scores.population, max: 20, color: 'bg-[#E9B44C]' }, // Turmeric
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end pb-3 border-b border-[#1B1F3B]/10 dark:border-white/10">
        <span className="text-sm font-bold text-[#1B1F3B]/80 dark:text-white/80 uppercase tracking-wider">Priority Score</span>
        <span className="text-4xl font-black text-[#1B1F3B] dark:text-white tracking-tighter leading-none">{totalScore}</span>
      </div>
      
      <div className="space-y-3.5">
        {segments.map((segment, index) => {
          const width = (segment.value / segment.max) * 100;
          return (
            <div key={segment.label} className="space-y-1.5">
              <div className="flex justify-between items-center text-[11px] font-bold text-[#1B1F3B]/70 dark:text-white/70 uppercase tracking-wider">
                <span>{segment.label}</span>
                <span className="font-mono">{segment.value}/{segment.max}</span>
              </div>
              <div className="h-2 w-full bg-[#1B1F3B]/5 dark:bg-white/5 rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1, ease: 'easeOut' }}
                  className={`h-full rounded-full ${segment.color}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
