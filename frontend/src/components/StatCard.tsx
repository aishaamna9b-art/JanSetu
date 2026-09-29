import { ReactNode, useEffect, useState } from 'react';
import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef } from 'react';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: string;
    positive: boolean;
  };
  isLoading?: boolean;
  sparklineData?: { value: number }[];
}

export function AnimatedCounter({ value }: { value: string | number }) {
  const [count, setCount] = useState(0);
  const nodeRef = useRef<HTMLSpanElement>(null);
  const isInView = useInView(nodeRef, { once: true, margin: "-50px" });
  
  const numericValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
  const isNumeric = !isNaN(numericValue);

  useEffect(() => {
    if (isInView && isNumeric) {
      let start = 0;
      const duration = 1000;
      const startTime = performance.now();
      
      const step = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeOutQuint = 1 - Math.pow(1 - progress, 5);
        setCount(Math.floor(easeOutQuint * numericValue));
        
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setCount(numericValue);
        }
      };
      
      requestAnimationFrame(step);
    }
  }, [isInView, numericValue, isNumeric]);

  if (!isNumeric) return <span>{value}</span>;

  // Format with commas and add any % sign if it was in original string
  const formatValue = () => {
    const hasPercent = typeof value === 'string' && value.includes('%');
    return `${count.toLocaleString()}${hasPercent ? '%' : ''}`;
  };

  return <span ref={nodeRef} className="font-mono tabular-nums">{formatValue()}</span>;
}

export function StatCard({ title, value, icon, trend, isLoading, sparklineData }: StatCardProps) {
  if (isLoading) {
    return (
      <div className="bg-[#FBF6EC] dark:bg-[#0E1226] rounded-2xl p-6 border border-[#1B1F3B]/10 dark:border-white/10 relative overflow-hidden h-[140px] flex flex-col justify-between">
        <motion.div 
          className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-white/5 to-transparent skew-x-12"
          animate={{ translateX: ['-100%', '200%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        />
        <div className="flex justify-between items-start mb-4">
          <div className="w-24 h-5 bg-black/5 dark:bg-white/5 rounded"></div>
          <div className="w-10 h-10 bg-black/5 dark:bg-white/5 rounded-xl"></div>
        </div>
        <div className="w-16 h-8 bg-black/5 dark:bg-white/5 rounded"></div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-[#FBF6EC] dark:bg-[#0E1226] rounded-2xl p-6 border border-[#1B1F3B]/10 dark:border-white/10 hover:border-[#F28C28]/50 transition-colors group relative overflow-hidden flex flex-col justify-between shadow-sm"
    >
      <div className="flex justify-between items-start mb-4 z-10 relative">
        <h3 className="text-[#1B1F3B]/70 dark:text-white/70 font-sans font-medium">{title}</h3>
        <div className="p-2.5 bg-white dark:bg-white/5 text-[#F28C28] rounded-xl border border-[#1B1F3B]/5 dark:border-white/5 group-hover:scale-110 transition-transform">
          {icon}
        </div>
      </div>
      
      <div className="flex items-end justify-between z-10 relative">
        <div>
          <div className="text-4xl font-bold text-[#1B1F3B] dark:text-white font-serif tracking-tight">
            <AnimatedCounter value={value} />
          </div>
          {trend && (
            <div className={`text-sm font-medium mt-1 ${trend.positive ? 'text-[#1E7B4F]' : 'text-[#C8553D]'}`}>
              {trend.positive ? '↑' : '↓'} {trend.value} <span className="text-[#1B1F3B]/40 dark:text-white/40 ml-1">vs last period</span>
            </div>
          )}
        </div>
        
        {sparklineData && sparklineData.length > 0 && (
          <div className="w-24 h-12 opacity-50 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparklineData}>
                <YAxis domain={['dataMin', 'dataMax']} hide />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={trend?.positive !== false ? "#1E7B4F" : "#C8553D"} 
                  strokeWidth={2} 
                  dot={false}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
