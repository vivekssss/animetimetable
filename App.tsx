
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DAYS_OF_WEEK, MOCK_ANIME_DATA } from './constants';
import { Anime } from './types';
import AnimeCard from './components/AnimeCard';
import DetailDrawer from './components/DetailDrawer';
import SpaceBackground from './components/SpaceBackground';
import { getAnimeRecommendation } from './services/geminiService';
import { fetchAllSchedules, searchAnime, getCurrentSeasonInfo } from './services/apiService';

const ALL_GENRES = [
  'All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Mystery', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Thriller'
];

const App: React.FC = () => {
  const [airingList, setAiringList] = React.useState<Anime[]>([]);
  const [upcomingList, setUpcomingList] = React.useState<Anime[]>([]);
  const [pastList, setPastList] = React.useState<Anime[]>([]);
  const [viewMode, setViewMode] = React.useState<'airing' | 'upcoming'>('airing');
  const [selectedDay, setSelectedDay] = React.useState<number>(new Date().getDay());
  const [selectedGenre, setSelectedGenre] = React.useState<string>('All');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState<Anime[]>([]);
  const [selectedAnime, setSelectedAnime] = React.useState<Anime | null>(null);
  const [aiRecommendation, setAiRecommendation] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
  const [recommendationLoading, setRecommendationLoading] = React.useState(false);
  const [userPrompt, setUserPrompt] = React.useState('');
  const [visibleCount, setVisibleCount] = React.useState(12);
  const [showFilters, setShowFilters] = React.useState(false);
  const [showBmcInterface, setShowBmcInterface] = React.useState(false);
  const [weekOffset, setWeekOffset] = React.useState(0);

  const seasonInfo = React.useMemo(() => getCurrentSeasonInfo(), []);
  const bmcScriptRef = React.useRef<HTMLDivElement>(null);

  // Inject Buy Me a Coffee Script
  React.useEffect(() => {
    if (bmcScriptRef.current && bmcScriptRef.current.childNodes.length === 0) {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = "https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js";
      script.setAttribute('data-name', 'bmc-button');
      script.setAttribute('data-slug', 'vivektukaramsalgaonkar');
      script.setAttribute('data-color', '#FFDD00');
      script.setAttribute('data-emoji', '');
      script.setAttribute('data-font', 'Cookie');
      script.setAttribute('data-text', 'Buy me a coffee');
      script.setAttribute('data-outline-color', '#000000');
      script.setAttribute('data-font-color', '#000000');
      script.setAttribute('data-coffee-color', '#ffffff');
      bmcScriptRef.current.appendChild(script);
    }
  }, []);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const scheduleRes = await fetchAllSchedules(weekOffset);
        setAiringList(scheduleRes.currentData);
        setUpcomingList(scheduleRes.upcomingData);
        setPastList(scheduleRes.pastData);
      } catch (err) {
        setAiringList(MOCK_ANIME_DATA);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [weekOffset]);

  React.useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.length >= 2) {
        setIsSearching(true);
        try {
          const results = await searchAnime(searchQuery);
          setSearchResults(results);
        } catch (e) { console.error(e); }
        setIsSearching(false);
      } else {
        setSearchResults([]);
      }
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const filteredItems = React.useMemo(() => {
    const sourceList = viewMode === 'airing' ? airingList : upcomingList;
    const uniqueMap = new Map<number, Anime>();
    sourceList.forEach(item => {
      if (!uniqueMap.has(item.anilistId)) uniqueMap.set(item.anilistId, item);
    });
    const uniqueList = Array.from(uniqueMap.values());
    return uniqueList.filter(anime => {
      const dayMatch = viewMode === 'airing' ? anime.airingDay === selectedDay : true;
      const genreMatch = selectedGenre === 'All' ? true : anime.genres.includes(selectedGenre);
      return dayMatch && genreMatch;
    });
  }, [selectedDay, airingList, upcomingList, viewMode, selectedGenre]);

  const handleAiAsk = async () => {
    if (!userPrompt.trim()) return;
    setRecommendationLoading(true);
    const rec = await getAnimeRecommendation(airingList.slice(0, 15), userPrompt);
    setAiRecommendation(rec);
    setRecommendationLoading(false);
    setUserPrompt('');
  };

  const clearAi = () => { setAiRecommendation(null); setUserPrompt(''); };

  const SidebarMiniSection = ({ title, icon, list, color = 'text-blue-500' }: { title: string, icon: string, list: Anime[], color?: string }) => (
    <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 mb-8 overflow-hidden">
      <h4 className="text-[10px] font-black text-slate-500 mb-8 flex items-center gap-3 uppercase tracking-[0.2em]">
        <i className={`${icon} ${color}`}></i> {title}
      </h4>
      <div className="space-y-6">
        {list.slice(0, 5).map((anime) => (
          <div key={anime.id} className="flex gap-5 group cursor-pointer items-center" onClick={() => setSelectedAnime(anime)}>
            <div className="relative w-12 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
              <img src={anime.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-[13px] font-black text-white truncate group-hover:text-blue-500 transition-colors leading-tight">{anime.title}</h5>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] font-bold text-amber-500"><i className="fa-solid fa-star mr-1"></i>{anime.score > 0 ? anime.score.toFixed(1) : 'NEW'}</span>
                <span className="text-[9px] text-slate-600 font-black uppercase truncate tracking-wider">{anime.studio}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen text-slate-200 selection:bg-blue-500/30">
      <SpaceBackground />

      {/* Draggable Buy Me a Coffee "Chatbot" Button & Interface */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        className="fixed bottom-6 right-6 z-[200] flex flex-col items-end gap-4 cursor-grab active:cursor-grabbing"
      >
        <AnimatePresence>
          {showBmcInterface && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[320px] sm:w-[400px] h-[550px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col relative"
            >
              <div className="bg-[#FFDD00] p-4 flex justify-between items-center text-black font-black uppercase text-[10px] tracking-widest shrink-0">
                <span>Support AniFlow</span>
                <button onClick={() => setShowBmcInterface(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50">
                <div className="w-20 h-20 bg-[#FFDD00] rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <i className="fa-solid fa-mug-hot text-3xl text-black"></i>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Support the Mission</h3>
                <p className="text-slate-600 text-[13px] mb-8 font-medium leading-relaxed">
                  Help us keep the filters sharp and the anime signals flowing strong. Your support keeps the servers alive!
                </p>
                <a
                  href="https://www.buymeacoffee.com/vivektukaramsalgaonkar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#FFDD00] hover:bg-[#FFCC00] text-black font-black py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20 text-[10px] uppercase tracking-[0.2em] inline-flex items-center justify-center gap-3"
                >
                  <i className="fa-solid fa-external-link text-[10px]"></i>
                  Launch Support Page
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex flex-col items-end gap-3">
          <div ref={bmcScriptRef} className="hidden"></div>

          <button
            onClick={() => setShowBmcInterface(!showBmcInterface)}
            className="group relative flex items-center justify-center transition-all duration-300 transform active:scale-95"
          >
            <div className="absolute inset-0 bg-amber-500 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"></div>
            <div className="w-16 h-16 bg-[#FFDD00] rounded-2xl flex items-center justify-center shadow-3xl border-2 border-black/10 text-black group-hover:rotate-12 transition-transform overflow-hidden relative">
              <i className="fa-solid fa-mug-hot text-2xl"></i>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-black flex items-center justify-center rounded-tl-lg scale-0 group-hover:scale-100 transition-transform">
                <i className="fa-solid fa-up-right-from-square text-[8px] text-white"></i>
              </div>
            </div>
            {/* Red dot notification badge style */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#020617] animate-pulse"></span>
          </button>
        </div>
      </motion.div>

      <nav className="sticky top-0 z-[80] glass border-b border-white/5 py-3 lg:py-0">
        <div className="max-w-[1920px] w-full mx-auto px-4 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-12 lg:h-24">
          <div className="flex items-center justify-between w-full lg:w-auto gap-4">
            <div className="flex items-center gap-3 shrink-0 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-10 h-10 lg:w-11 lg:h-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-3xl shadow-blue-500/30">
                <i className="fa-solid fa-bolt-lightning text-white text-base lg:text-xl"></i>
              </div>
              <h1 className="text-lg lg:text-2xl font-black font-outfit text-white tracking-tighter">Ani<span className="text-blue-500">Flow</span></h1>
            </div>
            <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
              {['airing', 'upcoming'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode as any); setVisibleCount(12); }}
                  className={`px-3 lg:px-8 py-2 rounded-lg lg:rounded-xl text-[8px] lg:text-[10px] font-black uppercase tracking-[0.1em] transition-all ${viewMode === mode ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
                >
                  {mode === 'airing' ? 'Broadcast' : 'Upcoming'}
                </button>
              ))}
            </div>
          </div>
          <div className="relative w-full lg:flex-1 max-w-2xl">
            <input
              type="text"
              placeholder="Search weekly schedule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/50 border border-white/10 rounded-2xl py-3 lg:py-4 pl-12 lg:pl-14 pr-6 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-white backdrop-blur-xl"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-5 lg:left-6 top-1/2 -translate-y-1/2 text-slate-500"></i>
            <AnimatePresence>
              {(searchResults.length > 0 || isSearching) && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }} className="absolute top-full mt-4 left-0 w-full bg-[#0a0f1d] border border-white/10 rounded-3xl shadow-2xl overflow-hidden z-[90] p-3 flex flex-col max-h-[400px]">
                  <div className="overflow-y-auto custom-scrollbar flex-1">
                    {searchResults.map(result => (
                      <div key={result.id} onClick={() => { setSelectedAnime(result); setSearchQuery(''); }} className="flex gap-4 p-3 hover:bg-white/5 rounded-2xl cursor-pointer transition-all group mb-2">
                        <img src={result.image} className="w-12 h-16 rounded-xl object-cover shrink-0" />
                        <div className="flex flex-col justify-center min-w-0">
                          <h4 className="text-sm font-bold text-white group-hover:text-blue-400 truncate">{result.title}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-black">{result.studio}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <main className="max-w-[1920px] w-full mx-auto px-6 lg:px-12 py-12 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 xl:gap-20">
          <section className="xl:col-span-8">
            <header className="mb-12 lg:mb-16">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 mb-12">
                <div>
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-[0.2em] mb-4">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                    {viewMode === 'airing' ? `TIMETABLE ACTIVE ${seasonInfo.current.year}` : `SEASONAL FORECAST ${seasonInfo.upcoming.monthName.toUpperCase()}`}
                  </div>
                  <h2 className="text-4xl lg:text-7xl font-black font-outfit text-white tracking-tighter leading-none">
                    {viewMode === 'airing' ? 'Weekly' : 'Seasonal'} <span className="text-blue-600">Schedule.</span>
                  </h2>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 border ${showFilters ? 'bg-white text-blue-900 border-white' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                >
                  <i className={`fa-solid ${showFilters ? 'fa-filter-circle-xmark' : 'fa-filter'}`}></i>
                  {showFilters ? 'Hide Genres' : 'Genre Filters'}
                </button>
              </div>

              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-12 bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setWeekOffset(w => w - 1)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                  >
                    <i className="fa-solid fa-chevron-left"></i>
                  </button>
                  <div className="text-center">
                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Time Sector</p>
                    <h4 className="text-sm lg:text-lg font-black text-white">
                      {weekOffset === 0 ? 'Current Week' :
                        weekOffset > 0 ? `${weekOffset} Week${weekOffset > 1 ? 's' : ''} Ahead` :
                          `${Math.abs(weekOffset)} Week${Math.abs(weekOffset) > 1 ? 's' : ''} Prior`}
                    </h4>
                  </div>
                  <button
                    onClick={() => setWeekOffset(w => w + 1)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white"
                  >
                    <i className="fa-solid fa-chevron-right"></i>
                  </button>
                </div>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="px-6 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Back to Now
                  </button>
                )}
              </div>

              {/* Persistent Airing Day Selection */}
              {viewMode === 'airing' && (
                <div className="mb-12 space-y-5">
                  <p className="text-[11px] font-black text-slate-600 uppercase tracking-widest px-1">Select Airing Day</p>
                  <div className="flex flex-wrap gap-2.5">
                    {DAYS_OF_WEEK.map((day, index) => (
                      <button
                        key={day}
                        onClick={() => { setSelectedDay(index); setVisibleCount(12); }}
                        className={`px-6 py-3.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${selectedDay === index
                          ? 'bg-blue-600 text-white shadow-xl scale-105'
                          : 'bg-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                          }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-12">
                    <div className="p-8 lg:p-10 bg-white/[0.02] border border-white/5 rounded-[3rem]">
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Global Genre Scope</p>
                        <div className="flex flex-wrap gap-2.5">
                          {ALL_GENRES.map(genre => (
                            <button
                              key={genre}
                              onClick={() => { setSelectedGenre(genre); setVisibleCount(12); }}
                              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${selectedGenre === genre
                                ? 'bg-white text-blue-900 border-white shadow-xl'
                                : 'bg-transparent border-white/10 text-slate-500 hover:text-white hover:border-white/30'
                                }`}
                            >
                              {genre}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </header>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10 sm:gap-14">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-[10/15] bg-white/5 rounded-[3rem] animate-pulse"></div>)}
              </div>
            ) : filteredItems.length > 0 ? (
              <>
                <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-10 sm:gap-14">
                  {filteredItems.slice(0, visibleCount).map(anime => (
                    <AnimeCard key={anime.id} anime={anime} onClick={setSelectedAnime} />
                  ))}
                </motion.div>
                {visibleCount < filteredItems.length && (
                  <div className="mt-16 flex justify-center">
                    <button onClick={() => setVisibleCount(v => v + 12)} className="px-12 py-5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-white transition-all">
                      Scan Deeper Frequencies
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="py-40 flex flex-col items-center justify-center bg-white/[0.01] rounded-[3rem] border border-dashed border-white/10">
                <i className="fa-solid fa-satellite-dish text-4xl text-slate-800 mb-8"></i>
                <p className="text-slate-600 font-black uppercase tracking-widest text-[11px]">No active signals for this sector.</p>
              </div>
            )}
          </section>

          <aside className="xl:col-span-4 space-y-12">
            {/* AI Assistant */}
            <div className="glass rounded-[3rem] p-10 relative overflow-hidden">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/10 blur-[100px]"></div>
              <div className="flex items-center gap-5 mb-8">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                  <i className="fa-solid fa-wand-magic-sparkles text-xl"></i>
                </div>
                <div>
                  <h4 className="text-lg font-black text-white leading-tight">Gemini Oracle</h4>
                  <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest">Seasonal Insights</p>
                </div>
              </div>
              <div className="space-y-5">
                {!aiRecommendation ? (
                  <>
                    <textarea value={userPrompt} onChange={(e) => setUserPrompt(e.target.value)} placeholder="e.g. 'Recommend a high-stakes fantasy with high production quality...'" className="w-full bg-black/40 border border-white/10 rounded-2xl p-6 text-xs min-h-[140px] resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/40 text-white placeholder:text-slate-700" />
                    <button onClick={handleAiAsk} disabled={recommendationLoading || !userPrompt.trim()} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-800 text-white font-black uppercase tracking-widest py-5 rounded-2xl transition-all shadow-xl shadow-blue-500/20 text-[10px]">
                      {recommendationLoading ? 'Analyzing Broadcasts...' : 'Initiate Scan'}
                    </button>
                  </>
                ) : (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                    <div className="bg-blue-600/5 border border-blue-500/10 rounded-2xl p-6">
                      <p className="text-[13px] text-slate-300 leading-relaxed font-light italic">"{aiRecommendation}"</p>
                    </div>
                    <button onClick={clearAi} className="w-full py-4 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white">Clear Cache</button>
                  </motion.div>
                )}
              </div>
            </div>

            <SidebarMiniSection title="Past Broadcasts" icon="fa-solid fa-clock-rotate-left" list={pastList} color="text-emerald-500" />
            <SidebarMiniSection title="Upcoming Hype" icon="fa-solid fa-fire-flame-curved" list={upcomingList} color="text-amber-500" />
          </aside>
        </div>
      </main >
      <DetailDrawer anime={selectedAnime} onClose={() => setSelectedAnime(null)} />
    </div >
  );
};

export default App;
