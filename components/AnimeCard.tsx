
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
  onClick: (anime: Anime) => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const isCurrentlyAiring = React.useMemo(() => {
    if (!anime.rawAiringTime) return false;
    const now = Math.floor(Date.now() / 1000);
    return Math.abs(now - anime.rawAiringTime) < 1800;
  }, [anime.rawAiringTime]);

  return (
    <div className="relative h-full" onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
      <motion.div
        whileHover={{ y: -10, scale: 1.02 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={() => onClick(anime)}
        ref={cardRef}
        className={`group relative flex flex-col bg-slate-900/40 backdrop-blur-2xl rounded-2xl sm:rounded-[2.5rem] overflow-hidden border transition-colors duration-300 cursor-pointer shadow-2xl h-full ${isCurrentlyAiring ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-blue-500/50'}`}
      >
        <div className="relative aspect-[10/15] overflow-hidden">
          <img
            src={anime.image}
            alt={anime.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out"
          />

          <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-4 sm:left-4 sm:right-4 flex justify-between items-start z-10 gap-1.5 sm:gap-2">
            <div className="flex flex-col gap-1 sm:gap-2">
              {anime.episode > 0 && (
                <span className="bg-blue-600 backdrop-blur-xl text-white text-[8px] sm:text-[11px] font-black uppercase tracking-wider sm:tracking-widest px-2 py-1 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl shadow-2xl border border-white/20">
                  EP {anime.episode}
                </span>
              )}
              {isCurrentlyAiring && (
                <span className="bg-red-500 backdrop-blur-xl text-white text-[7px] sm:text-[9px] font-black uppercase tracking-wider sm:tracking-widest px-1.5 py-0.5 sm:px-3 sm:py-1.5 rounded-lg sm:rounded-xl shadow-2xl animate-pulse flex items-center gap-1 sm:gap-2 border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  LIVE
                </span>
              )}
            </div>

            <span className="bg-black/60 backdrop-blur-xl text-amber-400 text-[9px] sm:text-xs font-black px-2 py-1 sm:px-3.5 sm:py-2 rounded-lg sm:rounded-xl border border-white/10 flex items-center gap-1 sm:gap-2 shadow-2xl shrink-0">
              <i className="fa-solid fa-star text-[8px] sm:text-xs"></i> {anime.score > 0 ? anime.score.toFixed(1) : 'NEW'}
            </span>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-500" />

          <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-9">
            <p className="text-[9px] sm:text-xs font-black text-sky-400 uppercase tracking-[0.15em] sm:tracking-[0.25em] mb-1 sm:mb-3 drop-shadow-md truncate">{anime.studio}</p>
            <h3 className="text-white text-xs sm:text-2xl font-black font-outfit leading-tight mb-2 sm:mb-5 group-hover:text-blue-200 transition-colors line-clamp-2 drop-shadow-2xl">{anime.title}</h3>
            <div className="flex items-center text-slate-300 text-[10px] sm:text-[13px] font-bold group-hover:text-white transition-colors uppercase tracking-wider sm:tracking-widest">
              <div className="w-5 h-5 sm:w-8 sm:h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-1.5 sm:mr-3 group-hover:bg-blue-500 transition-colors shrink-0">
                <i className="fa-regular fa-clock text-blue-400 group-hover:text-white text-[8px] sm:text-[10px]"></i>
              </div>
              <span className="truncate">{anime.airingTime}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="absolute left-full top-0 ml-4 w-[320px] z-[150] pointer-events-none hidden xl:block"
          >
            <div className="bg-[#1a1c23] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl">
              <h4 className="text-purple-400 font-bold text-lg mb-3">{anime.title}</h4>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase">{anime.format || 'TV'}</span>
                <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase">HD</span>
                {anime.episode > 0 && <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1"><i className="fa-solid fa-closed-captioning"></i> {anime.episode}</span>}
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1"><i className="fa-solid fa-microphone"></i> 5</span>
                <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase">12</span>
              </div>

              <p className="text-slate-400 text-[12px] leading-relaxed mb-6 line-clamp-4">
                {anime.description}
              </p>

              <div className="space-y-2 text-[11px]">
                <div className="flex gap-2">
                  <span className="text-slate-500 shrink-0">Other names:</span>
                  <span className="text-slate-300 truncate">{anime.synonyms?.join(', ') || 'N/A'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 shrink-0">Scores:</span>
                  <span className="text-slate-300">{anime.score > 0 ? (anime.score * 1).toFixed(1) : 'N/A'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 shrink-0">Aired:</span>
                  <span className="text-slate-300">{anime.startDate} to {anime.endDate}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 shrink-0">Duration:</span>
                  <span className="text-slate-300">{anime.duration ? `${anime.duration} min` : 'N/A'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 shrink-0">Status:</span>
                  <span className="text-slate-300 capitalize">{anime.status?.toLowerCase().replace(/_/g, ' ')}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-slate-500 shrink-0">Genre:</span>
                  <div className="flex flex-wrap gap-x-2">
                    {anime.genres.slice(0, 5).map(g => (
                      <span key={g} className="text-purple-400">{g}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AnimeCard;
