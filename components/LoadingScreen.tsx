import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  isLoading: boolean;
}

const FEATURED_ANIME_POSTERS = [
  {
    title: "Solo Leveling",
    tagline: "Arise! System Syncing...",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx151807-635p9I022o46.jpg",
    color: "from-blue-600 via-indigo-600 to-cyan-400"
  },
  {
    title: "Frieren: Beyond Journey's End",
    tagline: "Unlocking Ancient Magic Signals...",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx154587-nC23L9zOfR3f.jpg",
    color: "from-sky-500 via-teal-500 to-emerald-400"
  },
  {
    title: "Jujutsu Kaisen",
    tagline: "Expanding Domain Connection...",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx127230-22cst057u7r6.jpg",
    color: "from-purple-600 via-fuchsia-600 to-pink-500"
  },
  {
    title: "Demon Slayer: Hashira Training",
    tagline: "Breathing Technique: Signal Stream!",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx145135-2B8u2n7n4535.jpg",
    color: "from-amber-500 via-orange-600 to-red-500"
  },
  {
    title: "Re:Zero - Starting Life in Another World",
    tagline: "Resetting Timeline Timetables...",
    image: "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx163131-B27UvInPjF6j.jpg",
    color: "from-violet-600 via-purple-600 to-indigo-500"
  }
];

