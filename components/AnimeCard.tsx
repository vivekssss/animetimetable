
import * as React from 'react';
import { motion } from 'framer-motion';
import { Anime } from '../types';

interface AnimeCardProps {
  anime: Anime;
  onClick: (anime: Anime) => void;
}

const AnimeCard: React.FC<AnimeCardProps> = ({ anime, onClick }) => {
  const isCurrentlyAiring = React.useMemo(() => {
    if (!anime.rawAiringTime) return false;
    const now = Math.floor(Date.now() / 1000);
    // Within 30 mins of airing time
    return Math.abs(now - anime.rawAiringTime) < 1800; 
  }, [anime.rawAiringTime]);

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      whileHover={{ y: -10 }}
      onClick={() => onClick(anime)}
      className={`group relative flex flex-col bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] overflow-hidden border transition-all duration-500 cursor-pointer shadow-2xl ${isCurrentlyAiring ? 'border-blue-500/50 ring-2 ring-blue-500/20' : 'border-white/5 hover:border-blue-500/30'}`}
    >
      <div className="relative aspect-[10/14] overflow-hidden">
        <img 
          src={anime.image} 
          alt={anime.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
        />
        
        {/* Badges Overlay */}
        <div className="absolute top-5 left-5 flex flex-col gap-2.5 z-10">
          {anime.episode > 0 && (
            <span className="bg-blue-600/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl border border-white/10">
              EP {anime.episode}
            </span>
          )}
          {isCurrentlyAiring && (
            <span className="bg-red-500/90 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl animate-pulse flex items-center gap-2 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
              LIVE
            </span>
          )}
        </div>

        <div className="absolute top-5 right-5 z-10">
          <span className="bg-black/60 backdrop-blur-md text-amber-400 text-[10px] font-black px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2 shadow-2xl">
            <i className="fa-solid fa-star"></i> {anime.score > 0 ? anime.score.toFixed(1) : 'NEW'}
          </span>
        </div>

        {/* Shadow Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />
        
        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-7">
          <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-2">{anime.studio}</p>
          <h3 className="text-white text-base sm:text-lg font-black font-outfit leading-tight mb-4 group-hover:text-blue-300 transition-colors line-clamp-2 drop-shadow-lg">{anime.title}</h3>
          <div className="flex items-center text-slate-400 text-[11px] font-black group-hover:text-slate-200 transition-colors uppercase tracking-[0.1em]">
            <i className="fa-regular fa-clock mr-2.5 text-blue-500"></i>
            <span>{anime.airingTime}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnimeCard;
