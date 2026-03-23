"use client";

import { AnimatePresence, motion } from "framer-motion";
import { toPng } from 'html-to-image';
import { Apple, Play, QrCode, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { WeeklyChart } from "./Common";

export default function ShareGenerator({ trigger, onComplete, history, weeklyData, streak, settings, dailyMacros, aiRecommendation }: any) {
   const [dynamicQuote, setDynamicQuote] = useState("Terusin pola makan sehatnya ya!");
   const captureRef = useRef<HTMLDivElement>(null);
   const [isProcessing, setIsProcessing] = useState(false);
   const [showFlash, setShowFlash] = useState(false);

   useEffect(() => {
      if (trigger && !isProcessing) {
         fetchQuoteAndSnap();
      }
   }, [trigger]);

   const fetchQuoteAndSnap = async () => {
      setIsProcessing(true);

      // 1. Fetch Dynamic Quote from Backend
      try {
         const response = await fetch('http://localhost:8000/share-quote', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
               daily_stats: dailyMacros,
               streak: streak,
               settings: settings
            })
         });
         const data = await response.json();
         if (data.quote) setDynamicQuote(data.quote);
      } catch (err) {
         console.error('Failed to fetch quote:', err);
      }

      // 2. Trigger Snap
      setShowFlash(true);
      await new Promise(r => setTimeout(r, 400)); // wait for quote state to settle and chart to render

      try {
         if (captureRef.current) {
            const dataUrl = await toPng(captureRef.current, {
               cacheBust: true,
               backgroundColor: '#F8F7F4',
               pixelRatio: 2
            });

            const link = document.createElement('a');
            link.download = `Cimeat-Flex-${settings.username || 'User'}.png`;
            link.href = dataUrl;
            link.click();
         }
      } catch (err) {
         console.error('Flex failed:', err);
      } finally {
         setIsProcessing(false);
         setShowFlash(false);
         onComplete?.();
      }
   };

   const today = new Date().toLocaleDateString("id-ID");
   const todayItems = (history || []).filter((h: any) => h.date === today);
   const topItems = [...(todayItems.length > 0 ? todayItems : (history || []))].sort((a: any, b: any) => (b.score || 0) - (a.score || 0)).slice(0, 3);
   const levelInfo = getNutriLevel(history?.length || 0);

   return (
      <>
         {/* Visual Flash Effect on Main Screen */}
         <AnimatePresence>
            {showFlash && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-white z-[999] pointer-events-none"
               />
            )}
         </AnimatePresence>

         {/* Hidden 1:1 Capture Area */}
         <div className="fixed pointer-events-none" style={{ left: '-1000px', top: '0', width: '800px', height: '800px' }}>
            <div
               ref={captureRef}
               style={{ width: '800px', height: '800px' }}
               className="bg-[#F8F7F4] flex flex-col p-8 relative overflow-hidden font-sans"
            >
               {/* Abstract Background patterns */}
               <div className="absolute top-[-80px] right-[-80px] w-64 h-64 bg-orange/10 rounded-full blur-[80px]" />

               {/* Header Section */}
               <div className="flex justify-between items-center z-10 border-b-2 border-[#F0EDE8]/50 pb-3">
                  <h1 className="text-3xl font-black text-[#1A1C1E] tracking-tighter uppercase italic">CIMEAT</h1>
                  <div className="text-right">
                     <p className="text-[10px] font-black text-[#8A8886] uppercase tracking-widest">{settings.username || "USER"}</p>
                     <p className="text-[8px] font-bold text-[#BDBDBD] mt-0.5">{today}</p>
                  </div>
               </div>

               {/* Main Body */}
               <div className="flex-1 flex flex-col justify-start py-4 z-10 overflow-hidden gap-4">

                  {/* Massive Streak */}
                  <div className="text-center py-2">
                     <h2 className="text-[80px] font-black text-[#1A1C1E] leading-none tracking-tighter tabular-nums flex items-baseline justify-center">
                        {streak}
                        <span className="text-2xl italic text-orange ml-6 uppercase">HARI  STREAK 🔥</span>
                     </h2>
                     <div className="mt-1 text-[#1A1C1E] font-black italic uppercase tracking-[0.2em] text-sm">
                        {levelInfo.title}
                     </div>
                  </div>

                  {/* Chart Card */}
                  <div className="w-full bg-white p-5 rounded-[2rem] border-2 border-[#F0EDE8]/50 shadow-sm">
                     <div className="flex justify-between items-end mb-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1A1C1E]">GRAFIK KALORI</p>
                        <p className="text-sm font-black text-orange italic">TARGET: {settings.calorieGoal} KCAL</p>
                     </div>
                     <div className="h-24">
                        <WeeklyChart data={weeklyData} goal={settings.calorieGoal} />
                     </div>
                  </div>

                  {/* Nutritional Status Wins */}
                  <div className="space-y-2">
                     <div className="flex justify-between items-center pl-2">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8886]">STATUS NUTRISI HARIAN</p>
                        {dailyMacros?.calories <= settings?.calorieGoal && (
                           <div className="bg-green-500/10 text-green-600 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border border-green-500/20">
                              🎯 Goal Reached
                           </div>
                        )}
                     </div>
                     <div className="flex gap-4">
                        <div className="flex-1 bg-white p-3 rounded-2xl border-2 border-[#F0EDE8]/50 flex items-center justify-between shadow-sm">
                           <div>
                              <p className="text-[8px] font-black text-[#8A8886] uppercase">Protein</p>
                              <p className="text-lg font-black text-[#1A1C1E] leading-none">{Math.round(dailyMacros?.protein || 0)}g</p>
                           </div>
                           <div className="w-1.5 h-6 bg-green-500 rounded-full opacity-50" />
                        </div>
                        <div className="flex-1 bg-white p-3 rounded-2xl border-2 border-[#F0EDE8]/50 flex items-center justify-between shadow-sm">
                           <div>
                              <p className="text-[8px] font-black text-[#8A8886] uppercase">Karbo</p>
                              <p className="text-lg font-black text-[#1A1C1E] leading-none">{Math.round(dailyMacros?.carbs || 0)}g</p>
                           </div>
                           <div className="w-1.5 h-6 bg-orange-400 rounded-full opacity-50" />
                        </div>
                        <div className="flex-1 bg-white p-3 rounded-2xl border-2 border-[#F0EDE8]/50 flex items-center justify-between shadow-sm">
                           <div>
                              <p className="text-[8px] font-black text-[#8A8886] uppercase">Lemak</p>
                              <p className="text-lg font-black text-[#1A1C1E] leading-none">{Math.round(dailyMacros?.fat || 0)}g</p>
                           </div>
                           <div className="w-1.5 h-6 bg-red-400 rounded-full opacity-50" />
                        </div>
                     </div>
                  </div>

                  {/* Highlights */}
                  <div className="space-y-2">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8A8886] pl-2">MENU TERBAIK HARI INI</p>
                     <div className="flex gap-2">
                        {topItems.map((item: any, idx: number) => (
                           <div key={idx} className="flex-1 bg-white px-4 py-2.5 rounded-2xl border-2 border-[#F0EDE8]/50 flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-green-50 flex items-center justify-center text-green-500 font-black text-[10px] shrink-0">#{idx + 1}</div>
                              <p className="font-black text-[#1A1C1E] text-xs leading-tight truncate">{item.name}</p>
                           </div>
                        ))}
                     </div>
                  </div>

                  {/* Dynamic AI Quote Section */}
                  <div className="bg-orange/5 py-4 px-10 rounded-[2rem] border-2 border-orange/10 relative overflow-hidden flex flex-col items-center text-center gap-1 group">
                     <div className="absolute top-0 right-0 p-2 opacity-5"><Sparkles size={40} className="text-orange" /></div>
                     <p className="text-[7px] font-black uppercase tracking-[0.4em] text-orange mb-1">PESAN DARI CIMIT</p>
                     <p className="text-sm font-black italic text-[#1A1C1E] leading-tight w-full">
                        "{dynamicQuote}"
                     </p>
                  </div>
               </div>

               {/* Bottom Section - Compact One Row */}
               <div className="flex items-center justify-between z-10 pt-3 border-t-2 border-[#F0EDE8]/50">
                  <div className="flex flex-col gap-1.5">
                     <p className="text-[10px] font-black italic text-[#1A1C1E] uppercase">JOIN SEKARANG!</p>
                     <div className="flex gap-2">
                        <div className="bg-[#1A1C1E] px-2.5 py-1 rounded-lg text-white flex items-center gap-1.5">
                           <Apple size={12} /> <span className="text-[8px] font-black uppercase">App Store</span>
                        </div>
                        <div className="bg-[#1A1C1E] px-2.5 py-1 rounded-lg text-white flex items-center gap-1.5">
                           <Play size={12} /> <span className="text-[8px] font-black uppercase">Play Store</span>
                        </div>
                     </div>
                  </div>

                  <div className="flex items-center gap-4">
                     <div className="text-right">
                        <p className="text-[11px] font-black text-[#1A1C1E] tracking-tighter">CIMEAT.COM</p>
                        <p className="text-[8px] font-black text-[#8A8886] uppercase tracking-widest mt-0.5">HEALTH COACH</p>
                     </div>
                     <div className="w-14 h-14 bg-white p-1 rounded-xl shadow-lg border border-[#F0EDE8]">
                        <QrCode size={48} className="text-black" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </>
   );
}

function getNutriLevel(historyCount: number) {
   const level = Math.floor(historyCount / 10) + 1;
   const titles = ["Newbie Eater", "Nutri Scout", "Macro Guard", "Calorie Sage", "Fit Legend", "Cimeat Master"];
   return { level, title: titles[Math.min(level - 1, titles.length - 1)] };
}
