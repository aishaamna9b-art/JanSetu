import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Camera, Send, Mic, Square, Check } from 'lucide-react';
import { fetchWithAuth } from '../../lib/api';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageSelector } from '../../components/LanguageSelector';

const PIPELINE_STEPS = ["Listening", "Understanding", "Routing to your district"];

const SubmitRequest: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  
  // Status: 'idle' | 'recording' | 'submitting' | 'done'
  const [status, setStatus] = useState<'idle' | 'recording' | 'submitting' | 'done'>('idle');
  const [pipelineStep, setPipelineStep] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [audioLevel, setAudioLevel] = useState(0);

  const startVisualizer = (stream: MediaStream) => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);
    analyser.fftSize = 256;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;

    const draw = () => {
      animationFrameRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < bufferLength; i++) {
        sum += dataArray[i];
      }
      const avg = sum / bufferLength;
      setAudioLevel(avg);
    };
    draw();
  };

  const stopVisualizer = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // Ignore errors when closing
      }
    }
    setAudioLevel(0);
  };

  const handleSubmit = async () => {
    setStatus('submitting');
    setPipelineStep(0);
    
    const formData = new FormData();
    formData.append('language', i18n.language);
    if (text) formData.append('text', text);
    if (audioBlob) {
      formData.append('audio', audioBlob, 'recording.webm');
    }
    
    // Simulate pipeline steps for UX
    const interval = setInterval(() => {
      setPipelineStep(p => Math.min(p + 1, 2));
    }, 1500);

    try {
      const result = await fetchWithAuth('/requests', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(interval);
      setPipelineStep(2);
      setStatus('done');
      
      setTimeout(() => {
        navigate(`/citizen/confirmation/${result.tracking_id}`, { state: { data: result } });
      }, 1000);
      
    } catch (e) {
      console.error(e);
      clearInterval(interval);
      setStatus('idle');
      alert("Failed to submit");
    }
  };

  const toggleRecording = async () => {
    if (status === 'recording') {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      stopVisualizer();
      setStatus('idle');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        chunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setAudioBlob(blob);
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setStatus('recording');
        startVisualizer(stream);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Microphone access is required to record audio.");
      }
    }
  };

  useEffect(() => {
    return () => {
      stopVisualizer();
    };
  }, []);

  // Calculate dynamic scale based on audio volume
  const scale = status === 'recording' ? 1 + (audioLevel / 255) * 0.5 : 1;

  if (status === 'submitting' || status === 'done') {
    return (
      <div className="flex flex-col min-h-full bg-primary-50 bg-kolam p-6 items-center justify-center space-y-12">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="flex flex-col items-center w-full max-w-sm bg-white p-10 rounded-[2rem] shadow-layered border border-primary-100"
        >
          {status === 'done' ? (
            <motion.div 
              initial={{ scale: 0, rotate: -90 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", damping: 12, stiffness: 100 }}
              className="w-32 h-32 rounded-full bg-secondary-500 flex items-center justify-center text-white mb-8 shadow-xl shadow-secondary-500/30"
            >
              <Check size={64} strokeWidth={3} />
            </motion.div>
          ) : (
            <div className="w-32 h-32 relative mb-8 flex items-center justify-center bg-primary-50 rounded-full">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="absolute inset-0 border-[6px] border-primary-200 border-t-primary-500 rounded-full"
              />
              <Mic size={40} className="text-primary-500" />
            </div>
          )}

          <div className="w-full space-y-8 mt-4">
            {PIPELINE_STEPS.map((step, idx) => {
              const isPast = pipelineStep > idx;
              const isCurrent = pipelineStep === idx;
              return (
                <div key={idx} className="flex items-center gap-5 relative">
                  <div className="relative flex flex-col items-center">
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{
                        backgroundColor: isPast || isCurrent ? 'var(--color-secondary-500)' : 'var(--color-primary-100)',
                        scale: isCurrent && status !== 'done' ? [1, 1.25, 1] : 1,
                        boxShadow: isCurrent && status !== 'done' ? '0 0 20px rgba(30,123,79,0.4)' : 'none'
                      }}
                      transition={{ repeat: isCurrent && status !== 'done' ? Infinity : 0, duration: 1.5 }}
                      className={`w-8 h-8 rounded-full flex items-center justify-center z-10 relative ${isPast || isCurrent ? 'text-white' : 'text-transparent'}`}
                    >
                      <Check size={16} strokeWidth={3} />
                    </motion.div>
                    {idx < PIPELINE_STEPS.length - 1 && (
                      <div className={`absolute top-8 w-1 h-12 ${isPast ? 'bg-secondary-500' : 'bg-primary-100'}`} />
                    )}
                  </div>
                  <motion.span 
                    animate={{ 
                      opacity: isPast || isCurrent ? 1 : 0.3,
                      y: isCurrent ? -2 : 0,
                    }}
                    className={`text-lg font-sans ${isCurrent ? 'font-bold text-ink' : 'font-medium text-ink'}`}
                  >
                    {t(step, step)}
                  </motion.span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 flex flex-col min-h-full bg-primary-50 items-center justify-start max-w-2xl mx-auto w-full pb-24 relative overflow-hidden">
      {/* Decorative Background */}
      <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-accent-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[20%] right-[-10%] w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full flex justify-between items-center mb-10 relative z-10">
        <div>
          <h1 className="text-4xl font-serif font-bold text-ink tracking-tight">{t('submit')}</h1>
          <p className="text-ink/60 font-sans mt-1">Speak or type your concern</p>
        </div>
        <LanguageSelector />
      </div>
      
      <div className="flex-1 flex flex-col items-center w-full justify-center space-y-14 relative z-10">
        
        {/* Voice Orb */}
        <div className="relative flex justify-center items-center w-64 h-64 shrink-0">
          {/* Subtle static pulse rings */}
          <div className="absolute inset-0 rounded-full border border-primary-200/50 scale-110" />
          <div className="absolute inset-0 rounded-full border border-primary-200/30 scale-125" />

          <AnimatePresence>
            {status === 'recording' && (
              <>
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.15, scale: scale * 1.6 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.2 }}
                  className="absolute inset-0 bg-accent-500 rounded-full blur-md"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 0.3, scale: scale * 1.3 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", bounce: 0, duration: 0.1 }}
                  className="absolute inset-0 bg-accent-500 rounded-full"
                />
              </>
            )}
          </AnimatePresence>
          
          <motion.button 
            onClick={toggleRecording}
            animate={{ 
              scale: status === 'idle' ? [1, 1.05, 1] : scale,
              boxShadow: status === 'idle' ? ["0px 10px 30px rgba(0,0,0,0.05)", "0px 15px 40px rgba(242, 140, 40, 0.15)", "0px 10px 30px rgba(0,0,0,0.05)"] : "0px 0px 40px rgba(200, 85, 61, 0.5)",
            }}
            transition={{
              repeat: status === 'idle' ? Infinity : 0,
              duration: status === 'idle' ? 3 : 0.1,
              ease: "easeInOut"
            }}
            className={`relative z-10 w-40 h-40 rounded-full flex flex-col items-center justify-center transition-colors shadow-layered ${status === 'recording' ? 'bg-accent-500 text-white' : 'bg-white border-4 border-primary-50 text-primary-500 hover:border-primary-100'}`}
          >
            {status === 'recording' ? <Square size={48} fill="currentColor" /> : <Mic size={56} />}
          </motion.button>
        </div>

        {status === 'recording' && (
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-accent-500 font-bold font-sans tracking-wide uppercase text-sm"
          >
            Listening to your voice...
          </motion.p>
        )}
        
        {status === 'idle' && audioBlob && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md bg-white/80 backdrop-blur p-4 rounded-3xl shadow-sm border border-primary-200 flex flex-col items-center space-y-3"
          >
            <audio src={URL.createObjectURL(audioBlob)} controls className="w-full" />
            <button onClick={() => setAudioBlob(null)} className="text-sm text-accent-500 font-bold hover:underline uppercase tracking-wide">Retake Audio</button>
          </motion.div>
        )}

        {/* Secondary Inputs */}
        <div className="w-full max-w-md bg-white/80 backdrop-blur rounded-3xl shadow-lg shadow-primary-500/5 border border-primary-200 overflow-hidden shrink-0 transition-all focus-within:shadow-primary-500/10 focus-within:border-primary-300">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full p-6 h-36 resize-none focus:outline-none text-lg text-ink placeholder:text-ink/40 font-serif bg-transparent leading-relaxed"
            placeholder="Or type your problem here..."
          ></textarea>
          <div className="bg-primary-50/80 border-t border-primary-100 p-4 flex justify-between items-center">
            <button className="px-5 py-2.5 text-ink/70 hover:text-primary-600 bg-white rounded-xl shadow-sm border border-primary-200 flex items-center space-x-2 transition-colors">
              <Camera size={18} />
              <span className="font-bold text-sm">Add Photo</span>
            </button>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSubmit}
          disabled={!text && !audioBlob}
          className="w-full max-w-md py-4 bg-ink text-white font-bold text-xl rounded-2xl shadow-xl shadow-ink/20 disabled:bg-primary-200 disabled:text-primary-400 disabled:shadow-none flex justify-center items-center space-x-3 transition-all shrink-0 mb-4"
        >
          <span>Submit Request</span>
          <Send size={22} />
        </motion.button>
      </div>
    </div>
  );
};

export default SubmitRequest;
