

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
  // Normalize components so they sum to 100% of the bar width
  const totalWeight = scores.volume + scores.urgency + scores.severity + scores.infra_gap + scores.population;
  
  const segments = [
    { label: 'Volume', value: scores.volume, color: 'bg-blue-500' },
    { label: 'Urgency', value: scores.urgency, color: 'bg-orange-500' },
    { label: 'Severity', value: scores.severity, color: 'bg-red-500' },
    { label: 'Infra Gap', value: scores.infra_gap, color: 'bg-purple-500' },
    { label: 'Population', value: scores.population, color: 'bg-teal-500' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-end mb-1">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Priority Breakdown</span>
        <span className="text-2xl font-bold text-gray-900 dark:text-white">{totalScore}</span>
      </div>
      
      {/* The Stacked Bar */}
      <div className="h-4 w-full flex rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-inner">
        {segments.map((segment) => {
          const width = (segment.value / totalWeight) * 100;
          return (
            <div 
              key={segment.label}
              title={`${segment.label}: ${segment.value}`}
              className={`h-full ${segment.color} transition-all duration-500 hover:opacity-80`}
              style={{ width: `${width}%` }}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 text-xs font-medium text-gray-600 dark:text-gray-400">
        {segments.map((segment) => (
          <div key={segment.label} className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${segment.color}`} />
            <span>{segment.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
