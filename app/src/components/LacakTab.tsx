"use client";

import { motion } from "framer-motion";
import { Camera, Flame, Loader2, RefreshCcw, ScanLine, Sparkles, Zap, ChefHat } from "lucide-react";
import { MacroBar, WeeklyChart } from "./Common";

export default function LacakTab({ settings, dailyMacros, streak, weeklyData, weekMac, aiRecommendation, loadingRec, onRefreshRec, onOpenRecipe }: any) {
  const goal = settings.calorieGoal;
  
  return (
    <motion.div key="lacak" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-36">
      
      {/* AI Smart Coaching Section */}
      <div className="rounded-[2.5rem] p-8 glass-dark bg-[#2A2D30]/90 text-white overflow-hidden relative group border border-white/5 shadow-xl">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange/20 rounded-full blur-3xl group-hover:bg-orange/30 transition-all" />
          <div className="relative flex items-center justify-between mb-4">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-orange to-[#FF8C61] flex items-center justify-center shadow-[0_5px_15px_-5px_#FF6B35]">
                   <Sparkles size={18} className="text-white" />
                </div>
                <h4 className="text-xl font-black tracking-tight">AI Coach</h4>
             </div>
             <div className="flex items-center gap-2">
               <button onClick={onOpenRecipe} 
                  className="px-3 py-1.5 bg-orange hover:bg-[#FF8C61] text-white rounded-full transition-all active:scale-90 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-widest shadow-[0_5px_15px_-5px_#FF6B35]">
                  <ChefHat size={14} /> Resep
               </button>
               <button onClick={onRefreshRec} disabled={loadingRec} 
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full transition-all active:scale-90 disabled:opacity-50 border border-white/10">
                  <RefreshCcw size={14} className={loadingRec ? "animate-spin text-orange" : "text-white"} />
               </button>
             </div>
          </div>

          <div className="relative min-h-[80px] flex items-center">
             {loadingRec ? (
                <div className="w-full space-y-3">
                   <div className="h-4 bg-white/10 rounded-full w-full animate-pulse" />
                   <div className="h-4 bg-white/10 rounded-full w-5/6 animate-pulse" />
                   <div className="h-4 bg-white/10 rounded-full w-4/6 animate-pulse" />
                </div>
             ) : (
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-white/80 text-[15px] leading-relaxed font-medium">
                   "{aiRecommendation || "Belum ada saran untuk saat ini. Coba catat makananmu dulu bro!"}"
                </motion.p>
             )}
          </div>
          
          <div className="mt-6 pt-5 border-t border-white/10 flex items-center justify-between">
             <p className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Contextual Insights</p>
             <div className="h-1 w-12 bg-white/10 rounded-full overflow-hidden">
                <motion.div animate={{ x: ["-100%", "100%"] }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }} className="h-full w-1/2 bg-orange rounded-full" />
             </div>
          </div>
      </div>

      {/* Daily Macro Card */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-[#F0EDE8]/50 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center gap-4 mb-6">
           <div className="w-14 h-14 rounded-[1.5rem] bg-orange/10 flex items-center justify-center text-orange border border-orange/20">
              <Zap size={28} />
           </div>
           <div>
              <h3 className="font-black text-[#1A1C1E]">Nutrisi Makro Harian</h3>
              <p className="text-xs text-[#8A8886] font-medium">Berdasarkan target personalmu</p>
           </div>
        </div>
        <div className="space-y-4">
          <MacroBar label="Protein" current={dailyMacros.protein} target={settings.proteinGoal} color="#22C55E" />
          <MacroBar label="Karbo"   current={dailyMacros.carbs}   target={settings.carbsGoal}   color="#F59E0B" />
          <MacroBar label="Lemak"   current={dailyMacros.fat}     target={settings.fatGoal}     color="#EF4444" />
        </div>
      </div>

      {/* Weekly Insight Section */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-[#F0EDE8]/50 shadow-sm transition-shadow hover:shadow-md">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-[0.2em] mb-1">Weekly Streak</p>
            <p className="text-3xl font-black text-[#1A1C1E]">{streak} <span className="text-sm font-black text-orange ml-1">hari</span></p>
          </div>
          <div className="w-14 h-14 rounded-[1.5rem] bg-orange/10 flex items-center justify-center text-orange border border-orange/20 shadow-inner">
            <Flame size={28} className="drop-shadow-sm" />
          </div>
        </div>
        
        <div className="mb-8 p-4 bg-[#F8F7F4] rounded-2xl border border-[#F0EDE8]">
           <div className="flex justify-between items-end mb-4">
              <p className="text-[11px] font-black uppercase tracking-widest text-[#1A1C1E]">Grafik Kalori Mingguan</p>
              <p className="text-xs font-black text-orange">Avg: {Math.round(weeklyData.reduce((a: any, d: any) => a + d.calories, 0) / 7)} <span className="text-[9px] text-[#8A8886]">Kcal</span></p>
           </div>
           <WeeklyChart data={weeklyData} goal={goal} />
        </div>

        <div className="border-t border-[#F8F7F4] pt-6">
          <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-[0.2em] mb-4">Total Makro Minggu Ini</p>
          <div className="space-y-3">
            <MacroBar label="Protein" current={weekMac.protein} target={settings.proteinGoal * 7} color="#22C55E" />
            <MacroBar label="Karbo"   current={weekMac.carbs}   target={settings.carbsGoal * 7}   color="#F59E0B" />
            <MacroBar label="Lemak"   current={weekMac.fat}     target={settings.fatGoal * 7}     color="#EF4444" />
          </div>
        </div>
      </div>

    </motion.div>
  );
}
