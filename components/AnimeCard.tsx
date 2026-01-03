
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
      whileHover={{ y: -12, scale: 1.02 }}
      onClick={() => onClick(anime)}
      className={`group relative flex flex-col bg-slate-900/40 backdrop-blur-2xl rounded-[2.5rem] overflow-hidden border transition-all duration-500 cursor-pointer shadow-2xl ${isCurrentlyAiring ? 'border-blue-500 ring-2 ring-blue-500/20' : 'border-white/10 hover:border-blue-500/50'}`}
    >
      <div className="relative aspect-[10/15] overflow-hidden">
        <img
          src={anime.image}
          alt={anime.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[2s] ease-out"
        />

        {/* Badges Overlay - Combined to prevent overlap */}
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 gap-2">
          <div className="flex flex-col gap-2">
            {anime.episode > 0 && (
              <span className="bg-blue-600 backdrop-blur-xl text-white text-[10px] sm:text-[11px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl shadow-2xl border border-white/20">
                EP {anime.episode}
              </span>
            )}
            {isCurrentlyAiring && (
              <span className="bg-red-500 backdrop-blur-xl text-white text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-2xl animate-pulse flex items-center gap-2 border border-white/20">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping"></span>
                LIVE
              </span>
            )}
          </div>

          <span className="bg-black/60 backdrop-blur-xl text-amber-400 text-[11px] sm:text-xs font-black px-3.5 py-2 rounded-xl border border-white/10 flex items-center gap-2 shadow-2xl shrink-0">
            <i className="fa-solid fa-star"></i> {anime.score > 0 ? anime.score.toFixed(1) : 'NEW'}
          </span>
        </div>

        {/* Shadow Overlays - Stronger for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/60 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-500" />

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-7 sm:p-9">
          <p className="text-[11px] sm:text-xs font-black text-sky-400 uppercase tracking-[0.25em] mb-3 drop-shadow-md">{anime.studio}</p>
          <h3 className="text-white text-lg sm:text-2xl font-black font-outfit leading-[1.1] mb-5 group-hover:text-blue-200 transition-colors line-clamp-2 drop-shadow-2xl">{anime.title}</h3>
          <div className="flex items-center text-slate-300 text-[12px] sm:text-[13px] font-bold group-hover:text-white transition-colors uppercase tracking-widest">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-3 group-hover:bg-blue-500 transition-colors">
              <i className="fa-regular fa-clock text-blue-400 group-hover:text-white text-[10px]"></i>
            </div>
            <span>{anime.airingTime}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AnimeCard;
