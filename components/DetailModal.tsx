
import React, { useState } from 'react';
import { Anime } from '../types';

interface DetailModalProps {
  anime: Anime | null;
  onClose: () => void;
}

const DetailModal: React.FC<DetailModalProps> = ({ anime, onClose }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'watch'>('info');

  if (!anime) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/90 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-5xl bg-[#0f172a] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 text-white rounded-full transition-all border border-white/10"
        >
          <i className="fa-solid fa-xmark text-lg"></i>
        </button>

        {/* Banner Area */}
        <div className="relative h-48 sm:h-64 shrink-0 overflow-hidden">
          <img src={anime.banner || anime.image} className="w-full h-full object-cover opacity-40" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] to-transparent"></div>
          
          <div className="absolute bottom-0 left-0 w-full px-8 pb-4 flex items-end gap-6">
            <div className="hidden sm:block w-32 aspect-[2/3] rounded-xl overflow-hidden border-2 border-white/10 shadow-2xl shrink-0 translate-y-4">
              <img src={anime.image} className="w-full h-full object-cover" />
            </div>
            <div className="mb-4">
              <h2 className="text-2xl sm:text-4xl font-bold font-outfit text-white mb-2 leading-tight">{anime.title}</h2>
              <div className="flex flex-wrap gap-2">
                {anime.genres.map(g => (
                  <span key={g} className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 px-2 py-1 rounded-md border border-blue-500/20">{g}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-8 px-8 border-b border-white/5 bg-[#0f172a] pt-2 shrink-0">
          <button 
            onClick={() => setActiveTab('info')}
            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'info' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Details & Overview
            {activeTab === 'info' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full"></div>}
          </button>
          <button 
            onClick={() => setActiveTab('watch')}
            className={`pb-4 text-sm font-bold transition-all relative ${activeTab === 'watch' ? 'text-blue-500' : 'text-slate-500 hover:text-slate-300'}`}
          >
            Watch & Trailer
            {activeTab === 'watch' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full"></div>}
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {activeTab === 'info' ? (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              <div className="lg:col-span-2 space-y-8">
                <section>
                  <h3 className="text-xs uppercase font-black tracking-[0.2em] text-blue-500/60 mb-4">Synopsis</h3>
                  <p className="text-slate-300 leading-relaxed text-lg">{anime.description}</p>
                </section>

                {anime.relations && anime.relations.length > 0 && (
                  <section>
                    <h3 className="text-xs uppercase font-black tracking-[0.2em] text-blue-500/60 mb-4">Related Series</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {anime.relations.map(rel => (
                        <div key={rel.id} className="group cursor-pointer">
                          <div className="aspect-[2/3] rounded-xl overflow-hidden mb-2 border border-white/5 relative">
                             <img src={rel.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                             <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                               <i className="fa-solid fa-link text-white"></i>
                             </div>
                          </div>
                          <p className="text-[11px] font-bold text-slate-200 truncate">{rel.title}</p>
                          <p className="text-[10px] text-slate-500 uppercase">{rel.type}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                  <h3 className="text-xs uppercase font-black tracking-widest text-slate-500 mb-4">Metadata</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Score</span>
                      <span className="text-sm font-bold text-amber-500 flex items-center gap-1"><i className="fa-solid fa-star"></i> {anime.score}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Studio</span>
                      <span className="text-sm font-bold text-slate-200">{anime.studio}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-500">Release Time</span>
                      <span className="text-sm font-bold text-blue-400">{anime.airingTime}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-600/10 border border-blue-500/20 rounded-2xl p-6">
                   <h3 className="text-xs uppercase font-black tracking-widest text-blue-500 mb-4">Official Streams</h3>
                   <div className="space-y-2">
                     {anime.externalLinks?.slice(0, 4).map(link => (
                       <a 
                        key={link.site}
                        href={link.url}
                        target="_blank"
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-sm group"
                       >
                         <span className="text-slate-300 group-hover:text-white">{link.site}</span>
                         <i className="fa-solid fa-up-right-from-square text-[10px] text-blue-500"></i>
                       </a>
                     ))}
                   </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-10">
               {/* Video Embed */}
               {anime.trailer ? (
                 <section>
                    <h3 className="text-xs uppercase font-black tracking-[0.2em] text-blue-500/60 mb-6">Official Trailer</h3>
                    <div className="aspect-video w-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                      <iframe 
                        className="w-full h-full"
                        src={anime.trailer.site === 'youtube' ? `https://www.youtube.com/embed/${anime.trailer.id}` : `https://www.dailymotion.com/embed/video/${anime.trailer.id}`}
                        allowFullScreen
                      />
                    </div>
                 </section>
               ) : (
                 <div className="aspect-video w-full rounded-3xl bg-white/5 flex flex-col items-center justify-center text-slate-600 border border-dashed border-white/10">
                    <i className="fa-solid fa-video-slash text-4xl mb-4"></i>
                    <p>Trailer not available for this series.</p>
                 </div>
               )}

               {/* Simulated Player */}
               <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xs uppercase font-black tracking-[0.2em] text-blue-500/60">Server - HD Player (Simulated)</h3>
                    <div className="flex gap-2">
                      <span className="bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded">Fast Load</span>
                      <span className="bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-1 rounded">1080p</span>
                    </div>
                  </div>
                  <div className="bg-[#0b1120] border border-white/5 rounded-3xl p-8 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="w-20 h-20 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500">
                      <i className="fa-solid fa-circle-play text-4xl"></i>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-white">Unlock All Episodes</h4>
                      <p className="text-sm text-slate-400 max-w-sm mx-auto mt-2">To support the industry, we provide direct links to authorized streaming providers where this content is hosted.</p>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4 w-full">
                       {anime.externalLinks?.map(link => (
                         <a 
                          key={link.site}
                          href={link.url}
                          target="_blank"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-2xl transition-all shadow-lg shadow-blue-600/20"
                         >
                           Watch on {link.site}
                         </a>
                       ))}
                    </div>
                  </div>
               </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetailModal;
