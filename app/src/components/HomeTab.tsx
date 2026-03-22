"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Camera, Droplets, Mic, Plus, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { HistoryCard, cn } from "./Common";

export default function HomeTab({ consumed, goal, progress, analyzing, randomCal, status, todayHist, onScan, onSelectItem, onDeleteItem, onSeeAll, onVoiceLogStart, water, onUpdateWater }: any) {
  const addWater = () => {
    const today = new Date().toLocaleDateString("id-ID");
    const nw = Math.min(water + 1, 8); // Max 8 glasses visually
    onUpdateWater(nw);
    localStorage.setItem("cimeat_water_" + today, nw.toString());
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };


  return (
    <motion.div key="home" variants={containerVariants} initial="hidden" animate="show" exit={{ opacity: 0, y: -20 }} className="space-y-4 pb-36">

      {/* Advanced Circular Ring */}
      <motion.div variants={itemVariants} className="rounded-[2.5rem] bg-white border border-[#F0EDE8]/60 p-6 flex flex-col items-center justify-center relative shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)] hover:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] transition-shadow">
        <div className="relative w-48 h-48 flex items-center justify-center mb-6 mt-2">
          <svg className="absolute w-full h-full -rotate-90 scale-110 drop-shadow-sm">
            <circle cx="96" cy="96" r="82" fill="transparent" stroke="#F8F7F4" strokeWidth="18" />
            <motion.circle cx="96" cy="96" r="82" fill="transparent" stroke="url(#orangeGrad)" strokeWidth="18"
              strokeDasharray={515.2}
              initial={{ strokeDashoffset: 515.2 }}
              animate={{ strokeDashoffset: Math.max(0, 515.2 - (515.2 * Math.min(progress, 100) / 100)), opacity: analyzing ? 0 : 1 }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
              strokeLinecap="round" />
            {analyzing && (
              <motion.circle cx="96" cy="96" r="82" fill="transparent" stroke="#FF6B35" strokeWidth="6"
                strokeDasharray={515.2} strokeDashoffset={450}
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
            )}
            <defs>
              <linearGradient id="orangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF6B35" />
                <stop offset="100%" stopColor="#FF8C61" />
              </linearGradient>
            </defs>
          </svg>
          <div className="text-center z-10">
            <p className="text-5xl font-black text-[#1A1C1E] tracking-tighter mb-1">{analyzing ? randomCal : consumed}</p>
            <p className="text-[10px] text-[#8A8886] uppercase font-bold tracking-[0.2em]">Kcal Konsumsi</p>
          </div>
        </div>
        <div className="flex gap-8 items-center border-t border-[#F8F7F4] pt-5 w-full justify-center">
          <div className="text-center">
            <p className="text-[10px] text-[#8A8886] font-black uppercase mb-1">Target</p>
            <p className="text-sm font-black text-[#1A1C1E]">{goal}</p>
          </div>
          <div className="w-[1px] h-6 bg-[#F0EDE8]" />
          <div className="text-center">
            <p className="text-[10px] text-[#8A8886] font-black uppercase mb-1">Tersisa</p>
            <p className="text-sm font-black text-orange">{Math.max(0, goal - consumed)}</p>
          </div>
        </div>
      </motion.div>

      <div className="flex flex-col gap-4">
        {/* Status Message */}
        <motion.div variants={itemVariants} className="w-full p-4 rounded-[2rem] flex items-center justify-between text-left shadow-sm border px-6" style={{ backgroundColor: status.bg, borderColor: status.color + '20' }}>
          <p className="text-[13px] font-bold leading-relaxed" style={{ color: status.color }}>{status.text}</p>
          <div className="opacity-40" style={{ color: status.color }}><Sparkles size={18} /></div>
        </motion.div>

        {/* Water Tracker */}
        <motion.div variants={itemVariants} className="w-full rounded-[2.5rem] bg-white border border-[#F0EDE8]/60 p-6 shadow-sm relative overflow-hidden flex items-center justify-between group hover:border-[#3B82F6]/30 transition-all card-hover">
          <div className="absolute inset-0 bg-blue-500/5 transition-all duration-1000 ease-in-out" style={{ bottom: 0, top: `${100 - (water / 8) * 100}%` }}>
            <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="absolute inset-x-0 top-0 h-2 bg-blue-400/20 blur-sm" />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100/50 shadow-inner group-hover:scale-110 transition-transform">
                <Droplets size={26} className="text-[#3B82F6] fill-[#3B82F6]/20" />
            </div>
            <div>
              <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-wider mb-0.5">Hydration Vibe</p>
              <p className="text-2xl font-black text-[#1A1C1E]">{water}<span className="text-xs text-[#8A8886] ml-1">/ 8 glasses</span></p>
            </div>
          </div>
          <button onClick={addWater} className="relative z-10 w-12 h-12 bg-white hover:bg-blue-50 text-[#3B82F6] rounded-2xl flex items-center justify-center transition-all shadow-md active:scale-90 border border-blue-100 group-hover:rotate-12">
            <Plus size={24} strokeWidth={3} />
          </button>
        </motion.div>
      </div>

      {/* Daily Missions - Gen Z Gamification */}
      <motion.div variants={itemVariants} className="space-y-4">
        <div className="flex justify-between items-center px-2 mt-4">
          <h4 className="text-[11px] font-black text-[#1A1C1E] opacity-50 uppercase tracking-[0.2em]">Daily Missions</h4>
          <div className="flex items-center gap-1.5 bg-orange/5 px-3 py-1 rounded-full">
            <Sparkles size={10} className="text-orange" />
            <span className="text-[9px] font-black text-orange uppercase tracking-tighter">+50 EXP</span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
           <div className={cn("p-4 rounded-[2rem] border transition-all flex flex-col gap-3", water >= 8 ? "bg-green-50 border-green-100" : "bg-white border-[#F0EDE8]/60")}>
              <div className="w-8 h-8 rounded-xl bg-blue-100 flex items-center justify-center text-blue-500">
                <Droplets size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#1A1C1E] leading-tight">Water Goal</p>
                <p className="text-[9px] text-[#8A8886] font-bold">Drink 8 glasses</p>
              </div>
              <div className="h-1 w-full bg-[#F0EDE8] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 transition-all" style={{ width: `${(water / 8) * 100}%` }} />
              </div>
           </div>
           
           <div className={cn("p-4 rounded-[2rem] border transition-all flex flex-col gap-3", todayHist.length >= 3 ? "bg-green-50 border-green-100" : "bg-white border-[#F0EDE8]/60")}>
              <div className="w-8 h-8 rounded-xl bg-orange/10 flex items-center justify-center text-orange">
                <Camera size={16} />
              </div>
              <div>
                <p className="text-[10px] font-black text-[#1A1C1E] leading-tight">Meal Snap</p>
                <p className="text-[9px] text-[#8A8886] font-bold">Log 3 meals today</p>
              </div>
              <div className="h-1 w-full bg-[#F0EDE8] rounded-full overflow-hidden">
                <div className="h-full bg-orange transition-all" style={{ width: `${Math.min((todayHist.length / 3) * 100, 100)}%` }} />
              </div>
           </div>
        </div>
      </motion.div>

      {/* Action: Scan & Voice Buttons */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
        <button onClick={onScan}
          className="relative h-44 rounded-[2.5rem] bg-orange overflow-hidden group active:scale-[0.98] transition-all shadow-xl shadow-orange/20 border border-orange/40">
          <div className="absolute inset-0 bg-gradient-to-br from-orange to-[#FF8C61]" />
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 25, ease: "linear" }} className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform duration-500">
            <Camera size={100} />
          </div>
          <div className="relative p-7 h-full flex flex-col justify-end items-start text-left">
            <div className="w-10 h-10 rounded-[1rem] bg-white/20 backdrop-blur-md flex items-center justify-center mb-3 shadow-inner group-hover:rotate-12 transition-transform">
              <Camera className="text-white" size={20} />
            </div>
            <h3 className="text-lg font-black text-white leading-none mb-1">Scan AI</h3>
            <p className="text-white/80 text-[10px] font-medium leading-tight">Foto makanan & deteksi instan</p>
          </div>
        </button>

        <button onClick={onVoiceLogStart}
          className="relative h-44 rounded-[2.5rem] bg-white border border-[#F0EDE8]/60 overflow-hidden group active:scale-[0.98] transition-all shadow-sm hover:border-[#FF6B35]/30">
          <div className="relative p-7 h-full flex flex-col justify-end items-start text-left">
            <div className="w-10 h-10 rounded-[1rem] flex items-center justify-center mb-3 shadow-inner transition-all bg-[#F8F7F4] text-orange">
              <Mic size={20} />
            </div>
            <h3 className="text-lg font-black text-[#1A1C1E] leading-none mb-1">Voice Log</h3>
            <p className="text-[#8A8886] text-[10px] font-medium leading-tight">Sebut aja makanan lo langsung</p>
          </div>
        </button>
      </motion.div>
      
      {/* Quick Jump Today Hist */}
      {todayHist.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3 pb-8 mt-2">
          <div className="flex justify-between items-center px-2">
            <h4 className="text-[11px] font-black text-[#1A1C1E] opacity-50 uppercase tracking-[0.2em]">Baru Saja Dimakan</h4>
            <button onClick={onSeeAll} className="text-[10px] font-black text-orange hover:bg-orange/5 px-3 py-1.5 rounded-full transition-colors active:scale-95">Semua →</button>
          </div>
          <div className="space-y-2">
            {todayHist.slice(0, 3).map((item: any, idx: number) => (
              <motion.div key={item.id || `today-${idx}`} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1, type: "spring" }}>
                <HistoryCard item={item} onClick={() => onSelectItem(item)} onDelete={() => onDeleteItem(item.id)} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

    </motion.div>
  );
}
