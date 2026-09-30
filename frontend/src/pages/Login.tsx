import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, User } from 'lucide-react';
import { LanguageSelector } from '../components/LanguageSelector';

const phrases = [
  "Your voice. Your village. Your future.",
  "आपकी आवाज़। आपका गाँव। आपका भविष्य।",
  "உங்கள் குரல். உங்கள் கிராமம். உங்கள் எதிர்காலம்.",
  "మీ వాయిస్. మీ గ్రామం. మీ భవిష్యత్తు.",
  "আপনার কণ্ঠ। আপনার গ্রাম। আপনার ভবিষ্যৎ।",
  "ನಿಮ್ಮ ಧ್ವನಿ. ನಿಮ್ಮ ಹಳ್ಳಿ. ನಿಮ್ಮ ಭವಿಷ್ಯ."
];

const DotPattern = () => (
  <svg width="100%" height="100%" className="absolute inset-0 pointer-events-none">
    <defs>
      <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="1.5" fill="currentColor" className="opacity-30" />
      </pattern>
    </defs>
    <rect x="0" y="0" width="100%" height="100%" fill="url(#dots)" />
  </svg>
);

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleCitizenLogin = () => {
    localStorage.setItem('mock_role', 'citizen');
    window.location.href = '/citizen';
  };

  const handleOfficerLogin = () => {
    localStorage.setItem('mock_role', 'officer');
    window.location.href = '/officer';
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-primary-50 dark:bg-dark-bg font-sans overflow-hidden">
      
      {/* Left Side - Branding & Multilingual Animated Text */}
      <div className="relative flex-1 bg-ink text-primary-50 flex flex-col justify-center items-center p-12 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0">
          <motion.div 
            animate={{ 
              backgroundPosition: ['0px 0px', '30px 30px'],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            className="w-[200%] h-[200%] text-primary-500/40 absolute -top-1/2 -left-1/2"
            style={{ transform: "rotate(-10deg)" }}
          >
            <DotPattern />
          </motion.div>
          {/* Subtle gradient overlay to mask edges and create the 'abstract map' illusion */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-ink/80 to-ink"></div>
        </div>

        <div className="relative z-10 w-full max-w-lg text-center md:text-left">
          <h1 className="text-4xl md:text-5xl lg:text-7xl font-serif font-bold mb-6 tracking-tight">
            JanSetu
          </h1>
          <div className="h-24 md:h-32 relative">
            <AnimatePresence mode="wait">
              <motion.h2
                key={phraseIndex}
                initial={{ opacity: 0, y: 15, filter: 'blur(8px)', scale: 0.95 }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)', scale: 1 }}
                exit={{ opacity: 0, y: -15, filter: 'blur(8px)', scale: 1.05 }}
                transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
                className="text-2xl md:text-3xl lg:text-4xl font-medium text-primary-100 leading-snug absolute top-0 left-0 w-full"
              >
                {phrases[phraseIndex]}
              </motion.h2>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Right Side - Login Card */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 md:p-12 relative z-10 bg-primary-50 dark:bg-dark-bg">
        <div className="absolute top-6 right-6">
          <LanguageSelector />
        </div>

        <div className="w-full max-w-md space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-serif font-bold text-ink dark:text-primary-50 mb-3">Welcome</h2>
            <p className="text-ink/70 dark:text-primary-100/70 font-medium">Choose your portal to continue</p>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <motion.button
              layoutId="citizen-tile"
              whileHover={{ scale: 1.03, y: -6, boxShadow: '0 20px 40px -10px rgba(242, 140, 40, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCitizenLogin}
              className="group relative flex flex-col items-center justify-center p-8 bg-white dark:bg-ink/60 border border-primary-500/20 dark:border-primary-500/30 rounded-[2rem] shadow-layered transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 via-primary-500/5 to-primary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-primary-50 dark:bg-ink p-5 rounded-full mb-4 shadow-sm group-hover:shadow-md transition-all duration-300">
                <User size={44} className="text-primary-600 dark:text-primary-400 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.75} />
              </div>
              <h3 className="relative text-2xl font-bold text-ink dark:text-primary-50 font-serif">Citizen</h3>
              <p className="relative mt-2 text-sm text-ink/60 dark:text-primary-100/60 text-center font-medium">
                Submit requests and track village development
              </p>
            </motion.button>

            <motion.button
              layoutId="officer-tile"
              whileHover={{ scale: 1.03, y: -6, boxShadow: '0 20px 40px -10px rgba(30, 123, 79, 0.2)' }}
              whileTap={{ scale: 0.98 }}
              onClick={handleOfficerLogin}
              className="group relative flex flex-col items-center justify-center p-8 bg-white dark:bg-ink/60 border border-secondary-500/20 dark:border-secondary-500/30 rounded-[2rem] shadow-layered transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-secondary-500/0 via-secondary-500/5 to-secondary-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative bg-primary-50 dark:bg-ink p-5 rounded-full mb-4 shadow-sm group-hover:shadow-md transition-all duration-300">
                <Shield size={44} className="text-secondary-500 dark:text-secondary-400 group-hover:scale-110 transition-transform duration-300" strokeWidth={1.75} />
              </div>
              <h3 className="relative text-2xl font-bold text-ink dark:text-primary-50 font-serif">Officer</h3>
              <p className="relative mt-2 text-sm text-ink/60 dark:text-primary-100/60 text-center font-medium">
                Monitor hotspots and allocate budgets
              </p>
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
