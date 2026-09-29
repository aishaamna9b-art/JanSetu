import { useState } from 'react';
import { FileText, Download, MapPin, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PolicyBrief() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [brief, setBrief] = useState<null | {
    title: string;
    summary: string;
    date: string;
  }>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setBrief(null);
    // Simulate API call
    setTimeout(() => {
      setBrief({
        title: "Infrastructure Gap & Investment Brief: Lucknow District",
        date: new Date().toLocaleDateString(),
        summary: "Based on citizen reports and infrastructure index data from the last quarter, critical interventions are required in Water and Sanitation sectors. High volume of severe issues in Gomti Nagar and Alambagh blocks indicate a widening gap between population growth and utility maintenance. Recommended budget allocation targets pipe replacements and new sanitation nodes.",
      });
      setIsGenerating(false);
    }, 2000);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div 
      initial="hidden" animate="show" variants={containerVariants}
      className="p-4 md:p-8 max-w-4xl mx-auto space-y-8"
    >
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-[#1B1F3B] dark:text-white font-serif flex items-center gap-3">
          <FileText className="text-[#F28C28]" />
          Policy Brief
        </h1>
        <p className="text-[#1B1F3B]/60 dark:text-white/60 mt-1 font-medium">
          Generate automated, AI-driven reports for specific regions to present to stakeholders and policymakers.
        </p>
      </motion.div>

      <motion.div variants={itemVariants} className="bg-[#FBF6EC] dark:bg-[#0E1226] p-6 rounded-2xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#1B1F3B 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
        
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#1B1F3B] dark:text-white font-serif relative z-10">
          <MapPin size={20} className="text-[#1E7B4F]" />
          Select Region
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-10">
          <div>
            <label className="block text-xs font-bold text-[#1B1F3B]/60 dark:text-white/60 uppercase tracking-wider mb-2">State</label>
            <select className="w-full bg-white dark:bg-[#1B1F3B]/30 border border-[#1B1F3B]/10 dark:border-white/10 rounded-xl p-3 text-[#1B1F3B] dark:text-white font-medium focus:ring-2 focus:ring-[#F28C28] focus:border-transparent outline-none transition-shadow">
              <option>Uttar Pradesh</option>
              <option>Bihar</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1B1F3B]/60 dark:text-white/60 uppercase tracking-wider mb-2">District</label>
            <select className="w-full bg-white dark:bg-[#1B1F3B]/30 border border-[#1B1F3B]/10 dark:border-white/10 rounded-xl p-3 text-[#1B1F3B] dark:text-white font-medium focus:ring-2 focus:ring-[#F28C28] focus:border-transparent outline-none transition-shadow">
              <option>Lucknow</option>
              <option>Varanasi</option>
              <option>Kanpur</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end relative z-10">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center justify-center gap-2 bg-[#F28C28] hover:bg-[#C8553D] text-white font-bold py-3 px-6 rounded-xl shadow-[0_4px_14px_0_rgba(242,140,40,0.39)] transition-all transform active:scale-95 disabled:opacity-70 disabled:pointer-events-none uppercase tracking-widest text-xs"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <BrainCircuit size={16} />
            )}
            {isGenerating ? 'Compiling AI Brief...' : 'Generate Brief'}
          </button>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {brief && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="bg-white rounded-none shadow-[0_20px_50px_rgba(8,_112,_184,_0.1)] border border-[#1B1F3B]/10 overflow-hidden max-w-3xl mx-auto my-12"
            style={{ minHeight: '842px', aspectRatio: '1 / 1.414' }} // A4 proportions
          >
            {/* A4 Paper Header */}
            <div className="p-12 border-b-2 border-double border-[#1B1F3B]/20 flex flex-col items-center text-center gap-4 relative">
              <div className="absolute top-0 left-0 w-full h-2 bg-[#F28C28]"></div>
              <div>
                <h3 className="text-3xl font-black font-serif text-[#1B1F3B] uppercase tracking-tighter mb-2">{brief.title}</h3>
                <p className="text-sm font-mono text-[#1B1F3B]/60 uppercase tracking-widest">Official AI Summary Report • {brief.date}</p>
              </div>
            </div>
            
            <div className="p-12">
              <h4 className="text-sm font-black text-[#1B1F3B] uppercase tracking-widest mb-6 border-l-4 border-[#C8553D] pl-4">Executive Summary</h4>
              <div className="prose max-w-none text-[#1B1F3B] font-serif leading-loose text-lg">
                <p className="first-letter:text-5xl first-letter:font-black first-letter:text-[#C8553D] first-letter:mr-3 first-letter:float-left">{brief.summary}</p>
                <p className="mt-6">The AI-driven analysis indicates a strong correlation between infrastructure deficits and citizen complaints in the identified regions. Early intervention using the recommended budget allocation is projected to close the infrastructure gap by 15% and directly improve services for an estimated 35,000 citizens.</p>
              </div>
              
              <div className="mt-12 pt-12 border-t border-[#1B1F3B]/10">
                <h4 className="text-sm font-black text-[#1B1F3B] uppercase tracking-widest mb-6">Contents Included in Full Export</h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    "Detailed KPI Analysis & Temporal Trends",
                    "Geospatial Hotspot Map (High-Resolution)",
                    "Demand vs. Infrastructure Gap Analysis",
                    "AI-Ranked Project Recommendations",
                    "Simulated Budget Impact Projections"
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm font-medium text-[#1B1F3B]/70 bg-[#FBF6EC] p-3 rounded">
                      <div className="w-2 h-2 mt-1.5 shrink-0 bg-[#1B1F3B]"></div>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="mt-16 text-center">
                <button className="inline-flex items-center gap-2 bg-[#1B1F3B] hover:bg-[#F28C28] text-white px-8 py-4 rounded-xl font-bold transition-colors text-sm uppercase tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-1 transform">
                  <Download size={20} />
                  Download Full Official PDF
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
