
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
import { Anime } from '../types';
import { getAnimeRecommendation, getAiTrailerId } from '../services/geminiService';
import { fetchAnimeById } from '../services/apiService';

interface DetailDrawerProps {
  anime: Anime | null;
  onClose: () => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ anime: initialAnime, onClose }) => {
  const [anime, setAnime] = React.useState<Anime | null>(initialAnime);
  const [activeTab, setActiveTab] = React.useState<'info' | 'watch'>('info');
  const [isNavigating, setIsNavigating] = React.useState(false);
  const [aiTrailerId, setAiTrailerId] = React.useState<string | null>(null);

  React.useEffect(() => {
    setAnime(initialAnime);
    setAiTrailerId(null);
    if (initialAnime) {
      setActiveTab('info');
      if (!initialAnime.trailer?.id) {
        getAiTrailerId(initialAnime.title).then(id => {
          if (id) setAiTrailerId(id);
        });
      }
    }
  }, [initialAnime]);

  const handleConnectionClick = async (id: number) => {
    setIsNavigating(true);
    try {
      const fullAnime = await fetchAnimeById(id);
      if (fullAnime) {
        setAnime(fullAnime);
        setActiveTab('info');
        // Smooth scroll back to top of content
        const container = document.getElementById('drawer-scroll-container');
        if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      console.error("Navigation error:", err);
    } finally {
      setIsNavigating(false);
    }
  };

  if (!anime && !isNavigating) return null;

  return (
    <AnimatePresence>
      {initialAnime && (
        <div className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-xl"
          />
          <motion.div
            initial={{ x: '100%', y: 0 }}
            animate={{ x: 0, y: 0 }}
            exit={{ x: '100%', y: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 200 }}
            className="relative w-full sm:w-[500px] md:w-[600px] lg:w-[800px] xl:w-[950px] 2xl:w-[1100px] h-full bg-[#020617] sm:border-l border-white/10 shadow-2xl flex flex-col z-[310] overflow-hidden"
          >
            {/* Drawer / Popup Header */}
            <div className="flex items-center justify-between px-3.5 sm:px-8 py-3 sm:py-4 border-b border-white/10 shrink-0 bg-[#020617]/95 backdrop-blur-md sticky top-0 z-50">
              <div className="flex items-center gap-2.5 sm:gap-4 min-w-0 pr-2">
                <button
                  onClick={onClose}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all text-white shrink-0 active:scale-95"
                  aria-label="Close details"
                >
                  <i className="fa-solid fa-chevron-left text-xs sm:text-base"></i>
                </button>
                <div className="min-w-0">
                  <h2 className="text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Metadata Scan</h2>
                  <p className="text-xs sm:text-sm font-black text-white truncate max-w-[200px] sm:max-w-md">{anime?.title || 'Syncing...'}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isNavigating && (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                )}
                <button
                  onClick={onClose}
                  className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 transition-all active:scale-95"
                  title="Close popup"
                >
                  <i className="fa-solid fa-xmark text-xs sm:text-base"></i>
                </button>
              </div>
            </div>

            <div id="drawer-scroll-container" className="flex-1 overflow-y-auto custom-scrollbar">
              {anime ? (
                <>
                  {/* Hero Banner Section */}
                  <div className="relative h-[180px] sm:h-[320px] shrink-0 overflow-hidden">
                    <img src={anime.banner || anime.image} className="w-full h-full object-cover" alt={anime.title} />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/50 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full px-4 sm:px-10 pb-4 sm:pb-8 flex flex-col justify-end">
                      <div className="flex items-center gap-2 mb-1.5 sm:mb-2 flex-wrap">
                        {anime.score > 0 && (
                          <span className="bg-amber-500 text-black text-[9px] sm:text-xs font-black px-2 py-0.5 rounded sm:rounded-md flex items-center gap-1">
                            <i className="fa-solid fa-star text-[8px]"></i> {anime.score.toFixed(1)}
                          </span>
                        )}
                        {anime.episode > 0 && (
                          <span className="bg-blue-600 text-white text-[9px] sm:text-xs font-black px-2 py-0.5 rounded sm:rounded-md">
                            EP {anime.episode}
                          </span>
                        )}
                        {anime.studio && (
                          <span className="text-[9px] sm:text-xs font-bold text-sky-300 uppercase tracking-wider bg-black/50 px-2 py-0.5 rounded border border-white/10">
                            {anime.studio}
                          </span>
                        )}
                      </div>
                      <h1 className="text-xl sm:text-4xl lg:text-5xl font-black font-outfit text-white leading-tight tracking-tight drop-shadow-2xl line-clamp-2">{anime.title}</h1>
                    </div>
                  </div>

                  <div className="flex gap-6 sm:gap-8 px-5 sm:px-10 border-b border-white/5 bg-[#020617] pt-4 shrink-0 overflow-x-auto no-scrollbar">
                    {['info', 'watch'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative shrink-0 ${activeTab === tab ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}
                      >
                        {tab === 'info' ? 'Overview' : 'Trailer'}
                        {activeTab === tab && <motion.div layoutId="tab-underline-detail" className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full" />}
                      </button>
                    ))}
                  </div>

                  <div className="p-4 sm:p-8 lg:p-10 pb-24 sm:pb-32">
                    {activeTab === 'info' && (
                      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
                        <div className="xl:col-span-8 space-y-8 sm:space-y-12">
                          <section>
                            <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-widest mb-4 sm:mb-6 flex items-center gap-3"><span className="w-6 sm:w-8 h-px bg-blue-500/30"></span> Synopsis</h3>
                            <p className="text-slate-300 text-sm sm:text-base lg:text-lg leading-relaxed font-light">{anime.description}</p>
                          </section>
                          {anime.relations && anime.relations.length > 0 && (
                            <section>
                              <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-widest mb-6 sm:mb-8 flex items-center gap-3"><span className="w-6 sm:w-8 h-px bg-blue-500/30"></span> Connections</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-6">
                                {anime.relations.map(rel => (
                                  <div key={rel.id} className="group cursor-pointer" onClick={() => handleConnectionClick(rel.id)}>
                                    <div className="aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden border border-white/5 relative mb-2 sm:mb-3 bg-slate-900">
                                      <img src={rel.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                      <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <i className="fa-solid fa-link text-white text-xl sm:text-2xl drop-shadow-lg"></i>
                                      </div>
                                    </div>
                                    <p className="text-[10px] sm:text-[11px] font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors">{rel.title}</p>
                                    <p className="text-[8px] sm:text-[9px] text-slate-500 uppercase mt-0.5 sm:mt-1 tracking-widest">{rel.type}</p>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                        </div>
                        <div className="xl:col-span-4 space-y-6 sm:space-y-8">
                          <div className="bg-white/[0.03] border border-white/5 rounded-2xl sm:rounded-3xl p-5 sm:p-8 space-y-4 sm:space-y-6 sticky top-24">
                            <div className="flex justify-between items-center pb-3 sm:pb-4 border-b border-white/5">
                              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Studio</span>
                              <span className="text-xs font-bold text-white text-right ml-2">{anime.studio}</span>
                            </div>
                            <div className="flex justify-between items-center pb-3 sm:pb-4 border-b border-white/5">
                              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Airing</span>
                              <span className="text-xs font-bold text-blue-400 text-right ml-2">{anime.airingTime}</span>
                            </div>
                            <div className="space-y-2.5 sm:space-y-3 pt-2 sm:pt-4">
                              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Genre Pulse</p>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {anime.genres.map(g => (
                                  <span key={g} className="px-2.5 py-1 bg-white/5 text-slate-300 rounded-lg text-[8px] sm:text-[9px] font-bold border border-white/5">{g}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'watch' && (
                      <div className="space-y-8 sm:space-y-12">
                        {(anime.trailer?.id || aiTrailerId) ? (
                          <div className="aspect-video w-full rounded-2xl sm:rounded-[2rem] overflow-hidden border border-white/10 bg-black shadow-2xl relative">
                            <iframe
                              className="w-full h-full border-0"
                              src={(anime.trailer?.site?.toLowerCase() === 'dailymotion')
                                ? `https://www.dailymotion.com/embed/video/${anime.trailer.id}?autoplay=1&mute=0`
                                : `https://www.youtube-nocookie.com/embed/${anime.trailer?.id || aiTrailerId}?autoplay=1&rel=0`
                              }
                              title={`${anime.title} Trailer`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                              allowFullScreen
                            />
                          </div>
                        ) : (
                          <div className="aspect-video w-full rounded-2xl sm:rounded-[2rem] bg-white/5 flex flex-col items-center justify-center text-slate-400 border border-dashed border-white/10 p-6 text-center">
                            <i className="fa-solid fa-video-slash text-3xl sm:text-4xl mb-3 sm:mb-4 text-slate-500"></i>
                            <p className="font-bold uppercase tracking-widest text-[9px] sm:text-[10px] text-slate-400 mb-3">Trailer Signal Unavailable</p>
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(anime.title + ' official anime trailer')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all inline-flex items-center gap-2 shadow-lg shadow-red-600/20"
                            >
                              <i className="fa-brands fa-youtube text-sm"></i> Search Trailer on YouTube
                            </a>
                          </div>
                        )}
                        <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl sm:rounded-3xl p-6 sm:p-10 flex flex-col items-center text-center space-y-4 sm:space-y-6">
                          <i className="fa-solid fa-circle-play text-3xl sm:text-4xl text-blue-500"></i>
                          <div>
                            <h4 className="text-lg sm:text-xl font-black text-white">External Feeds</h4>
                            <p className="text-slate-400 text-xs sm:text-sm max-w-sm mt-1 sm:mt-2">Access authorized transmissions across official streaming platforms.</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2.5 sm:gap-4 w-full">
                            {anime.externalLinks?.map(link => (
                              <a
                                key={link.site}
                                href={link.url}
                                target="_blank"
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl sm:rounded-2xl transition-all shadow-xl shadow-blue-500/20 text-[9px] sm:text-[10px] uppercase tracking-widest inline-flex items-center justify-center"
                              >
                                Open {link.site}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="px-4 sm:px-10 py-4 sm:py-6 border-t border-white/5 bg-[#020617]/95 backdrop-blur-md flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-between shrink-0">
              <div className="flex flex-col gap-1 w-full sm:w-auto">
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-slate-500">Official Links</span>
                <div className="flex flex-wrap gap-3 sm:gap-4">
                  {anime?.externalLinks?.slice(0, 3).map(l => (
                    <a key={l.site} href={l.url} target="_blank" className="text-[9px] sm:text-[10px] font-bold text-slate-300 hover:text-blue-500 transition-colors uppercase tracking-widest">{l.site}</a>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={onClose} className="w-full sm:w-auto bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 sm:px-8 py-3 sm:py-3.5 rounded-xl font-black uppercase tracking-widest text-[9px] sm:text-[10px] transition-all">Close Entry</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DetailDrawer;