const KANJI_PARTICLES = [
  { text: "アニメ", label: "Anime", left: "10%", duration: 4 },
  { text: "放送中", label: "Airing", left: "22%", duration: 5 },
  { text: "限界突破", label: "Limit Break", left: "78%", duration: 4.5 },
  { text: "未来", label: "Future", left: "88%", duration: 3.8 },
  { text: "召喚", label: "Summon", left: "50%", duration: 4.2 }
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  const [posterIndex, setPosterIndex] = useState(0);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (!isLoading) return;

    // Cycle through anime posters
    const posterInterval = setInterval(() => {
      setPosterIndex(prev => (prev + 1) % FEATURED_ANIME_POSTERS.length);
    }, 1200);

    // Progress bar speed
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 96) return 96;
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 150);

    return () => {
      clearInterval(posterInterval);
      clearInterval(progressInterval);
    };
  }, [isLoading]);

  const currentAnime = FEATURED_ANIME_POSTERS[posterIndex];

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          key="loading-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.08 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999] bg-[#020617] flex flex-col items-center justify-center p-4 sm:p-6 overflow-hidden select-none"
        >
          {/* Speed Lines Effect */}
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-400 via-transparent to-transparent"></div>

          {/* Floating Kanji Floating Particles */}
          {KANJI_PARTICLES.map((particle, idx) => (
            <motion.div
              key={idx}
              initial={{ y: "100vh", opacity: 0, scale: 0.8 }}
              animate={{
                y: "-10vh",
                opacity: [0, 0.4, 0.8, 0.4, 0],
                scale: [0.8, 1.2, 0.9]
              }}
              transition={{
                duration: particle.duration,
                repeat: Infinity,
                delay: idx * 0.7,
                ease: "linear"
              }}
              style={{ left: particle.left }}
              className="absolute text-blue-500/20 font-black text-2xl sm:text-4xl pointer-events-none tracking-widest blur-[0.5px]"
            >
              {particle.text}
            </motion.div>
          ))}

          {/* Rotating Magic Circle Array (Anime Summoning Array) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] sm:w-[480px] sm:h-[480px] pointer-events-none">
            <motion.svg
              animate={{ rotate: 360 }}
              transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
              className="w-full h-full opacity-20 text-blue-400"
              viewBox="0 0 200 200"
            >
              <circle cx="100" cy="100" r="95" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              <circle cx="100" cy="100" r="85" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <polygon points="100,15 173,142 27,142" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <polygon points="100,185 27,58 173,58" fill="none" stroke="currentColor" strokeWidth="0.8" />
              <circle cx="100" cy="100" r="50" fill="none" stroke="currentColor" strokeWidth="1" />
            </motion.svg>
          </div>

          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] sm:w-[400px] sm:h-[400px] pointer-events-none">
            <motion.svg
              animate={{ rotate: -360 }}
              transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
              className="w-full h-full opacity-15 text-indigo-400"
              viewBox="0 0 200 200"
            >
              <circle cx="100" cy="100" r="75" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 6" />
              <rect x="50" y="50" width="100" height="100" fill="none" stroke="currentColor" strokeWidth="0.8" transform="rotate(45 100 100)" />
            </motion.svg>
          </div>

          {/* Ambient Glowing Background Orbs */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse"></div>

          {/* Main Card & Anime Display Container */}
          <div className="relative flex flex-col items-center max-w-md w-full text-center z-10 px-2">
            
            {/* Animated Anime Character Frame Carousel */}
            <div className="relative mb-6 sm:mb-8 group">
              {/* Outer Glow aura matching current anime theme */}
              <motion.div
                key={currentAnime.title + "-glow"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.6 }}
                className={`absolute -inset-4 sm:-inset-6 rounded-[2.5rem] bg-gradient-to-r ${currentAnime.color} opacity-50 blur-2xl pointer-events-none`}
              />

              {/* Poster Card Container */}
              <div className="relative w-36 h-52 sm:w-44 sm:h-64 rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-b from-white/20 via-white/5 to-transparent shadow-2xl border border-white/20 overflow-hidden bg-slate-950/80 backdrop-blur-xl">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentAnime.title}
                    initial={{ opacity: 0, scale: 1.15, rotateY: 20 }}
                    animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                    exit={{ opacity: 0, scale: 0.85, rotateY: -20 }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full h-full relative rounded-xl sm:rounded-2xl overflow-hidden"
                  >
                    <img
                      src={currentAnime.image}
                      alt={currentAnime.title}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        // Fallback placeholder image if hotlink fails
                        (e.target as HTMLImageElement).src = "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&auto=format&fit=crop&q=80";
                      }}
                      className="w-full h-full object-cover"
                    />
                    {/* Dark gradient overlay for title legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

                    {/* Anime Title & Badge on Image */}
                    <div className="absolute bottom-3 left-3 right-3 text-left">
                      <span className="inline-block px-2 py-0.5 rounded-full bg-blue-500/80 backdrop-blur-md text-[8px] font-black uppercase text-white tracking-widest mb-1 shadow-lg">
                        Featured Signal
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-white leading-tight truncate drop-shadow-md">
                        {currentAnime.title}
                      </h3>
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Floating Chibi / Star Badge on top corner */}
                <motion.div
                  animate={{ y: [-2, 4, -2], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-3 -right-3 w-9 h-9 sm:w-10 sm:h-10 bg-gradient-to-tr from-amber-400 to-yellow-300 rounded-full flex items-center justify-center text-slate-950 font-black shadow-lg border-2 border-slate-900 z-20 text-sm"
                >
                  <i className="fa-solid fa-wand-magic-sparkles text-xs"></i>
                </motion.div>
              </div>
            </div>

            {/* Brand Title */}
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.25em] text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                <i className="fa-solid fa-sparkles mr-1.5 text-amber-400"></i>
                Broadcast Radar
              </span>
            </div>

            <motion.h1
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-2xl sm:text-3xl font-black font-outfit text-white tracking-tight mb-1"
            >
              AniFlow<span className="text-blue-500">.</span>
            </motion.h1>

            {/* Dynamic Hype Tagline */}
            <div className="h-6 flex items-center justify-center mb-6 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentAnime.tagline}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-xs sm:text-sm font-bold text-slate-300 font-outfit"
                >
                  {currentAnime.tagline}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Progress Bar with Animated Running Chibi Mascot */}
            <div className="w-full bg-slate-900/90 border border-slate-800 rounded-2xl p-2 shadow-2xl mb-3 backdrop-blur-md relative">
              <div className="h-3 w-full bg-slate-950 rounded-xl overflow-hidden relative">
                {/* Glowing fill */}
                <motion.div
                  className={`h-full bg-gradient-to-r ${currentAnime.color} rounded-xl relative`}
                  initial={{ width: '5%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "easeOut", duration: 0.25 }}
                >
                  {/* Leading sparkle effect */}
                  <div className="absolute right-0 top-0 bottom-0 w-3 bg-white/60 blur-[2px] rounded-r-xl animate-pulse"></div>
                </motion.div>
              </div>

              {/* Running Chibi Icon tracking top of progress bar */}
              <motion.div
                className="absolute -top-4 -translate-x-1/2 pointer-events-none flex flex-col items-center"
                style={{ left: `calc(${Math.max(8, Math.min(progress, 92))}% + 8px)` }}
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 text-white flex items-center justify-center text-[10px] shadow-lg border border-white/30">
                  <i className="fa-solid fa-person-running text-xs animate-pulse"></i>
                </div>
              </motion.div>
            </div>

            {/* Percentage & Status indicator */}
            <div className="w-full flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1">
              <span className="flex items-center gap-1.5 text-blue-400">
                <i className="fa-solid fa-circle-notch animate-spin text-[9px]"></i>
                Fetching Live Anime Streams
              </span>
              <span className="text-white font-mono font-black">{Math.min(progress, 100)}%</span>
            </div>
          </div>

          {/* Footer branding tag */}
          <div className="absolute bottom-5 text-[9px] font-bold uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
            <i className="fa-solid fa-[#020617] fa-tv text-blue-500"></i>
            AniFlow Seasonal Discovery Network
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

