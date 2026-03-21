"use client";

import { motion } from "framer-motion";
import { Flame, Loader2, RefreshCcw, Sparkles, Zap } from "lucide-react";
import { MacroBar, WeeklyChart } from "./Common";

export default function LacakTab({ settings, dailyMacros, streak, weeklyData, weekMac, aiRecommendation, loadingRec, onRefreshRec }: any) {
  const goal = settings.calorieGoal;
  
  return (
    <motion.div key="lacak" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6 pb-20">
      
      {/* AI Smart Coaching Section (NEW) */}
      <div className="rounded-[2.5rem] p-8 bg-[#1A1C1E] text-white overflow-hidden relative group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange/20 rounded-full blur-3xl group-hover:bg-orange/30 transition-all" />
          <div className="relative flex items-center justify-between mb-4">
             <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange flex items-center justify-center">
                   <Sparkles size={16} className="text-white" />
                </div>
                <h4 className="text-xl font-black">AI Nutrition Coach</h4>
             </div>
             <button onClick={onRefreshRec} disabled={loadingRec} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-all active:scale-90 disabled:opacity-50">
                <RefreshCcw size={16} className={loadingRec ? "animate-spin" : ""} />
             </button>
          </div>

          <div className="relative">
             {loadingRec ? (
                <div className="py-4 flex flex-col items-center gap-3">
                   <Loader2 size={32} className="text-orange animate-spin" />
                   <p className="text-xs text-white/50 font-bold uppercase tracking-widest">Menganalisis pola makanmu...</p>
                </div>
             ) : (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-white/80 text-[15px] leading-relaxed font-medium">
                   "{aiRecommendation || "Belum ada saran untuk saat ini. Coba catat makananmu dulu bro!"}"
                </motion.p>
             )}
          </div>
          
          <div className="mt-6 pt-6 border-t border-white/10 flex items-center justify-between">
             <p className="text-[10px] font-black text-orange uppercase tracking-[0.2em]">Contextual Insights</p>
             <div className="h-1.5 w-12 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full w-2/3 bg-orange rounded-full" />
             </div>
          </div>
      </div>

      {/* Daily Macro Card */}
      <div className="bg-white rounded-[2.5rem] p-6 border border-[#F0EDE8]/50 shadow-sm">
        <div className="flex items-center gap-4 mb-6">
           <div className="w-14 h-14 rounded-2xl bg-orange/5 flex items-center justify-center text-orange">
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
      <div className="bg-white rounded-[2.5rem] p-6 border border-[#F0EDE8]/50 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest mb-1">Weekly Streak 🔥</p>
            <p className="text-3xl font-black text-[#1A1C1E]">{streak} <span className="text-sm font-medium text-[#8A8886]">hari berturut</span></p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-orange/5 flex items-center justify-center text-orange border border-orange/10">
            <Flame size={24} />
          </div>
        </div>
        
        <div className="mb-8">
           <div className="flex justify-between items-end mb-4">
              <p className="text-sm font-black text-[#1A1C1E]">Grafik Kalori Mingguan</p>
              <p className="text-xs font-bold text-[#8A8886]">Rata-rata: {Math.round(weeklyData.reduce((a: any, d: any) => a + d.calories, 0) / 7)} kcal</p>
           </div>
           <WeeklyChart data={weeklyData} goal={goal} />
        </div>

        <div className="border-t border-[#F8F7F4] pt-6">
          <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest mb-4">Total Makro Minggu Ini</p>
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
