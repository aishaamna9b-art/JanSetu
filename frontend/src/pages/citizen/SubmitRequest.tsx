import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Send, Mic, Square } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';

const SubmitRequest: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'understanding' | 'done'>('idle');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const handleSubmit = async () => {
    setStatus('uploading');
    
    const formData = new FormData();
    formData.append('language', i18n.language);
    if (text) formData.append('text', text);
    if (audioBlob) {
      formData.append('audio', audioBlob, 'recording.webm');
    }
    
    setStatus('understanding');
    try {
      const result = await fetchWithAuth('/requests', {
        method: 'POST',
        body: formData,
      });
      
      setStatus('done');
      navigate(`/citizen/confirmation/${result.tracking_id}`, { state: { data: result } });
    } catch (e) {
      console.error(e);
      setStatus('idle');
      alert("Failed to submit");
    }
  };

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access is required to record audio.");
      }
    }
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
        {!isRecording && audioBlob && (
          <div className="flex flex-col items-center space-y-2">
            <audio src={URL.createObjectURL(audioBlob)} controls className="h-10 w-full max-w-xs" />
            <button onClick={() => setAudioBlob(null)} className="text-sm text-red-500 underline">Remove Audio</button>
          </div>
        )}

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
        disabled={!text && !isRecording && !audioBlob}
        className="w-full py-4 mt-6 bg-primary-600 text-white font-bold text-lg rounded-xl shadow-md disabled:bg-gray-300 disabled:shadow-none flex justify-center items-center space-x-2"
      >
        <span>{t('submit')}</span>
        <Send size={20} />
      </button>
    </div>
  );
};

export default SubmitRequest;
