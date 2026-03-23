"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, QrCode, Sparkles, TrendingUp, Trophy, Apple, Play, Loader2 } from "lucide-react";
import { WeeklyChart } from "./Common";
import { useState, useRef } from "react";
import { toPng } from 'html-to-image';

export default function ShareModal({ isOpen, onClose, history, weeklyData, streak, settings, historyCount }: any) {
  const [downloading, setDownloading] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  
  const today = new Date().toLocaleDateString("id-ID");
  const todayItems = (history || []).filter((h: any) => h.date === today);

  const handleDownload = async () => {
    if (!captureRef.current || downloading) return;
    
    setDownloading(true);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 300);

    try {
      const dataUrl = await toPng(captureRef.current, { 
        cacheBust: true,
        backgroundColor: '#F8F7F4'
      });
      
      const link = document.createElement('a');
      link.download = `Cimeat-Achievement-${settings.username || 'User'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Download failed:', err);
      alert("Waduh, gagal snap fotonya bro. Coba lagi ya!");
    } finally {
      setDownloading(false);
    }
  };
  
  // Top 3 food by nutrition score
  const topItems = [...(todayItems.length > 0 ? todayItems : history)].sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).slice(0, 3);
  
  const levelInfo = getNutriLevel(historyCount || 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100]" />
          
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 sm:p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="bg-[#F8F7F4] w-full max-w-sm rounded-[3rem] overflow-hidden shadow-2xl border-4 border-white relative max-h-[92vh] flex flex-col"
            >
              <AnimatePresence>
                {showFlash && (
                  <motion.div 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    exit={{ opacity: 0 }} 
                    className="absolute inset-0 bg-white z-[200] pointer-events-none" 
                  />
                )}
              </AnimatePresence>

              {/* Achievement Card Content */}
              <div id="capture-area" ref={captureRef} className="flex flex-col overflow-y-auto scrollbar-hide flex-1">
                 {/* Header Banner - High Impact */}
                 <div className="bg-gradient-to-br from-orange to-[#FF8C61] p-6 text-white relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 p-2 opacity-20"><Sparkles size={100} /></div>
                    <div className="relative z-10 flex flex-col gap-3">
                       <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xl flex items-center justify-center border border-white/30">
                             <Trophy size={20} className="text-white fill-white/20" />
                          </div>
                          <div>
                             <h2 className="text-xl font-black tracking-tight leading-none uppercase italic">GOKIL BANGET!</h2>
                             <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mt-1">Pencapaian {settings.username || "User"}</p>
                          </div>
                       </div>
                       
                       <div className="flex gap-4 items-end mt-1">
                          <div>
                             <p className="text-[10px] font-black uppercase opacity-60">Nutri Level</p>
                             <p className="text-2xl font-black italic leading-none">{levelInfo.title}</p>
                          </div>
                          <div className="bg-white/20 px-3 py-1 rounded-full border border-white/20">
                             <span className="text-[9px] font-black uppercase tracking-tighter">Streak {streak} Hari 🔥</span>
                          </div>
                       </div>
                    </div>
                 </div>

                 <div className="p-4 space-y-4">
                    {/* Weekly Report Group */}
                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-[#F0EDE8]/50">
                       <div className="flex justify-between items-end mb-3">
                          <p className="text-[9px] font-black uppercase tracking-widest text-[#1A1C1E]">Grafik Konsumsi Kalori</p>
                          <p className="text-[9px] font-black text-orange">TARGET: {settings.calorieGoal}</p>
                       </div>
                       <WeeklyChart data={weeklyData} goal={settings.calorieGoal} />
                    </div>

                    {/* Top Eating Highlights */}
                    <div className="space-y-2">
                       <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#8A8886] pl-2">Top 3 Healthy Food Choice</p>
                       <div className="space-y-2">
                          {topItems.map((item: any, idx: number) => (
                             <div key={idx} className="bg-white rounded-2xl p-3 border border-[#F0EDE8]/50 flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-2">
                                   <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-[#22C55E] text-xs font-black">#{idx+1}</div>
                                   <div>
                                      <h4 className="font-black text-xs text-[#1A1C1E] line-clamp-1">{item.name}</h4>
                                      <p className="text-[9px] text-[#8A8886] font-bold uppercase">{item.calories} Kcal • Score {item.score}/100</p>
                                   </div>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    {/* Footer / QR / CTA */}
                    <div className="bg-[#1A1C1E] rounded-[2rem] p-4 text-white flex justify-between items-center relative overflow-hidden shrink-0">
                       <div className="relative z-10 flex flex-col gap-2">
                          <div className="flex gap-2">
                             <div className="flex flex-col items-center gap-0.5">
                                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center"><Apple size={12} /></div>
                                <span className="text-[5px] font-black uppercase opacity-60 tracking-tighter">AppStore</span>
                             </div>
                             <div className="flex flex-col items-center gap-0.5">
                                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center"><Play size={12} /></div>
                                <span className="text-[5px] font-black uppercase opacity-60 tracking-tighter">Playstore</span>
                             </div>
                          </div>
                          <p className="text-[11px] font-black italic tracking-tighter leading-tight mt-1">Download Cimeat <br /> Sekarang!</p>
                       </div>
                       
                       <div className="flex flex-col items-center gap-1.5 relative z-10">
                          <div className="w-16 h-16 bg-white p-1.5 rounded-xl shadow-xl rotate-3">
                             <QrCode size={52} className="text-black" />
                          </div>
                          <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">cimeat.com</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* Share Controls (Non-captured) */}
              <div className="p-4 bg-white border-t border-[#F0EDE8]/50 flex gap-2 shrink-0">
                 <button 
                   onClick={handleDownload}
                   disabled={downloading}
                   className="flex-1 bg-white border-2 border-[#1A1C1E] text-[#1A1C1E] h-12 rounded-2xl font-black text-sm flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                 >
                    {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    {downloading ? "Snapping..." : "Simpan Gambar"}
                 </button>
                 <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-[#F8F7F4] flex items-center justify-center text-[#8A8886] hover:bg-black/5">
                    <X size={18} />
                 </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function getNutriLevel(historyCount: number) {
  const level = Math.floor(historyCount / 10) + 1;
  const exp = (historyCount % 10) * 10;
  const titles = ["Newbie Eater", "Nutri Scout", "Macro Guard", "Calorie Sage", "Fit Legend", "Cimeat Master"];
  return { level, exp, title: titles[Math.min(level - 1, titles.length - 1)] };
}
