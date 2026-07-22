import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isLoading: boolean;
}

const LOADING_STEPS = [
  "Connecting to AniList Servers...",
  "Syncing Broadcast Timetables...",
  "Scanning Seasonal Schedules...",
  "Rendering AniFlow Interface..."
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (!isLoading) return;

    const stepInterval = setInterval(() => {
      setCurrentStep(prev => (prev + 1) % LOADING_STEPS.length);
    }, 800);

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return 95;
        return prev + Math.floor(Math.random() * 15) + 5;
      });
    }, 200);

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999] bg-[#020617] flex flex-col items-center justify-center p-6 overflow-hidden select-none"
        >
          {/* Glowing background orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>

          {/* Center Brand & Radar */}
          <div className="relative flex flex-col items-center max-w-sm w-full text-center z-10">
            {/* Animated Radar Pulse Logo */}
            <div className="relative mb-8 sm:mb-10">
              {/* Outer Pulsing Rings */}
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.6, 0.2] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -inset-4 sm:-inset-6 rounded-3xl bg-blue-500/20 border border-blue-400/30 blur-sm"
              />
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
                className="absolute -inset-2 sm:-inset-3 rounded-2xl bg-indigo-500/20 border border-indigo-400/40"
              />

              {/* Main Badge */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 p-0.5 shadow-[0_0_50px_rgba(37,99,235,0.5)] flex items-center justify-center relative z-10">
                <div className="w-full h-full bg-[#030712] rounded-[0.95rem] sm:rounded-[1.4rem] flex flex-col items-center justify-center relative overflow-hidden">
                  <i className="fa-solid fa-[#020617] fa-tv text-2xl sm:text-3xl text-blue-400 mb-0.5 animate-pulse"></i>
                  <span className="text-[10px] font-black text-white tracking-widest uppercase">AniFlow</span>
                </div>
              </div>
            </div>

            {/* Title */}
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl font-black font-outfit text-white tracking-tight mb-2"
            >
              AniFlow<span className="text-blue-500">.</span>
            </motion.h1>

            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-[0.25em] mb-8 sm:mb-10"
            >
              Next-Gen Anime Timetable
            </motion.p>

            {/* Progress Bar Container */}
            <div className="w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-1.5 shadow-2xl mb-4 backdrop-blur-md">
              <div className="h-2 w-full bg-slate-950 rounded-xl overflow-hidden relative">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-sky-400 rounded-xl"
                  initial={{ width: '5%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.3 }}
                />
              </div>
            </div>

            {/* Animated Status Text */}
            <div className="h-6 flex items-center justify-center overflow-hidden">
              <motion.p
                key={currentStep}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-[10px] sm:text-xs font-semibold text-blue-400 tracking-wider flex items-center gap-2"
              >
                <i className="fa-solid fa-circle-notch animate-spin text-[10px]"></i>
                {LOADING_STEPS[currentStep]}
              </motion.p>
            </div>
          </div>

          {/* Footer branding tag */}
          <div className="absolute bottom-6 text-[9px] font-bold uppercase tracking-[0.3em] text-slate-600">
            Powered by AniList Broadcast Network
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
