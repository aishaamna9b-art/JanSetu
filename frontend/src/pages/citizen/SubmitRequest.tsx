import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Send, Mic, Square } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

const SubmitRequest: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'understanding' | 'done'>('idle');

  const handleSubmit = async () => {
    setStatus('uploading');
    
    // Create form data (mock implementation for phase 1/2)
    const formData = new FormData();
    formData.append('language', i18n.language);
    if (text) formData.append('text', text);
    
    setTimeout(async () => {
      setStatus('understanding');
      try {
        const result = await fetchWithAuth('/requests', {
          method: 'POST',
          body: formData,
        });
        
        setStatus('done');
        setTimeout(() => {
          navigate(`/citizen/confirmation/${result.tracking_id}`, { state: { data: result } });
        }, 1000);
      } catch (e) {
        console.error(e);
        setStatus('idle');
        alert("Failed to submit");
      }
    }, 1500); // Simulate upload delay
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Real implementation would use MediaRecorder API
  };

  if (status !== 'idle') {
    return (
      <div className="p-4 h-full flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-2xl font-bold text-gray-800 text-center">
          {t(status)}
        </h2>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col h-full bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('submit')}</h1>
      
      <div className="flex-1 flex flex-col space-y-6">
        <div className="flex justify-center my-6">
          <button 
            onClick={toggleRecording}
            className={`w-32 h-32 rounded-full flex items-center justify-center shadow-lg transition-colors ${isRecording ? 'bg-red-500 animate-pulse text-white' : 'bg-primary-500 text-white'}`}
          >
            {isRecording ? <Square size={48} /> : <Mic size={48} />}
          </button>
        </div>
        
        {isRecording && <p className="text-center text-red-500 font-bold animate-pulse">Recording...</p>}

        <div className="w-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-4 h-32 resize-none focus:outline-none text-lg"
            placeholder="Or type your problem here..."
          ></textarea>
          <div className="bg-gray-50 border-t border-gray-100 p-2 flex justify-between items-center">
            <button className="p-3 text-gray-500 hover:text-primary-600 bg-white rounded-lg shadow-sm border border-gray-200 flex items-center space-x-2">
              <Camera size={20} />
              <span className="font-medium text-sm">{t('add_photo')}</span>
            </button>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!text && !isRecording}
        className="w-full py-4 mt-6 bg-primary-600 text-white font-bold text-lg rounded-xl shadow-md disabled:bg-gray-300 disabled:shadow-none flex justify-center items-center space-x-2"
      >
        <span>{t('submit')}</span>
        <Send size={20} />
      </button>
    </div>
  );
};

export default SubmitRequest;
