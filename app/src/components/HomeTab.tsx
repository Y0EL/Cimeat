"use client";

import { motion } from "framer-motion";
import { ArrowRight, Camera, History } from "lucide-react";

export default function HomeTab({ consumed, goal, progress, analyzing, randomCal, status, todayHist, onScan, onSelectItem, onDeleteItem, onSeeAll }: any) {
  return (
    <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">

      {/* Minimal Circle Ring */}
      <div className="rounded-[3rem] p-10 bg-white border border-[#F0EDE8]/50 shadow-sm flex flex-col items-center justify-center relative overflow-hidden">
        
        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
          <svg className="absolute w-full h-full -rotate-90 scale-110">
            <circle cx="96" cy="96" r="82" fill="transparent" stroke="#F8F7F4" strokeWidth="16" />
            <motion.circle cx="96" cy="96" r="82" fill="transparent" stroke="#FF6B35" strokeWidth="16"
              strokeDasharray={515.2}
              initial={{ strokeDashoffset: 515.2 }}
              animate={{ strokeDashoffset: 515.2 - (515.2 * Math.min(progress, 100) / 100), opacity: analyzing ? 0 : 1 }}
              transition={{ strokeDashoffset: { duration: 1.5, ease: "easeOut" } }}
              strokeLinecap="round" />
            {analyzing && (
              <motion.circle cx="96" cy="96" r="82" fill="transparent" stroke="#FF6B35" strokeWidth="6"
                strokeDasharray={515.2} strokeDashoffset={450}
                animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} />
            )}
          </svg>
          <div className="text-center z-10">
            <p className="text-5xl font-black text-[#1A1C1E] tracking-tighter mb-1">{analyzing ? randomCal : consumed}</p>
            <p className="text-xs text-[#8A8886] uppercase font-bold tracking-[0.2em]">Kilo Kalori</p>
          </div>
        </div>

        {/* Progress Mini Stats */}
        <div className="flex gap-8 items-center border-t border-[#F8F7F4] pt-6 w-full justify-center">
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
      </div>

      {/* Status Message */}
      <motion.div key={Math.floor(progress / 5)} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="px-6 py-4 rounded-[2rem] text-center border shadow-sm" style={{ backgroundColor: status.bg, borderColor: status.color + '20' }}>
        <p className="text-sm font-bold leading-relaxed" style={{ color: status.color }}>{status.text}</p>
      </motion.div>

      {/* Action: Scan Button */}
      <button onClick={onScan}
        className="w-full relative h-40 rounded-[2.5rem] bg-orange overflow-hidden group active:scale-[0.98] transition-all shadow-2xl shadow-orange/20">
        <div className="absolute inset-0 bg-gradient-to-br from-orange to-[#FF8C61]" />
        <div className="absolute top-0 right-0 p-6 opacity-20 transform translate-x-4 -translate-y-4">
          <Camera size={130} />
        </div>
        <div className="relative p-7 h-full flex flex-col justify-end items-start text-left">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mb-3">
            <Camera className="text-white" size={22} />
          </div>
          <h3 className="text-2xl font-black text-white leading-none mb-1">Mulai Scan AI</h3>
          <p className="text-white/70 text-sm">Ambil foto makanan & ketahui nutrisinya</p>
        </div>
        <div className="absolute bottom-7 right-7 w-12 h-12 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
          <ArrowRight className="text-white" size={22} />
        </div>
      </button>
      
      {/* Quick Jump Today Hist */}
      {todayHist.length > 0 && (
        <div className="space-y-3 pb-8">
          <div className="flex justify-between items-center px-1">
            <h4 className="text-sm font-black text-[#1A1C1E] opacity-40 uppercase tracking-widest">Baru Saja Dimakan</h4>
            <button onClick={onSeeAll} className="text-[10px] font-bold text-orange hover:bg-orange/5 px-2 py-1 rounded-full">{todayHist.length} Item →</button>
          </div>
          {/* Di sini panggil HistoryCard dari luar - nanti kita tentuin di page.tsx */}
          {/* Untuk sementara kita passing items ke page.tsx aja biar dikelola di sana */}
        </div>
      )}

    </motion.div>
  );
}
