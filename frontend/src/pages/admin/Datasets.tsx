import { useState } from 'react';
import { UploadCloud, CheckCircle2 } from 'lucide-react';

export default function Datasets() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setUploadComplete(false);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    // Mock upload delay
    setTimeout(() => {
      setIsUploading(false);
      setUploadComplete(true);
      setFile(null);
    }, 2000);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Upload Datasets</h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload regional population data, existing infrastructure shapefiles, or historical spending records (CSV).
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-12 bg-gray-50 dark:bg-gray-900/50">
          <UploadCloud className="w-12 h-12 text-blue-500 mb-4" />
          
          <label className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors mb-4">
            Browse Files
            <input 
              type="file" 
              accept=".csv" 
              className="hidden" 
              onChange={handleFileChange}
            />
          </label>
          
          <p className="text-sm text-gray-500 dark:text-gray-400">
            or drag and drop CSV files here
          </p>
          
          {file && (
            <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full max-w-md flex items-center justify-between">
              <span className="font-medium truncate">{file.name}</span>
              <span className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
            </div>
          )}
        </div>

        {file && !uploadComplete && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-6 rounded-lg transition-colors disabled:opacity-50"
            >
              {isUploading ? 'Uploading...' : 'Upload Dataset'}
            </button>
          </div>
        )}

        {uploadComplete && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">Dataset uploaded and processed successfully.</span>
          </div>
        )}
      </div>

      <div className="mt-12">
        <h3 className="text-lg font-bold mb-4">Recent Uploads</h3>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Filename</th>
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Type</th>
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Date Uploaded</th>
                <th className="p-4 font-medium text-sm text-gray-500 dark:text-gray-400">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              <tr>
                <td className="p-4">population_census_2021.csv</td>
                <td className="p-4">Demographics</td>
                <td className="p-4">Oct 12, 2023</td>
                <td className="p-4 text-green-600 dark:text-green-400 text-sm font-medium">Active</td>
              </tr>
              <tr>
                <td className="p-4">budget_allocation_fy23.csv</td>
                <td className="p-4">Finance</td>
                <td className="p-4">Oct 10, 2023</td>
                <td className="p-4 text-green-600 dark:text-green-400 text-sm font-medium">Active</td>
              </tr>
              <tr>
                <td className="p-4">water_infra_nodes.csv</td>
                <td className="p-4">Infrastructure</td>
                <td className="p-4">Oct 05, 2023</td>
                <td className="p-4 text-green-600 dark:text-green-400 text-sm font-medium">Active</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
