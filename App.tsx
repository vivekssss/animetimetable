
import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DAYS_OF_WEEK, MOCK_ANIME_DATA } from './constants';
import { Anime } from './types';
import AnimeCard from './components/AnimeCard';
import DetailDrawer from './components/DetailDrawer';
import SpaceBackground from './components/SpaceBackground';
import { AiChatbot } from './components/AiChatbot';
import { LoadingScreen } from './components/LoadingScreen';
import { fetchAllSchedules, searchAnime, getCurrentSeasonInfo } from './services/apiService';

const ALL_GENRES = [
  'All', 'Action', 'Adventure', 'Comedy', 'Drama', 'Ecchi', 'Fantasy', 'Horror', 'Mahou Shoujo', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'
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
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSearching, setIsSearching] = React.useState(false);
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
      const startTime = Date.now();
      try {
        const scheduleRes = await fetchAllSchedules(weekOffset);
        setAiringList(scheduleRes.currentData);
        setUpcomingList(scheduleRes.upcomingData);
        setPastList(scheduleRes.pastData);
      } catch (err) {
        setAiringList(MOCK_ANIME_DATA);
      } finally {
        const elapsed = Date.now() - startTime;
        const minDuration = 1200; // 1.2s screen loader experience
        if (elapsed < minDuration) {
          setTimeout(() => setIsLoading(false), minDuration - elapsed);
        } else {
          setIsLoading(false);
        }
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

  const SidebarMiniSection = ({ title, icon, list, color = 'text-blue-500' }: { title: string, icon: string, list: Anime[], color?: string }) => (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 mb-6 sm:mb-8 overflow-hidden">
      <h4 className="text-[10px] font-black text-slate-500 mb-5 sm:mb-8 flex items-center gap-2.5 sm:gap-3 uppercase tracking-[0.2em]">
        <i className={`${icon} ${color}`}></i> {title}
      </h4>
      <div className="space-y-4 sm:space-y-6">
        {list.slice(0, 5).map((anime) => (
          <div key={anime.id} className="flex gap-3 sm:gap-5 group cursor-pointer items-center" onClick={() => setSelectedAnime(anime)}>
            <div className="relative w-10 h-14 sm:w-12 sm:h-16 rounded-lg sm:rounded-xl overflow-hidden border border-white/10 shrink-0">
              <img src={anime.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            <div className="flex-1 min-w-0">
              <h5 className="text-xs sm:text-[13px] font-black text-white truncate group-hover:text-blue-500 transition-colors leading-tight">{anime.title}</h5>
              <div className="flex items-center gap-2.5 sm:gap-3 mt-1 sm:mt-1.5">
                <span className="text-[9px] sm:text-[10px] font-bold text-amber-500"><i className="fa-solid fa-star mr-1 text-[8px]"></i>{anime.score > 0 ? anime.score.toFixed(1) : 'NEW'}</span>
                <span className="text-[8px] sm:text-[9px] text-slate-500 font-black uppercase truncate tracking-wider">{anime.studio}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen text-slate-200 selection:bg-blue-500/30">
      {/* Modern Animated Screen Loader */}
      <LoadingScreen isLoading={isLoading} />

      <SpaceBackground />

      {/* Floating AI Chatbot on Left */}
      <AiChatbot currentSchedule={airingList} onSelectAnime={setSelectedAnime} />

      {/* Draggable Buy Me a Coffee "Chatbot" Button & Interface */}
      <motion.div
        drag
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={0.1}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[200] flex flex-col items-end gap-3 sm:gap-4 cursor-grab active:cursor-grabbing max-w-[calc(100vw-2rem)]"
      >
        <AnimatePresence>
          {showBmcInterface && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="w-[calc(100vw-2rem)] sm:w-[380px] max-h-[85vh] sm:max-h-[500px] h-[440px] sm:h-[500px] bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col relative"
            >
              <div className="bg-[#FFDD00] p-3.5 sm:p-4 flex justify-between items-center text-black font-black uppercase text-[10px] tracking-widest shrink-0">
                <span>Support AniFlow</span>
                <button onClick={() => setShowBmcInterface(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-black/5 hover:bg-black/10">
                  <i className="fa-solid fa-xmark"></i>
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center p-5 sm:p-8 text-center bg-slate-50 overflow-y-auto">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#FFDD00] rounded-full flex items-center justify-center mb-4 sm:mb-6 shadow-lg shrink-0">
                  <i className="fa-solid fa-mug-hot text-2xl sm:text-3xl text-black"></i>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-slate-800 mb-2 uppercase tracking-tighter">Support the Mission</h3>
                <p className="text-slate-600 text-xs sm:text-[13px] mb-6 sm:mb-8 font-medium leading-relaxed">
                  Help us keep the filters sharp and the anime signals flowing strong. Your support keeps the servers alive!
                </p>
                <a
                  href="https://www.buymeacoffee.com/vivektukaramsalgaonkar"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-[#FFDD00] hover:bg-[#FFCC00] text-black font-black py-3.5 sm:py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/20 text-[10px] uppercase tracking-[0.2em] inline-flex items-center justify-center gap-3 shrink-0"
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
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#FFDD00] rounded-2xl flex items-center justify-center shadow-3xl border-2 border-black/10 text-black group-hover:rotate-12 transition-transform overflow-hidden relative">
              <i className="fa-solid fa-mug-hot text-xl sm:text-2xl"></i>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-black flex items-center justify-center rounded-tl-lg scale-0 group-hover:scale-100 transition-transform">
                <i className="fa-solid fa-up-right-from-square text-[8px] text-white"></i>
              </div>
            </div>
            {/* Red dot notification badge style */}
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-[#020617] animate-pulse"></span>
          </button>
        </div>
      </motion.div>

      <nav className="sticky top-0 z-[80] glass border-b border-white/5 py-2.5 sm:py-3 lg:py-0">
        <div className="max-w-[1920px] w-full mx-auto px-3 sm:px-6 lg:px-12 flex flex-col lg:flex-row items-center justify-between gap-2.5 sm:gap-4 lg:gap-12 lg:h-24">
          <div className="flex items-center justify-between w-full lg:w-auto gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="w-9 h-9 sm:w-10 sm:h-10 lg:w-11 lg:h-11 bg-blue-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-3xl shadow-blue-500/30">
                <i className="fa-solid fa-bolt-lightning text-white text-sm sm:text-base lg:text-xl"></i>
              </div>
              <h1 className="text-base sm:text-lg lg:text-2xl font-black font-outfit text-white tracking-tighter">Ani<span className="text-blue-500">Flow</span></h1>
            </div>
            <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
              {['airing', 'upcoming'].map((mode) => (
                <button
                  key={mode}
                  onClick={() => { setViewMode(mode as any); setVisibleCount(12); }}
                  className={`px-2.5 sm:px-4 lg:px-8 py-1.5 sm:py-2 rounded-lg lg:rounded-xl text-[8px] sm:text-[9px] lg:text-[10px] font-black uppercase tracking-[0.08em] sm:tracking-[0.1em] transition-all ${viewMode === mode ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500 hover:text-white'}`}
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
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl sm:rounded-2xl py-2 sm:py-3 lg:py-4 pl-9 sm:pl-12 lg:pl-14 pr-9 sm:pr-12 text-xs lg:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all text-white backdrop-blur-xl"
            />
            <i className="fa-solid fa-magnifying-glass absolute left-3 sm:left-5 lg:left-6 top-1/2 -translate-y-1/2 text-slate-500 text-xs sm:text-base pointer-events-none"></i>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-full bg-white/5 hover:bg-white/10 transition-all"
              >
                <i className="fa-solid fa-xmark text-xs sm:text-sm block w-3.5 h-3.5 leading-none flex items-center justify-center"></i>
              </button>
            )}
            <AnimatePresence>
              {(searchResults.length > 0 || isSearching || (searchQuery.trim().length >= 2 && !isSearching)) && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full mt-2 sm:mt-3 left-0 w-full bg-[#090d16] border border-slate-700 rounded-2xl sm:rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden z-[120] p-2 sm:p-3 flex flex-col max-h-[320px] sm:max-h-[420px]"
                >
                  <div className="overflow-y-auto custom-scrollbar flex-1 space-y-1.5">
                    {isSearching ? (
                      <div className="p-4 flex items-center justify-center gap-2.5 text-slate-300 text-xs font-bold">
                        <i className="fa-solid fa-circle-notch animate-spin text-blue-400 text-sm"></i>
                        <span>Scanning Database...</span>
                      </div>
                    ) : searchResults.length > 0 ? (
                      searchResults.map(result => (
                        <div
                          key={result.id}
                          onClick={() => { setSelectedAnime(result); setSearchQuery(''); }}
                          className="flex items-center gap-3 sm:gap-4 p-2 sm:p-2.5 bg-slate-800/50 hover:bg-blue-600/20 border border-slate-700/50 hover:border-blue-500/40 rounded-xl sm:rounded-2xl cursor-pointer transition-all group"
                        >
                          <img src={result.image} className="w-10 h-14 sm:w-12 sm:h-16 rounded-lg sm:rounded-xl object-cover shrink-0 border border-slate-700" />
                          <div className="flex flex-col justify-center min-w-0 flex-1">
                            <h4 className="text-xs sm:text-sm font-black text-white group-hover:text-blue-300 truncate leading-snug">{result.title}</h4>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {result.score > 0 && (
                                <span className="text-[9px] sm:text-[10px] text-amber-300 font-black flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                  <i className="fa-solid fa-star text-[8px]"></i> {result.score.toFixed(1)}
                                </span>
                              )}
                              <span className="text-[8px] sm:text-[9px] text-slate-300 uppercase tracking-wider font-bold truncate max-w-[120px] sm:max-w-none">{result.studio || 'Anime'}</span>
                            </div>
                          </div>
                          {result.airingTime && (
                            <div className="shrink-0 text-right hidden sm:block">
                              <span className="text-[9px] text-blue-300 font-extrabold bg-blue-500/20 border border-blue-500/30 px-2.5 py-1 rounded-lg inline-block">
                                {result.airingTime}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-400 font-bold uppercase tracking-wider">
                        No anime signals found
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </nav>

      <main className="max-w-[1920px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-6 sm:py-12 lg:py-20 relative z-10">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 xl:gap-20">
          <section className="xl:col-span-8">
            <header className="mb-8 lg:mb-16">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 lg:mb-12">
                <div>
                  <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] mb-3 sm:mb-4">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span>
                    {viewMode === 'airing' ? `TIMETABLE ACTIVE ${seasonInfo.current.year}` : `SEASONAL FORECAST ${seasonInfo.upcoming.monthName.toUpperCase()}`}
                  </div>
                  <h2 className="text-3xl sm:text-5xl lg:text-7xl font-black font-outfit text-white tracking-tighter leading-none">
                    {viewMode === 'airing' ? 'Weekly' : 'Seasonal'} <span className="text-blue-600">Schedule.</span>
                  </h2>
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-5 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all flex items-center gap-2.5 sm:gap-3 border shrink-0 ${showFilters ? 'bg-white text-blue-900 border-white' : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10'}`}
                >
                  <i className={`fa-solid ${showFilters ? 'fa-filter-circle-xmark' : 'fa-filter'}`}></i>
                  {showFilters ? 'Hide Genres' : 'Genre Filters'}
                </button>
              </div>

              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-8 sm:mb-12 bg-white/[0.02] border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6">
                <div className="flex items-center gap-3 sm:gap-4">
                  <button
                    onClick={() => setWeekOffset(w => w - 1)}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white shrink-0"
                  >
                    <i className="fa-solid fa-chevron-left text-xs sm:text-base"></i>
                  </button>
                  <div className="text-center">
                    <p className="text-[9px] sm:text-[10px] font-black text-blue-500 uppercase tracking-widest">Time Sector</p>
                    <h4 className="text-xs sm:text-sm lg:text-lg font-black text-white whitespace-nowrap">
                      {weekOffset === 0 ? 'Current Week' :
                        weekOffset > 0 ? `${weekOffset} Wk${weekOffset > 1 ? 's' : ''} Ahead` :
                          `${Math.abs(weekOffset)} Wk${Math.abs(weekOffset) > 1 ? 's' : ''} Prior`}
                    </h4>
                  </div>
                  <button
                    onClick={() => setWeekOffset(w => w + 1)}
                    className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 transition-all text-slate-400 hover:text-white shrink-0"
                  >
                    <i className="fa-solid fa-chevron-right text-xs sm:text-base"></i>
                  </button>
                </div>
                {weekOffset !== 0 && (
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="px-3 sm:px-6 py-2.5 sm:py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider sm:tracking-widest transition-all shrink-0"
                  >
                    Reset
                  </button>
                )}
              </div>

              {/* Persistent Sticky Airing Day Selection */}
              {viewMode === 'airing' && (
                <div className="sticky top-[52px] sm:top-[84px] z-[60] bg-[#020617]/95 backdrop-blur-2xl py-2 sm:py-3.5 px-2.5 sm:px-5 border border-white/10 rounded-xl sm:rounded-2xl shadow-2xl mb-6 sm:mb-12 transition-all">
                  <div className="flex items-center justify-between mb-2 px-0.5">
                    <p className="text-[9px] sm:text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1.5">
                      <i className="fa-solid fa-calendar-day text-[10px]"></i>
                      <span>Airing Schedule</span>
                    </p>
                    <span className="text-[9px] sm:text-[10px] font-extrabold text-slate-300 uppercase tracking-wider">
                      {DAYS_OF_WEEK[selectedDay]}
                    </span>
                  </div>
                  <div className="grid grid-cols-7 gap-1 sm:flex sm:flex-wrap sm:gap-2.5">
                    {DAYS_OF_WEEK.map((day, index) => {
                      const isToday = index === new Date().getDay() && weekOffset === 0;
                      return (
                        <button
                          key={day}
                          onClick={() => { setSelectedDay(index); }}
                          className={`py-2 sm:py-2.5 px-0.5 sm:px-5 rounded-lg sm:rounded-xl font-black text-center transition-all relative flex flex-col items-center justify-center shrink-0 sm:shrink ${selectedDay === index
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-[1.03]'
                            : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                            }`}
                        >
                          <span className="sm:hidden text-[9px] uppercase tracking-wider font-extrabold">{day.slice(0, 3)}</span>
                          <span className="hidden sm:inline text-[10px] uppercase tracking-widest">{day}</span>
                          {isToday && (
                            <span className={`w-1 h-1 rounded-full mt-0.5 ${selectedDay === index ? 'bg-white' : 'bg-blue-400'}`}></span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <AnimatePresence>
                {showFilters && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mb-12">
                    <div className="p-4 sm:p-8 lg:p-10 bg-white/[0.02] border border-white/5 rounded-2xl sm:rounded-[3rem]">
                      <div className="space-y-3 sm:space-y-4">
                        <p className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest">Global Genre Scope</p>
                        <div className="flex flex-wrap gap-1.5 sm:gap-2.5">
                          {ALL_GENRES.map(genre => (
                            <button
                              key={genre}
                              onClick={() => { setSelectedGenre(genre); }}
                              className={`px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-wider transition-all border ${selectedGenre === genre
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
              <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-10 xl:gap-12">
                {[...Array(6)].map((_, i) => <div key={i} className="aspect-[10/15] bg-white/5 rounded-2xl sm:rounded-[3rem] animate-pulse"></div>)}
              </div>
            ) : filteredItems.length > 0 ? (
              <>
                <motion.div layout className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-10 xl:gap-12">
                  {filteredItems.map(anime => (
                    <AnimeCard key={anime.id} anime={anime} onClick={setSelectedAnime} />
                  ))}
                </motion.div>
              </>
            ) : (
              <div className="py-24 sm:py-40 flex flex-col items-center justify-center bg-white/[0.01] rounded-2xl sm:rounded-[3rem] border border-dashed border-white/10 p-6 text-center">
                <i className="fa-solid fa-satellite-dish text-3xl sm:text-4xl text-slate-800 mb-4 sm:mb-8"></i>
                <p className="text-slate-500 font-black uppercase tracking-widest text-[10px] sm:text-[11px]">No active signals for this sector.</p>
              </div>
            )}
          </section>

          <aside className="xl:col-span-4 space-y-8 sm:space-y-12">
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
