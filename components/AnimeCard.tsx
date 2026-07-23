
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
  onClick: (anime: Anime) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick, isFavorite = false, onToggleFavorite }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const countdownText = React.useMemo(() => {
    if (!anime.rawAiringTime) return anime.airingTime;
    const now = Math.floor(Date.now() / 1000);
    const diff = anime.rawAiringTime - now;

    if (diff < 0) {
      if (Math.abs(diff) < 3600) return "Airing Now";
      return anime.airingTime;
    }

    const hours = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);

    if (hours > 24) return anime.airingTime;
    if (hours > 0) return `In ${hours}h ${mins}m`;
    return `In ${mins}m`;
  }, [anime.rawAiringTime, anime.airingTime]);

  const isCurrentlyAiring = React.useMemo(() => {
    if (!anime.rawAiringTime) return false;
    const now = Math.floor(Date.now() / 1000);
    return Math.abs(now - anime.rawAiringTime) < 1800;
  }, [anime.rawAiringTime]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="relative h-full" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        whileHover={{ y: -8, scale: 1.02 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        onClick={() => onClick(anime)}
        ref={cardRef}
        className={`group relative flex flex-col bg-slate-900/40 backdrop-blur-2xl rounded-2xl sm:rounded-[1.5rem] overflow-hidden border transition-colors duration-300 cursor-pointer shadow-2xl h-full ${isCurrentlyAiring ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-blue-500/50'}`}
      >
        <div className="relative aspect-[10/14] overflow-hidden">
          <img
            src={anime.image}
            alt={anime.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out"
          />

          {/* Top Badges */}
          <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3 sm:left-3 sm:right-3 flex justify-between items-start z-10 gap-1.5 sm:gap-2">
            <div className="flex flex-col gap-1 sm:gap-1.5">
              {anime.episode > 0 && (
                <span className="bg-blue-600 backdrop-blur-xl text-white text-[8px] sm:text-[10px] font-black uppercase tracking-wider px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg shadow-2xl border border-white/20">
                  EP {anime.episode}
                </span>
              )}
              {isCurrentlyAiring && (
                <span className="bg-red-500 backdrop-blur-xl text-white text-[7px] sm:text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg shadow-2xl animate-pulse flex items-center gap-1 sm:gap-1.5 border border-white/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                  LIVE
                </span>
              )}
            </div>

            <div className="flex gap-2">
              {onToggleFavorite && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite(e);
                  }}
                  className={`w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center transition-all ${isFavorite ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-black/40 text-white/70 hover:text-white hover:bg-black/60'} backdrop-blur-xl border border-white/10`}
                >
                  <i className={`fa-solid fa-heart text-[10px] sm:text-xs ${isFavorite ? 'animate-bounce' : ''}`}></i>
                </button>
              )}
              <span className="bg-black/60 backdrop-blur-xl text-amber-400 text-[9px] sm:text-[11px] font-black px-2 py-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-white/10 flex items-center gap-1 sm:gap-1.5 shadow-2xl shrink-0">
                <i className="fa-solid fa-star text-[8px] sm:text-[10px]"></i> {anime.score > 0 ? anime.score.toFixed(1) : 'NEW'}
              </span>
            </div>
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent opacity-85 group-hover:opacity-95 transition-opacity duration-500" />

          <div className="absolute bottom-0 left-0 right-0 p-3.5 sm:p-5">
            <p className="text-[9px] sm:text-[10px] font-black text-sky-400 uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-1 sm:mb-2 drop-shadow-md truncate">{anime.studio}</p>
            <h3 className="text-white text-xs sm:text-lg font-black font-outfit leading-tight mb-2 sm:mb-3 group-hover:text-blue-200 transition-colors line-clamp-2 drop-shadow-2xl">{anime.title}</h3>
            <div className="flex items-center text-slate-300 text-[10px] sm:text-[11px] font-bold group-hover:text-white transition-colors uppercase tracking-wider">
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-blue-500/20 flex items-center justify-center mr-1.5 sm:mr-2 group-hover:bg-blue-500 transition-colors shrink-0">
                <i className="fa-regular fa-clock text-blue-400 group-hover:text-white text-[8px] sm:text-[9px]"></i>
              </div>
              <span className="truncate">{countdownText}</span>
            </div>
          </div>
        </div>
      </motion.div>


      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95, transition: { duration: 0.2, delay: 0.1 } }}
            className="absolute left-full top-0 ml-4 w-[320px] z-[150] pointer-events-auto hidden xl:block"
          >
            <div className="bg-[#1a1c23] border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative">
              {/* Invisible bridge to allow mouse to move from card to tooltip across the gap */}
              <div className="absolute -left-4 top-0 bottom-0 w-4 pointer-events-auto" />
              
              <h4 className="text-purple-400 font-bold text-lg mb-3 selection:bg-purple-500/30">{anime.title}</h4>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase selection:bg-white/20">{anime.format || 'TV'}</span>
                <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase selection:bg-white/20">HD</span>
                {anime.episode > 0 && <span className="bg-purple-500/20 text-purple-400 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 selection:bg-purple-500/30"><i className="fa-solid fa-closed-captioning"></i> {anime.episode}</span>}
                <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 selection:bg-amber-500/30"><i className="fa-solid fa-microphone"></i> 5</span>
                <span className="bg-white/10 text-[10px] px-2 py-0.5 rounded text-white font-bold uppercase selection:bg-white/20">12</span>
              </div>

              <p className="text-slate-400 text-[12px] leading-relaxed mb-6 line-clamp-4 selection:bg-slate-500/30">
                {anime.description}
              </p>

              <div className="space-y-2 text-[11px] selection:bg-blue-500/20">
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
    </motion.div>
  );
};

export default AnimeCard;
