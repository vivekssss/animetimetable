import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchAnime } from '../services/apiService';
import { Anime } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  results?: Anime[];
  timestamp: string;
}

interface AiChatbotProps {
  currentSchedule?: Anime[];
  onSelectAnime?: (anime: Anime) => void;
}

const QUICK_PROMPTS = [
  "What's airing today?",
  "Search Solo Leveling",
  "Top rated action shows",
  "Top romance anime"
];

const ANIME_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mahou Shoujo",
  "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life",
  "Sports", "Supernatural", "Thriller"
];

const DAYS_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const AiChatbot: React.FC<AiChatbotProps> = ({ currentSchedule = [], onSelectAnime }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: "Konnichiwa! I'm your AniFlow Assistant. Search any anime title, ask about today's schedule, or find top shows directly from the AniList database!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-1',
        sender: 'bot',
        text: "Konnichiwa! I'm your AniFlow Assistant. Search any anime title, ask about today's schedule, or find top shows directly from the AniList database!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputText('');
    setIsLoading(true);

    const lower = text.toLowerCase();
    const today = new Date().getDay();

    try {
      let responseText = "";
      let foundAnime: Anime[] = [];

      if (lower.includes("today") || lower.includes("airing today") || lower.includes("schedule today")) {
        const todayAnime = currentSchedule.filter(a => a.airingDay === today);
        if (todayAnime.length > 0) {
          responseText = `Found ${todayAnime.length} anime scheduled for today (${DAYS_NAMES[today]}):`;
          foundAnime = todayAnime;
        } else if (currentSchedule.length > 0) {
          responseText = `Here are today's scheduled broadcasts from AniList:`;
          foundAnime = currentSchedule.slice(0, 6);
        } else {
          const apiResults = await searchAnime(undefined, undefined, "SCORE_DESC");
          responseText = `Top current releases on AniList:`;
          foundAnime = apiResults.slice(0, 6);
        }
      } else {
        // Detect if user is asking for a specific genre
        let matchedGenre: string | undefined = undefined;
        for (const g of ANIME_GENRES) {
          if (lower.includes(g.toLowerCase())) {
            matchedGenre = g;
            break;
          }
        }

        // Determine sort order
        let sortMode = "POPULARITY_DESC";
        if (lower.includes("top") || lower.includes("best") || lower.includes("rated") || lower.includes("highest")) {
          sortMode = "SCORE_DESC";
        } else if (lower.includes("trending")) {
          sortMode = "TRENDING_DESC";
        }

        // Clean query string for title search
        let cleanQuery = text
          .replace(/^search\s+/i, '')
          .replace(/top|best|rated|highest|popular|shows|anime|show/gi, '')
          .trim();

        if (matchedGenre) {
          cleanQuery = cleanQuery.replace(new RegExp(matchedGenre, 'gi'), '').trim();
        }

        const queryArg = cleanQuery.length > 1 ? cleanQuery : undefined;
        const apiResults = await searchAnime(queryArg, matchedGenre, sortMode);

        if (apiResults && apiResults.length > 0) {
          if (matchedGenre) {
            responseText = `Top ${sortMode === 'SCORE_DESC' ? 'rated' : 'popular'} ${matchedGenre} anime from AniList database:`;
          } else if (queryArg) {
            responseText = `Found ${apiResults.length} matching anime for "${queryArg}":`;
          } else {
            responseText = `Top rated anime results from AniList database:`;
          }
          foundAnime = apiResults.slice(0, 8);
        } else {
          responseText = `No matching anime found for "${text}". Try checking spelling or searching a broader category!`;
        }
      }

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: responseText,
        results: foundAnime,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: "Signal error connecting to AniList API. Please try again!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-[80px] left-2 right-2 sm:left-6 sm:right-auto sm:bottom-24 w-auto sm:w-[400px] h-[calc(100vh-100px)] max-h-[540px] sm:h-[560px] bg-[#090d16] border border-slate-700/80 rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] flex flex-col z-[280]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-900/90 via-indigo-900/90 to-slate-900 border-b border-white/10 p-3 sm:p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 relative shrink-0">
                  <i className="fa-solid fa-comments text-xs sm:text-base"></i>
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 border-2 border-[#090d16] rounded-full"></span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs sm:text-sm font-black text-white leading-tight truncate">AniFlow Assistant</h3>
                  <p className="text-[8px] sm:text-[10px] text-blue-400 font-extrabold uppercase tracking-wider truncate">AniList Database Integrated</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={handleResetChat}
                  className="px-2.5 py-1 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1.5 transition-all border border-white/10 active:scale-95"
                  title="Clear chat history"
                >
                  <i className="fa-solid fa-rotate-left text-[10px]"></i>
                  <span className="hidden sm:inline">Reset</span>
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all active:scale-95"
                  title="Close assistant"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
              </div>
            </div>

            {/* Chat Messages Container */}
            <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-y-auto overscroll-contain touch-pan-y space-y-3.5 custom-scrollbar bg-slate-950/40">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[88%] rounded-2xl p-3 text-xs sm:text-[13px] leading-relaxed break-words whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white font-medium rounded-tr-none shadow-lg shadow-blue-600/20'
                        : 'bg-slate-800/90 text-slate-100 border border-slate-700/80 rounded-tl-none font-normal shadow-md'
                    }`}
                  >
                    <p className="mb-1.5 leading-snug">{msg.text}</p>

                    {/* Render Anime Cards inside Bot Response */}
                    {msg.results && msg.results.length > 0 && (
                      <div className="mt-2 space-y-2 max-h-[220px] overflow-y-auto overscroll-contain touch-pan-y custom-scrollbar pr-1">
                        {msg.results.map((anime) => (
                          <div
                            key={anime.id}
                            onClick={() => onSelectAnime && onSelectAnime(anime)}
                            className="flex items-center gap-2.5 p-2 bg-slate-900/90 hover:bg-blue-600/20 border border-slate-700/60 hover:border-blue-500/40 rounded-xl cursor-pointer transition-all group"
                          >
                            <img
                              src={anime.image}
                              alt={anime.title}
                              referrerPolicy="no-referrer"
                              className="w-10 h-14 rounded-lg object-cover shrink-0 border border-slate-700"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="text-xs font-bold text-white group-hover:text-blue-300 truncate leading-tight">
                                {anime.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {anime.score > 0 && (
                                  <span className="text-[9px] text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                    <i className="fa-solid fa-star text-[8px]"></i> {anime.score.toFixed(1)}
                                  </span>
                                )}
                                <span className="text-[8px] text-slate-400 font-bold uppercase truncate max-w-[100px]">
                                  {anime.studio || 'Anime'}
                                </span>
                              </div>
                            </div>
                            <button className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600 group-hover:text-white text-blue-300 text-[9px] font-black uppercase rounded-lg shrink-0 transition-colors">
                              View
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[8px] text-slate-500 font-bold mt-1 px-1">{msg.timestamp}</span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-slate-300 text-xs font-bold">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-300 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 ml-1">Searching AniList...</span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Chips */}
            {messages.length <= 2 && !isLoading && (
              <div className="px-3 pt-2 pb-1.5 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-t border-slate-800/80">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white rounded-lg text-[9px] sm:text-[10px] font-bold tracking-tight whitespace-nowrap transition-all shrink-0 active:scale-95"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            )}

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="p-2.5 sm:p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2 shrink-0"
            >
              <input
                type="text"
                placeholder="Type anime name, genre, or 'top rated'..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl flex items-center justify-center transition-all shrink-0 shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <i className="fa-solid fa-paper-plane text-xs sm:text-sm"></i>
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Trigger Button (High Visibility Pill Button) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[280] group relative flex items-center justify-center transition-all duration-300 transform active:scale-95"
        title="Open AniFlow Assistant"
      >
        <div className="absolute inset-0 bg-blue-600 blur-xl opacity-60 group-hover:opacity-90 transition-opacity"></div>
        <div className="h-12 px-3.5 sm:h-14 sm:px-5 bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 rounded-2xl flex items-center gap-2.5 shadow-2xl border-2 border-white/20 text-white group-hover:scale-105 transition-transform overflow-hidden relative">
          <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-comments'} text-base sm:text-xl`}></i>
          <span className="text-xs sm:text-sm font-black tracking-wide uppercase">Assistant</span>
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse border border-slate-900"></span>
        </div>
      </button>
    </>
  );
};
