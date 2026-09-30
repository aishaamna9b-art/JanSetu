import { useState, useRef } from 'react';
import { FileText, Download, MapPin, BrainCircuit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { INDIA_STATES_DISTRICTS } from '../../lib/indiaData';
import { SearchableDropdown } from '../../components/SearchableDropdown';
import { useRegion } from '../../components/RegionContext';
import { useReactToPrint } from 'react-to-print';

export default function PolicyBrief() {
  const { state: regionState, setState: setRegionState, district, setDistrict } = useRegion();
  const [isGenerating, setIsGenerating] = useState(false);
  const [brief, setBrief] = useState<null | {
    title: string;
    summary: string;
    date: string;
  }>(null);

  const pdfRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    setIsGenerating(true);
    setBrief(null);
    // Simulate API call
    setTimeout(() => {
      setBrief({
        title: `Strategic Infrastructure Brief: ${district || regionState || 'Regional Analysis'}`,
        date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }),
        summary: "Based on citizen reports and infrastructure index data from the last quarter, critical interventions are required in Water and Sanitation sectors. High volume of severe issues in Gomti Nagar and Alambagh blocks indicate a widening gap between population growth and utility maintenance. Recommended budget allocation targets immediate pipe replacements and the commissioning of new sanitation nodes.",
      });
      setIsGenerating(false);
    }, 2000);
  };

  const downloadPDF = useReactToPrint({
    contentRef: pdfRef,
    documentTitle: `Jansetu_Policy_Brief_${(district || regionState || 'Region').replace(/\s+/g, '_')}`,
    pageStyle: `
      @page { size: A4 portrait; margin: 0; }
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    `
  }) as () => void;

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

      <motion.div variants={itemVariants} className="bg-[#FBF6EC] dark:bg-[#0E1226] p-6 rounded-2xl shadow-sm border border-[#1B1F3B]/10 dark:border-white/10 relative">
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none rounded-2xl overflow-hidden" style={{ backgroundImage: 'radial-gradient(#1B1F3B 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
        
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#1B1F3B] dark:text-white font-serif relative z-10">
          <MapPin size={20} className="text-[#1E7B4F]" />
          Select Region
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative z-20">
          <div>
            <label className="block text-xs font-bold text-[#1B1F3B]/60 dark:text-white/60 uppercase tracking-wider mb-2">State</label>
            <SearchableDropdown 
              options={Object.keys(INDIA_STATES_DISTRICTS)}
              value={regionState}
              onChange={(val: string) => { setRegionState(val); setDistrict(''); }}
              placeholder="Select State"
              className="bg-white dark:bg-[#1B1F3B]/30 border border-[#1B1F3B]/10 dark:border-white/10 rounded-xl py-3 focus:ring-2 focus:ring-[#F28C28]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#1B1F3B]/60 dark:text-white/60 uppercase tracking-wider mb-2">District</label>
            <SearchableDropdown 
              options={regionState ? INDIA_STATES_DISTRICTS[regionState] : []}
              value={district}
              onChange={(val: string) => setDistrict(val)}
              placeholder="Select District"
              className="bg-white dark:bg-[#1B1F3B]/30 border border-[#1B1F3B]/10 dark:border-white/10 rounded-xl py-3 focus:ring-2 focus:ring-[#F28C28]"
              disabled={!regionState}
            />
          </div>
        </div>

        <div className="flex justify-end relative z-10">
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !regionState}
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
            className="flex flex-col items-center space-y-6"
          >
            <div className="w-full flex justify-end max-w-[800px] mx-auto">
                <button 
                  onClick={downloadPDF}
                  className="inline-flex items-center gap-2 bg-[#1B1F3B] hover:bg-[#111425] text-white px-6 py-3 rounded-lg font-bold transition-all text-sm uppercase tracking-widest shadow-xl hover:shadow-2xl active:scale-95"
                >
                  <Download size={18} />
                  Download Official PDF
                </button>
            </div>

            {/* Document Container */}
            <div 
              ref={pdfRef}
              className="bg-white text-left overflow-hidden mx-auto shadow-2xl relative flex flex-col"
              style={{ width: '800px', minHeight: '1131px', backgroundColor: '#ffffff' }}
            >
              {/* Background watermark */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none z-0">
                 <BrainCircuit size={500} />
              </div>
              
              <div className="relative z-10 flex-1 flex flex-col">
                {/* Header Section */}
                <div className="bg-[#1B1F3B] text-white px-14 py-10 flex justify-between items-start">
                  <div>
                    <h2 className="font-serif text-4xl font-bold tracking-tight text-white mb-2">JANSETU</h2>
                    <p className="text-[#F28C28] font-mono text-xs uppercase tracking-[0.25em] font-bold">Strategic Infrastructure Report</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest mb-1">Date of Issue</p>
                    <p className="font-bold text-sm font-serif">{brief.date}</p>
                    <p className="font-mono text-[10px] text-white/50 uppercase tracking-widest mt-4 mb-1">Target Region</p>
                    <p className="font-bold text-sm font-serif">{district ? `${district}, ${regionState}` : regionState || 'All Regions'}</p>
                  </div>
                </div>

                <div className="px-14 py-12 flex-1">
                  <h1 className="text-3xl font-serif font-bold text-[#1B1F3B] leading-tight mb-10 border-b-2 border-[#1B1F3B]/10 pb-6">
                    {brief.title}
                  </h1>

                  {/* Executive Summary */}
                  <div className="mb-12">
                    <h3 className="flex items-center gap-3 text-sm font-bold text-[#1B1F3B] uppercase tracking-[0.15em] mb-6">
                      <div className="w-1.5 h-4 bg-[#F28C28]"></div>
                      Executive Summary
                    </h3>
                    <div className="text-[#1B1F3B]/80 font-serif leading-loose text-[17px] border-l-2 border-[#1B1F3B]/10 pl-8 text-justify">
                      <p className="first-letter:text-5xl first-letter:font-black first-letter:text-[#1B1F3B] first-letter:float-left first-letter:mr-3 first-letter:leading-none">
                        {brief.summary}
                      </p>
                      <p className="mt-4">
                        The AI-driven analysis demonstrates a compelling correlation between chronic infrastructure deficits and rising citizen grievances in the identified zones. Without targeted capital expenditure, the current service delivery mechanisms are modeled to face systemic failures within the next two quarters.
                      </p>
                    </div>
                  </div>

                  {/* Key Metrics / Highlights */}
                  <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="bg-[#FBF6EC] p-6 border border-[#1B1F3B]/5 rounded-sm">
                      <p className="text-[10px] font-bold text-[#1B1F3B]/50 uppercase tracking-widest mb-2">Critical Deficit</p>
                      <p className="text-3xl font-bold text-[#C8553D] font-mono">15%</p>
                      <p className="text-xs text-[#1B1F3B]/60 mt-2 font-medium">Projected Infra Gap</p>
                    </div>
                    <div className="bg-[#FBF6EC] p-6 border border-[#1B1F3B]/5 rounded-sm">
                      <p className="text-[10px] font-bold text-[#1B1F3B]/50 uppercase tracking-widest mb-2">Citizens Affected</p>
                      <p className="text-3xl font-bold text-[#1B1F3B] font-mono">35,000+</p>
                      <p className="text-xs text-[#1B1F3B]/60 mt-2 font-medium">Direct Impact Zone</p>
                    </div>
                    <div className="bg-[#FBF6EC] p-6 border border-[#1B1F3B]/5 rounded-sm">
                      <p className="text-[10px] font-bold text-[#1B1F3B]/50 uppercase tracking-widest mb-2">Priority Sectors</p>
                      <p className="text-xl font-bold text-[#1E7B4F] font-serif leading-tight mt-2">Water &<br/>Sanitation</p>
                    </div>
                  </div>

                  {/* AI Recommendations */}
                  <div>
                    <h3 className="flex items-center gap-3 text-sm font-bold text-[#1B1F3B] uppercase tracking-[0.15em] mb-6">
                      <div className="w-1.5 h-4 bg-[#1E7B4F]"></div>
                      Strategic Recommendations
                    </h3>
                    <ul className="space-y-6 font-serif text-[#1B1F3B]/90 text-[16px] leading-relaxed">
                      <li className="flex items-start gap-4">
                        <span className="shrink-0 text-[#F28C28] font-black font-mono mt-0.5">01</span>
                        <span><strong>Resource Reallocation:</strong> Immediate mobilization of emergency corpus funding to the highest-risk blocks for pipe network replacement.</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <span className="shrink-0 text-[#F28C28] font-black font-mono mt-0.5">02</span>
                        <span><strong>Capacity Expansion:</strong> Development of three new primary sanitation nodes to safely accommodate the observed 12% population surge over the last 36 months.</span>
                      </li>
                      <li className="flex items-start gap-4">
                        <span className="shrink-0 text-[#F28C28] font-black font-mono mt-0.5">03</span>
                        <span><strong>Telemetry & Monitoring:</strong> Deploy automated, sensor-based monitoring frameworks in primary supply lines to detect and mitigate non-revenue water (NRW) loss.</span>
                      </li>
                    </ul>
                  </div>

                </div>

                {/* Footer Section */}
                <div className="w-full bg-[#1B1F3B]/[0.02] border-t border-[#1B1F3B]/10 px-14 py-8 flex justify-between items-center mt-auto">
                   <div className="text-[10px] font-mono text-[#1B1F3B]/50 uppercase tracking-widest flex items-center gap-2">
                     <BrainCircuit size={14} />
                     Generated by JanSetu AI Engine
                   </div>
                   <div className="text-[10px] font-mono text-[#1B1F3B]/50 uppercase tracking-widest">
                     Confidential & Proprietary
                   </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

