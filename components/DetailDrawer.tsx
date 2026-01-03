
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactPlayer from 'react-player';
import { Anime } from '../types';
import { getAnimeRecommendation } from '../services/geminiService';
import { fetchAnimeById } from '../services/apiService';

interface DetailDrawerProps {
  anime: Anime | null;
  onClose: () => void;
}

const DetailDrawer: React.FC<DetailDrawerProps> = ({ anime: initialAnime, onClose }) => {
  const [anime, setAnime] = React.useState<Anime | null>(initialAnime);
  const [activeTab, setActiveTab] = React.useState<'info' | 'watch' | 'ai'>('info');
  const [aiAnalysis, setAiAnalysis] = React.useState<string>('');
  const [isAiLoading, setIsAiLoading] = React.useState(false);
  const [isNavigating, setIsNavigating] = React.useState(false);

  React.useEffect(() => {
    setAnime(initialAnime);
    if (initialAnime) {
      setActiveTab('info');
      setAiAnalysis('');
    }
  }, [initialAnime]);

  const handleConnectionClick = async (id: number) => {
    setIsNavigating(true);
    try {
      const fullAnime = await fetchAnimeById(id);
      if (fullAnime) {
        setAnime(fullAnime);
        setActiveTab('info');
        setAiAnalysis('');
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

  const loadAiLore = async () => {
    if (aiAnalysis || isAiLoading || !anime) return;
    setIsAiLoading(true);
    const res = await getAnimeRecommendation([anime], `Analyze "${anime.title}". Deep plot depth, character motives, and why an anime fan would like it.`);
    setAiAnalysis(res || "Signal interrupted...");
    setIsAiLoading(false);
  };

  if (!anime && !isNavigating) return null;

  return (
    <AnimatePresence>
      {initialAnime && (
        <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-xl"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="relative w-full sm:w-[85%] lg:w-[70%] xl:w-[60%] h-full bg-[#020617] border-l border-white/10 shadow-2xl flex flex-col z-[110]"
          >

            <div className="flex items-center justify-between px-8 py-5 border-b border-white/5 shrink-0 bg-[#020617]/90 backdrop-blur-md sticky top-0 z-50">
              <div className="flex items-center gap-4">
                <button onClick={onClose} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <div className="min-w-0">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-500">Metadata Scan</h2>
                  <p className="text-[11px] font-bold text-slate-400 truncate max-w-[150px] sm:max-w-md">{anime?.title || 'Syncing...'}</p>
                </div>
              </div>
              {isNavigating && (
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div id="drawer-scroll-container" className="flex-1 overflow-y-auto custom-scrollbar">
              {anime ? (
                <>
                  <div className="relative h-[250px] sm:h-[320px] shrink-0 overflow-hidden">
                    <img src={anime.banner || anime.image} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#020617] via-[#020617]/40 to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full px-10 pb-8">
                      <h1 className="text-3xl sm:text-5xl font-black font-outfit text-white leading-tight tracking-tight drop-shadow-2xl">{anime.title}</h1>
                    </div>
                  </div>

                  <div className="flex gap-8 px-10 border-b border-white/5 bg-[#020617] pt-4 shrink-0 overflow-x-auto no-scrollbar">
                    {['info', 'watch', 'ai'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => { setActiveTab(tab as any); if (tab === 'ai') loadAiLore(); }}
                        className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative shrink-0 ${activeTab === tab ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}
                      >
                        {tab === 'ai' ? 'AI Oracle' : tab === 'info' ? 'Overview' : 'Trailer'}
                        {activeTab === tab && <motion.div layoutId="tab-underline-detail" className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-full" />}
                      </button>
                    ))}
                  </div>

                  <div className="p-8 sm:p-12 pb-32">
                    {activeTab === 'info' && (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-8 space-y-12">
                          <section>
                            <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-widest mb-6 flex items-center gap-3"><span className="w-8 h-px bg-blue-500/30"></span> Synopsis</h3>
                            <p className="text-slate-300 text-lg sm:text-xl leading-relaxed font-light">{anime.description}</p>
                          </section>
                          {anime.relations && anime.relations.length > 0 && (
                            <section>
                              <h3 className="text-blue-500 font-black text-[10px] uppercase tracking-widest mb-8 flex items-center gap-3"><span className="w-8 h-px bg-blue-500/30"></span> Connections</h3>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                {anime.relations.map(rel => (
                                  <div key={rel.id} className="group cursor-pointer" onClick={() => handleConnectionClick(rel.id)}>
                                    <div className="aspect-[2/3] rounded-2xl overflow-hidden border border-white/5 relative mb-3 bg-slate-900">
                                      <img src={rel.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                      <div className="absolute inset-0 bg-blue-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <i className="fa-solid fa-link text-white text-2xl drop-shadow-lg"></i>
                                      </div>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-200 truncate group-hover:text-blue-400 transition-colors">{rel.title}</p>
                                    <p className="text-[9px] text-slate-500 uppercase mt-1 tracking-widest">{rel.type}</p>
                                  </div>
                                ))}
                              </div>
                            </section>
                          )}
                        </div>
                        <div className="lg:col-span-4 space-y-8">
                          <div className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 space-y-6">
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Studio</span>
                              <span className="text-xs font-bold text-white">{anime.studio}</span>
                            </div>
                            <div className="flex justify-between items-center pb-4 border-b border-white/5">
                              <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Airing</span>
                              <span className="text-xs font-bold text-blue-400">{anime.airingTime}</span>
                            </div>
                            <div className="space-y-3 pt-4">
                              <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Genre Pulse</p>
                              <div className="flex flex-wrap gap-2">
                                {anime.genres.map(g => (
                                  <span key={g} className="px-3 py-1 bg-white/5 text-slate-300 rounded-lg text-[9px] font-bold border border-white/5">{g}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'watch' && (
                      <div className="space-y-12">
                        {anime.trailer ? (
                          <div className="aspect-video w-full rounded-[2rem] overflow-hidden border border-white/10 bg-black shadow-2xl relative">
                            {anime.trailer.site === 'youtube' ? (
                              <ReactPlayer
                                url={`https://www.youtube.com/watch?v=${anime.trailer.id}`}
                                width="100%"
                                height="100%"
                                controls
                                playing
                                config={{
                                  youtube: {
                                    playerVars: { showinfo: 0, rel: 0, origin: window.location.origin }
                                  }
                                }}
                              />
                            ) : (
                              /* Iframe Else Condition for Dailymotion and other sources */
                              <iframe
                                className="w-full h-full"
                                src={anime.trailer.site === 'dailymotion'
                                  ? `https://www.dailymotion.com/embed/video/${anime.trailer.id}?autoplay=1&mute=0`
                                  : `https://www.youtube.com/embed/${anime.trailer.id}?autoplay=1`
                                }
                                allow="autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                              />
                            )}
                          </div>
                        ) : (
                          <div className="aspect-video w-full rounded-[2rem] bg-white/5 flex flex-col items-center justify-center text-slate-600 border border-dashed border-white/10">
                            <i className="fa-solid fa-video-slash text-4xl mb-4 opacity-20"></i>
                            <p className="font-bold uppercase tracking-widest text-[10px]">Signal Unavailable</p>
                          </div>
                        )}
                        <div className="bg-blue-600/5 border border-blue-500/10 rounded-3xl p-10 flex flex-col items-center text-center space-y-6">
                          <i className="fa-solid fa-circle-play text-4xl text-blue-500"></i>
                          <div>
                            <h4 className="text-xl font-black text-white">External Feeds</h4>
                            <p className="text-slate-400 text-sm max-w-sm mt-2">Access authorized transmissions across official streaming platforms.</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-4">
                            {anime.externalLinks?.map(link => (
                              <a
                                key={link.site}
                                href={link.url}
                                target="_blank"
                                className="bg-blue-600 hover:bg-blue-700 text-white font-black py-3 px-8 rounded-2xl transition-all shadow-xl shadow-blue-500/20 text-[10px] uppercase tracking-widest"
                              >
                                Open {link.site}
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'ai' && (
                      <div className="max-w-4xl mx-auto py-6">
                        <div className="flex items-center gap-5 mb-10">
                          <div className="w-16 h-16 bg-blue-600 rounded-[1.8rem] flex items-center justify-center text-white shadow-2xl">
                            <i className="fa-solid fa-microchip-ai text-2xl"></i>
                          </div>
                          <div>
                            <h4 className="text-2xl font-black text-white">Neural Scan</h4>
                            <p className="text-blue-500 font-black uppercase tracking-[0.2em] text-[10px]">Gemini Semantic Oracle</p>
                          </div>
                        </div>
                        {isAiLoading ? (
                          <div className="space-y-6 animate-pulse">
                            {[...Array(4)].map((_, i) => <div key={i} className="h-4 bg-white/5 rounded-full w-full"></div>)}
                          </div>
                        ) : (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-300 text-lg leading-relaxed font-light whitespace-pre-wrap">
                            {aiAnalysis || "Initiate the neural scan to decode deeper narrative patterns."}
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            <div className="px-10 py-6 border-t border-white/5 bg-[#020617]/95 backdrop-blur-md flex flex-col sm:flex-row gap-6 items-center justify-between shrink-0">
              <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Official Links</span>
                <div className="flex gap-4">
                  {anime?.externalLinks?.slice(0, 3).map(l => (
                    <a key={l.site} href={l.url} target="_blank" className="text-[10px] font-bold text-slate-300 hover:text-blue-500 transition-colors uppercase tracking-widest">{l.site}</a>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <button onClick={onClose} className="flex-1 sm:flex-none bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-3.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all">Close Entry</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default DetailDrawer;
