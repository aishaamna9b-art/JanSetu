import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Download, Home } from 'lucide-react';
import { jsPDF } from 'jspdf';

const RegisterSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const profile = location.state?.data;

  if (!profile) {
    return <div className="p-8 text-center"><button onClick={() => navigate('/citizen')} className="text-blue-600 underline">Go Home</button></div>;
  }

  const handleDownload = () => {
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("JanSetu Registration Acknowledgement", 20, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(`Name: ${profile.personal.full_name}`, 20, 40);
    doc.text(`Registration ID: ${profile.registration_id}`, 20, 50);
    doc.text(`District: ${profile.address.district}`, 20, 60);
    doc.text(`State: ${profile.address.state}`, 20, 70);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, 80);
    
    doc.save(`JanSetu_Registration_${profile.registration_id}.pdf`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 font-sans items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden relative">
        <div className="h-2 w-full bg-gradient-to-r from-orange-500 via-white to-green-500 absolute top-0 left-0" />
        
        <div className="p-8 text-center pt-12">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          
          <h1 className="text-2xl font-serif font-bold text-gray-900 mb-2">Registration Successful</h1>
          <p className="text-gray-600 mb-8">Your citizen profile has been verified and created.</p>
          
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-8 text-left">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Registration ID</p>
            <p className="font-mono text-xl font-bold text-gray-900">{profile.registration_id}</p>
            <div className="h-px bg-gray-200 my-3" />
            <div className="flex justify-between">
              <div>
                <p className="text-xs text-gray-500 mb-1">Name</p>
                <p className="font-medium text-gray-900">{profile.personal.full_name}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">District</p>
                <p className="font-medium text-gray-900">{profile.address.district}</p>
              </div>
            </div>
          </div>
          
          <button onClick={handleDownload} className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg transition-colors mb-4 border border-gray-300">
            <Download size={20} />
            <span>Download Acknowledgement (PDF)</span>
          </button>
          
          <button onClick={() => navigate('/citizen')} className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors shadow">
            <Home size={20} />
            <span>Go to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default RegisterSuccess;
