import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { searchAnime } from '../services/apiService';
import { sendChatMessage, getAnimeTrivia } from '../services/geminiService';
import { Anime } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  results?: Anime[];
  timestamp: string;
  triviaData?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    userAnswer?: number;
  };
}

interface AiChatbotProps {
  currentSchedule?: Anime[];
  onSelectAnime?: (anime: Anime) => void;
}

type Mode = 'chat' | 'search' | 'trivia';

const QUICK_PROMPTS = [
  "What's airing today?",
  "Recommend anime like Solo Leveling",
  "Suggest a wholesome slice-of-life show",
  "Explain Jujutsu Kaisen Cursed Energy",
  "Top rated shows this season"
];

const MOOD_PILLS = [
  { label: "🔥 High Energy", prompt: "Recommend high-octane action anime with top animation" },
  { label: "😭 Emotional", prompt: "Suggest deep, emotional tearjerker anime" },
  { label: "🧘 Chill / Cozy", prompt: "Recommend relaxing, comfy slice-of-life anime" },
  { label: "🧠 Mind-Bending", prompt: "Recommend psychological thriller anime with plot twists" },
  { label: "💖 Romance", prompt: "Suggest feel-good romance anime shows" }
];

const DAYS_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const AiChatbot: React.FC<AiChatbotProps> = ({ currentSchedule = [], onSelectAnime }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Mode>('chat');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      sender: 'bot',
      text: "Konnichiwa! I'm AniFlow AI powered by Gemini. Ask me for personalized recommendations, plot deep-dives, schedule updates, or test your otaku knowledge with Trivia!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [triviaScore, setTriviaScore] = useState(0);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isLoading]);

  const handleResetChat = () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setMessages([
      {
        id: 'welcome-1',
        sender: 'bot',
        text: "Konnichiwa! I'm AniFlow AI powered by Gemini. Ask me for personalized recommendations, plot deep-dives, schedule updates, or test your otaku knowledge with Trivia!",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setTriviaScore(0);
  };

  // Text To Speech helper
  const handleSpeak = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#~`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.onend = () => setSpeakingId(null);
    utterance.onerror = () => setSpeakingId(null);
    setSpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Speech To Text helper
  const handleStartListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }
    if (isListening) return;

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
        }
      };

      recognition.start();
    } catch (e) {
      setIsListening(false);
    }
  };

  // Copy message text
  const handleCopyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Trivia Quiz trigger
  const handleLoadTrivia = async () => {
    setIsLoading(true);
    setActiveTab('trivia');
    try {
      const trivia = await getAnimeTrivia();
      if (trivia && trivia.question) {
        const botMsg: Message = {
          id: Date.now().toString(),
          sender: 'bot',
          text: "🎯 **Otaku Trivia Challenge!** Select the correct answer below:",
          triviaData: trivia,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'bot',
            text: "Failed to load trivia question. Please try again!",
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error("Trivia error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Trivia Option Click
  const handleAnswerTrivia = (msgId: string, chosenIdx: number) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== msgId || !msg.triviaData || msg.triviaData.userAnswer !== undefined) return msg;

      const isCorrect = chosenIdx === msg.triviaData.correctIndex;
      if (isCorrect) {
        setTriviaScore(s => s + 10);
      }

      return {
        ...msg,
        triviaData: {
          ...msg.triviaData,
          userAnswer: chosenIdx
        }
      };
    }));
  };

  // Handle sending chat / search messages
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
      if (activeTab === 'search') {
        // Direct AniList Search mode
        const cleanQuery = text.replace(/^search\s+/i, '');
        const apiResults = await searchAnime(cleanQuery);
        let responseText = "";
        let foundAnime: Anime[] = [];

        if (apiResults && apiResults.length > 0) {
          responseText = `Found ${apiResults.length} matches on AniList for "${cleanQuery}":`;
          foundAnime = apiResults.slice(0, 8);
        } else {
          responseText = `No matching anime found for "${cleanQuery}". Try adjusting your keywords!`;
        }

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: responseText,
          results: foundAnime,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);

      } else {
        // AI Chatbot mode via Gemini API
        // Format chat history for context
        const historyForGemini = messages
          .filter(m => !m.triviaData)
          .map(m => ({ sender: m.sender, text: m.text }));

        const { text: aiResponseText, suggestedTitles } = await sendChatMessage(text, historyForGemini, currentSchedule);

        let attachedAnime: Anime[] = [];
        if (suggestedTitles && suggestedTitles.length > 0) {
          // Fetch real AniList cards for the suggested titles in parallel
          const cardPromises = suggestedTitles.map(title => searchAnime(title));
          const cardResultsArr = await Promise.all(cardPromises);
          cardResultsArr.forEach(results => {
            if (results && results.length > 0) {
              const bestMatch = results[0];
              if (!attachedAnime.some(a => a.id === bestMatch.id)) {
                attachedAnime.push(bestMatch);
              }
            }
          });
        }

        // If user asked specifically about today's schedule
        if (lower.includes("today") || lower.includes("airing today") || lower.includes("schedule today")) {
          const todayAnime = currentSchedule.filter(a => a.airingDay === today);
          if (todayAnime.length > 0 && attachedAnime.length === 0) {
            attachedAnime = todayAnime.slice(0, 6);
          }
        }

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: aiResponseText,
          results: attachedAnime,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, botMsg]);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: "Signal error connecting to AI services. Please try again!",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-[200] flex flex-col items-start gap-3 max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-[calc(100vw-2rem)] sm:w-[410px] h-[520px] sm:h-[580px] max-h-[85vh] bg-[#080d1a] border border-slate-700/80 rounded-3xl overflow-hidden shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] flex flex-col relative"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 border-b border-white/10 p-3 sm:p-3.5 flex flex-col gap-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 relative shrink-0">
                    <i className="fa-solid fa-sparkles text-xs sm:text-sm"></i>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#080d1a] rounded-full"></span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-xs sm:text-sm font-black text-white leading-tight truncate">AniFlow AI</h3>
                      <span className="px-1.5 py-0.2 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[8px] font-black uppercase rounded">Gemini 3.6</span>
                    </div>
                    <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider truncate">
                      {activeTab === 'chat' ? 'Otaku AI Expert' : activeTab === 'search' ? 'AniList Database Search' : `Trivia Master (Score: ${triviaScore} pts)`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={handleResetChat}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white rounded-xl text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 transition-all border border-white/10 active:scale-95"
                    title="Clear conversation"
                  >
                    <i className="fa-solid fa-rotate-left text-[10px]"></i>
                    <span className="hidden sm:inline">Reset</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.speechSynthesis) window.speechSynthesis.cancel();
                      setIsOpen(false);
                    }}
                    className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-all active:scale-95"
                    title="Close assistant"
                  >
                    <i className="fa-solid fa-xmark text-xs"></i>
                  </button>
                </div>
              </div>

              {/* Navigation Modes Switcher */}
              <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-white/5 text-[10px] font-extrabold uppercase">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'chat' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="fa-solid fa-robot text-[10px]"></i>
                  <span>AI Chat</span>
                </button>
                <button
                  onClick={() => setActiveTab('search')}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'search' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="fa-solid fa-magnifying-glass text-[10px]"></i>
                  <span>Database</span>
                </button>
                <button
                  onClick={handleLoadTrivia}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === 'trivia' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <i className="fa-solid fa-gamepad text-[10px]"></i>
                  <span>Trivia</span>
                </button>
              </div>
            </div>

            {/* Mood Pills Selector in Chat Mode */}
            {activeTab === 'chat' && (
              <div className="px-3 py-1.5 bg-slate-900/80 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider shrink-0 mr-1">Mood:</span>
                {MOOD_PILLS.map((pill) => (
                  <button
                    key={pill.label}
                    onClick={() => handleSend(pill.prompt)}
                    className="px-2.5 py-0.5 bg-blue-950/60 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white rounded-full text-[9px] font-bold tracking-tight whitespace-nowrap transition-all shrink-0"
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            )}

            {/* Chat Messages Body */}
            <div className="flex-1 p-3 sm:p-3.5 overflow-y-auto space-y-3.5 custom-scrollbar bg-slate-950/50">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[92%] sm:max-w-[88%] rounded-2xl p-3 text-xs sm:text-[13px] leading-relaxed relative group ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-tr-none shadow-lg shadow-blue-600/20'
                        : 'bg-slate-900/90 text-slate-100 border border-slate-700/80 rounded-tl-none shadow-md'
                    }`}
                  >
                    {/* Bot Toolbar Header (TTS & Copy) */}
                    {msg.sender === 'bot' && (
                      <div className="flex items-center justify-between border-b border-white/5 pb-1.5 mb-2 text-[10px] text-slate-400">
                        <span className="font-black text-blue-400 flex items-center gap-1">
                          <i className="fa-solid fa-sparkles text-[9px]"></i> AniFlow AI
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleSpeak(msg.id, msg.text)}
                            className={`hover:text-blue-400 transition-colors ${speakingId === msg.id ? 'text-blue-400 animate-pulse' : ''}`}
                            title="Read response aloud"
                          >
                            <i className={`fa-solid ${speakingId === msg.id ? 'fa-volume-high' : 'fa-volume-low'}`}></i>
                          </button>
                          <button
                            onClick={() => handleCopyText(msg.id, msg.text)}
                            className="hover:text-blue-400 transition-colors"
                            title="Copy text"
                          >
                            <i className={`fa-solid ${copiedId === msg.id ? 'fa-check text-emerald-400' : 'fa-copy'}`}></i>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Main Text Content */}
                    <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>

                    {/* Trivia Interactive Quiz Card */}
                    {msg.triviaData && (
                      <div className="mt-3 bg-slate-950/80 border border-amber-500/30 rounded-xl p-3 space-y-2">
                        <p className="text-xs font-bold text-amber-200 leading-snug">
                          {msg.triviaData.question}
                        </p>
                        <div className="space-y-1.5 mt-2">
                          {msg.triviaData.options.map((opt, oIdx) => {
                            const isSelected = msg.triviaData?.userAnswer === oIdx;
                            const isAnswered = msg.triviaData?.userAnswer !== undefined;
                            const isCorrect = oIdx === msg.triviaData?.correctIndex;

                            let btnStyle = "bg-slate-900 border-slate-800 text-slate-300 hover:border-amber-500/50";
                            if (isAnswered) {
                              if (isCorrect) {
                                btnStyle = "bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold";
                              } else if (isSelected) {
                                btnStyle = "bg-rose-950/80 border-rose-500 text-rose-200 font-bold";
                              } else {
                                btnStyle = "bg-slate-900/50 border-slate-800 opacity-50";
                              }
                            }

                            return (
                              <button
                                key={oIdx}
                                disabled={isAnswered}
                                onClick={() => handleAnswerTrivia(msg.id, oIdx)}
                                className={`w-full text-left px-2.5 py-1.5 rounded-lg border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                              >
                                <span className="truncate">{String.fromCharCode(65 + oIdx)}. {opt}</span>
                                {isAnswered && isCorrect && <i className="fa-solid fa-circle-check text-emerald-400 text-xs"></i>}
                                {isAnswered && isSelected && !isCorrect && <i className="fa-solid fa-circle-xmark text-rose-400 text-xs"></i>}
                              </button>
                            );
                          })}
                        </div>

                        {msg.triviaData.userAnswer !== undefined && (
                          <div className="mt-2.5 p-2 bg-slate-900 rounded-lg border border-white/10 text-[11px] text-slate-300">
                            <p className="font-bold text-amber-400 mb-0.5">
                              {msg.triviaData.userAnswer === msg.triviaData.correctIndex ? "🎉 Correct! (+10 pts)" : "❌ Not quite right!"}
                            </p>
                            <p className="text-slate-400 leading-snug">{msg.triviaData.explanation}</p>
                            <button
                              onClick={handleLoadTrivia}
                              className="mt-2 w-full py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-black text-[10px] uppercase tracking-wider transition-colors shadow-md"
                            >
                              Next Question <i className="fa-solid fa-arrow-right ml-1"></i>
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Attached Anime Cards */}
                    {msg.results && msg.results.length > 0 && (
                      <div className="mt-3 space-y-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-blue-400 block mb-1">
                          Recommended Shows:
                        </span>
                        {msg.results.map((anime) => (
                          <div
                            key={anime.id}
                            onClick={() => onSelectAnime && onSelectAnime(anime)}
                            className="flex items-center gap-2.5 p-2 bg-slate-950/90 hover:bg-blue-600/20 border border-slate-800 hover:border-blue-500/50 rounded-xl cursor-pointer transition-all group shadow-sm"
                          >
                            <img
                              src={anime.image}
                              alt={anime.title}
                              referrerPolicy="no-referrer"
                              className="w-10 h-14 rounded-lg object-cover shrink-0 border border-slate-700/80 group-hover:scale-105 transition-transform"
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
                                <span className="text-[8px] text-slate-400 font-bold uppercase truncate max-w-[110px]">
                                  {anime.studio || 'Anime'}
                                </span>
                              </div>
                            </div>
                            <button className="px-2.5 py-1 bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white text-[9px] font-black uppercase rounded-lg shrink-0 transition-colors border border-blue-500/30">
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
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-3 rounded-2xl rounded-tl-none max-w-[80%] text-slate-300 text-xs font-bold">
                  <div className="flex gap-1.5 items-center">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-300 animate-bounce [animation-delay:0.4s]"></span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 ml-1">
                    {activeTab === 'trivia' ? 'Generating Trivia...' : 'Consulting Gemini AI...'}
                  </span>
                </div>
              )}

              <div ref={chatBottomRef} />
            </div>

            {/* Quick Prompt Chips */}
            {messages.length <= 2 && !isLoading && activeTab === 'chat' && (
              <div className="px-3 pt-2 pb-1 bg-slate-900/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0 border-t border-slate-800">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSend(prompt)}
                    className="px-2.5 py-1 bg-blue-950/60 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 hover:text-white rounded-lg text-[9px] font-bold tracking-tight whitespace-nowrap transition-all"
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
              <button
                type="button"
                onClick={handleStartListening}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition-all shrink-0 border ${
                  isListening
                    ? 'bg-rose-600 text-white border-rose-500 animate-pulse'
                    : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
                }`}
                title="Voice input (Speech to Text)"
              >
                <i className={`fa-solid ${isListening ? 'fa-microphone-lines' : 'fa-microphone'} text-xs sm:text-sm`}></i>
              </button>

              <input
                type="text"
                placeholder={activeTab === 'search' ? "Search AniList title or genre..." : "Ask Gemini anything about anime..."}
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

      {/* Floating Trigger Button */}
      <button
        onClick={() => {
          if (isOpen && window.speechSynthesis) window.speechSynthesis.cancel();
          setIsOpen(!isOpen);
        }}
        className="group relative flex items-center justify-center transition-all duration-300 transform active:scale-95"
        title="Open AniFlow AI Assistant"
      >
        <div className="absolute inset-0 bg-blue-600 blur-xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-400 rounded-2xl flex items-center justify-center shadow-2xl border-2 border-white/20 text-white group-hover:rotate-6 transition-transform overflow-hidden relative">
          <i className={`fa-solid ${isOpen ? 'fa-xmark' : 'fa-sparkles'} text-xl sm:text-2xl`}></i>
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 animate-pulse"></span>
        </div>
      </button>
    </div>
  );
};
