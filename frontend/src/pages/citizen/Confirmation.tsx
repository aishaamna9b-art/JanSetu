import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Copy, Home, Play, Square } from 'lucide-react';
import { motion } from 'framer-motion';

// A simple Confetti component using framer-motion
const Confetti = () => {
  const pieces = Array.from({ length: 30 });
  const colors = ['#f28c28', '#1e7b4f', '#c8553d', '#e9b44c'];
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50 flex justify-center items-center">
      {pieces.map((_, i) => (
        <motion.div
          key={i}
          initial={{ 
            opacity: 1, 
            y: 0, 
            x: 0, 
            scale: 0 
          }}
          animate={{ 
            opacity: 0, 
            y: (Math.random() - 0.5) * 500, 
            x: (Math.random() - 0.5) * 500, 
            scale: [0, 1.5, 0.5],
            rotate: Math.random() * 360
          }}
          transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
          className="absolute w-3 h-3 rounded-sm"
          style={{ backgroundColor: colors[i % colors.length] }}
        />
      ))}
    </div>
  );
};

const Confirmation: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  
  // Data passed via react-router state
  const data = location.state?.data;
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio] = useState(() => data?.confirmation_audio_url ? new Audio(data.confirmation_audio_url) : null);

  useEffect(() => {
    if (audio) {
      audio.onended = () => setIsPlaying(false);
    }
  }, [audio]);

  const toggleAudio = () => {
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      audio.currentTime = 0;
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(id || '');
    // Subtle visual feedback instead of alert
    const btn = document.getElementById('copy-btn');
    if (btn) {
      btn.classList.add('text-secondary-500');
      setTimeout(() => btn.classList.remove('text-secondary-500'), 1000);
    }
  };

  return (
    <div className="p-4 md:p-8 h-full bg-primary-50 bg-kolam flex flex-col items-center justify-center relative overflow-hidden">
      <Confetti />
      
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        className="w-full max-w-md relative"
      >
        {/* Ticket Top */}
        <div className="bg-white rounded-t-3xl shadow-lg border border-primary-100 p-8 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-secondary-500 to-highlight-500"></div>
          
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="w-20 h-20 bg-secondary-500 rounded-full flex items-center justify-center text-white mb-6 shadow-xl shadow-secondary-500/20"
          >
            <Check size={40} strokeWidth={3} />
          </motion.div>
          
          <h1 className="text-3xl font-serif font-bold text-ink mb-2">
            Request Received
          </h1>
          <p className="text-ink/70 mb-6 font-sans">
            {data?.confirmation_message || "We are routing this to the correct department."}
          </p>

          {data && (
            <div className="flex justify-center space-x-3 mb-6">
              <span className="px-3 py-1 bg-primary-50 text-ink/80 rounded-full text-xs font-medium uppercase tracking-wider border border-primary-100">
                {data.category}
              </span>
              <span className="px-3 py-1 bg-accent-500/10 text-accent-500 rounded-full text-xs font-bold uppercase tracking-wider border border-accent-500/20">
                Priority: {data.urgency}/5
              </span>
            </div>
          )}

          {data?.confirmation_audio_url && (
            <button 
              onClick={toggleAudio}
              className="w-full flex items-center justify-center space-x-3 bg-primary-50 py-4 px-6 rounded-2xl hover:bg-primary-100 transition-colors border border-primary-200"
            >
              <div className={`p-2 rounded-full ${isPlaying ? 'bg-accent-500 text-white' : 'bg-primary-600 text-white'}`}>
                {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
              </div>
              <div className="flex-1 flex items-center space-x-1 h-6">
                {/* Fake waveform */}
                {[...Array(12)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ height: isPlaying ? ['20%', '80%', '40%', '100%', '20%'] : '10%' }}
                    transition={{ repeat: Infinity, duration: 0.5 + Math.random() * 0.5 }}
                    className="flex-1 bg-ink/30 rounded-full"
                    style={{ minHeight: '4px' }}
                  />
                ))}
              </div>
            </button>
          )}
        </div>

        {/* Ticket Divider (Punched Edge) */}
        <div className="relative h-8 bg-white border-x border-primary-100">
          <div className="absolute inset-x-0 top-1/2 border-t-2 border-dashed border-primary-200"></div>
          <div className="absolute -left-4 top-1/2 -mt-4 w-8 h-8 bg-primary-50 rounded-full border-r border-primary-100"></div>
          <div className="absolute -right-4 top-1/2 -mt-4 w-8 h-8 bg-primary-50 rounded-full border-l border-primary-100"></div>
        </div>

        {/* Ticket Bottom */}
        <div className="bg-white rounded-b-3xl shadow-lg border border-primary-100 p-8 pt-4">
          <p className="text-xs text-ink/50 text-center font-bold uppercase tracking-widest mb-3">Tracking ID</p>
          <div className="flex items-center justify-between bg-primary-50 p-4 rounded-xl border border-primary-200 shadow-inner">
            <span className="font-mono text-xl font-bold text-ink tracking-widest">{id}</span>
            <button id="copy-btn" onClick={copyToClipboard} className="text-primary-600 p-2 hover:bg-white rounded-lg shadow-sm transition-all hover:scale-110 active:scale-95 border border-transparent hover:border-primary-200">
              <Copy size={20} />
            </button>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/citizen')}
          className="w-full py-4 mt-8 bg-transparent border-2 border-primary-600 text-primary-600 font-bold text-lg rounded-2xl flex justify-center items-center space-x-2 hover:bg-primary-50 transition-colors"
        >
          <Home size={20} />
          <span>Return Home</span>
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Confirmation;
