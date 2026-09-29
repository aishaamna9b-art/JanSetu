import { useState } from 'react';
import { FileText, Download, Loader2, MapPin } from 'lucide-react';

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

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Generate Policy Brief</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Create automated, data-driven reports for specific regions to present to stakeholders and policymakers.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 mb-8">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <MapPin size={20} className="text-blue-500" />
          Select Region
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">State</label>
            <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700">
              <option>Uttar Pradesh</option>
              <option>Bihar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">District</label>
            <select className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2.5 bg-white dark:bg-gray-700">
              <option>Lucknow</option>
              <option>Varanasi</option>
              <option>Kanpur</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors disabled:opacity-70"
          >
            {isGenerating ? <Loader2 size={20} className="animate-spin" /> : <FileText size={20} />}
            {isGenerating ? 'Generating...' : 'Generate Brief'}
          </button>
        </div>
      </div>

      {brief && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold mb-1">{brief.title}</h3>
              <p className="text-sm text-gray-500">Generated on {brief.date}</p>
            </div>
            <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
              <Download size={16} />
              Download PDF
            </button>
          </div>
          <div className="p-8">
            <h4 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Executive Summary</h4>
            <div className="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed space-y-4">
              <p>{brief.summary}</p>
              <p>The AI-driven analysis indicates a strong correlation between infrastructure deficits and citizen complaints in the identified regions. Early intervention using the recommended budget allocation is projected to close the infrastructure gap by 15% and directly improve services for an estimated 35,000 citizens.</p>
            </div>
            
            <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-700">
              <h4 className="font-bold mb-4 text-gray-900 dark:text-gray-100">Key Sections Included in PDF:</h4>
              <ul className="list-disc pl-5 text-gray-600 dark:text-gray-300 space-y-2">
                <li>Detailed KPI Analysis & Temporal Trends</li>
                <li>Geospatial Hotspot Map (High-Resolution)</li>
                <li>Demand vs. Infrastructure Gap Analysis</li>
                <li>AI-Ranked Project Recommendations</li>
                <li>Simulated Budget Impact Projections</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
