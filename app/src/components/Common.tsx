"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Cookie, Moon, Sparkles, Sun, SunDim, Trash2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function StatItem({ label, val, unit, color }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <div>
        <p className="text-[10px] text-[#8A8886] font-black uppercase leading-none mb-1">{label}</p>
        <p className="text-base font-black text-[#1A1C1E] leading-none">{val} <span className="text-[10px] text-[#8A8886]">{unit}</span></p>
      </div>
    </div>
  );
}

export function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("relative flex-1 flex flex-col items-center justify-center h-full",
      active ? "text-orange" : "text-[#B0ADAA]")}>
      <motion.div 
        animate={{ scale: active ? 1.15 : 1, y: active ? -8 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 20 }}
        className={cn("p-2.5 rounded-2xl", active && "bg-orange/10 shadow-inner")}
      >
        {icon}
      </motion.div>
      <AnimatePresence>
        {active && (
          <motion.span 
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="absolute bottom-2.5 text-[9px] font-black uppercase tracking-tighter"
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}

export function HistoryCard({ item, onClick, onDelete }: any) {
  const scoreColor = item.score >= 80 ? "#22C55E" : item.score >= 50 ? "#F59E0B" : "#EF4444";
  const catIcon = item.category === "Sarapan" ? <Sun size={13} /> :
    item.category === "Makan Siang" ? <SunDim size={13} /> :
    item.category === "Makan Malam" ? <Moon size={13} /> : <Cookie size={13} />;

  return (
    <div className="w-full bg-white rounded-[1.8rem] p-4 flex items-center gap-3 shadow-sm border border-[#F0EDE8]/60 hover:border-orange/30 hover:shadow-md transition-all">
      <button onClick={onClick} className="flex items-center gap-3 flex-1 text-left min-w-0">
        <div className="w-14 h-14 rounded-2xl bg-[#F8F7F4] overflow-hidden flex-shrink-0 border border-[#F0EDE8]/50">
          {item.image
            ? <img src={item.image} className="w-full h-full object-cover" alt="food" />
            : <div className="w-full h-full flex items-center justify-center"><Sparkles className="text-orange/40" size={22} /></div>}
        </div>
        <div className="min-w-0">
          <h4 className="text-[15px] font-black text-[#1A1C1E] leading-tight mb-1 truncate">{item.name}</h4>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[#F8F7F4] px-2 py-0.5 rounded-full border border-[#F0EDE8]">
              <span className="text-orange">{catIcon}</span>
              <p className="text-[9px] text-[#1A1C1E] font-black uppercase">{item.category?.split(" ")[0]}</p>
            </div>
            <div className="w-1 h-1 rounded-full bg-[#E5E2DE]" />
            <p className="text-[10px] font-bold" style={{ color: scoreColor }}>⭐ {item.score}</p>
          </div>
        </div>
      </button>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <p className="text-xl font-black text-orange leading-none">{item.calories}<span className="text-[9px] ml-0.5 uppercase">Kcal</span></p>
        <p className="text-[9px] text-[#8A8886] font-bold uppercase">{item.time}</p>
        <button onClick={e => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 rounded-full text-[#EF4444] bg-red-50 active:scale-90 transition-transform mt-0.5">
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

export function MacroBar({ label, current, target, color }: any) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-[#8A8886] font-black uppercase w-11 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
      <span className="text-[10px] text-[#1A1C1E] font-black w-20 text-right flex-shrink-0">{Math.round(current)}/{target}g</span>
    </div>
  );
}

export function NutrientBox({ label, val, unit, color }: any) {
  return (
    <div className="bg-[#F8F7F4] p-3 rounded-2xl border border-[#F0EDE8] text-center">
      <p className="text-[8px] font-black text-[#8A8886] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-base font-black text-[#1A1C1E] leading-none">{Math.round(val)}<span className="text-[9px] ml-0.5 text-[#8A8886] font-bold">{unit}</span></p>
      <div className="h-1 w-5 mx-auto mt-2 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E2DE" }}>
        <div className="h-full w-3/5 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

export function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white/50 rounded-[2rem] p-10 border border-dashed border-[#E8E6E1] text-center">
      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="text-4xl mb-3 opacity-20">🥗</motion.div>
      <p className="text-sm font-black text-[#1A1C1E] mb-1">Belum ada makanan hari ini!</p>
      <p className="text-xs text-[#8A8886] mb-5">Foto makananmu — AI hitung kalorinya dalam detik ⚡</p>
      <button onClick={onScan}
        className="inline-flex items-center gap-2 bg-orange text-white text-xs font-black px-5 py-2.5 rounded-full active:scale-95 transition-transform shadow-lg shadow-orange/20">
        Scan Sekarang 📸
      </button>
    </motion.div>
  );
}

export function GoalSlider({ label, unit, value, onChange, min, max, step }: any) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center mb-1">
        <label className="text-[10px] font-black text-[#8A8886] uppercase tracking-[0.2em]">{label}</label>
        <span className="text-lg font-black text-orange">{value} <span className="text-xs text-[#8A8886] font-bold">{unit}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-orange h-1.5 cursor-pointer bg-[#F8F7F4] rounded-full" />
    </div>
  );
}

export function WeeklyChart({ data, goal }: { data: any[]; goal: number }) {
  const maxVal = Math.max(...data.map(d => d.calories), goal, 1);
  const barH   = 80;
  return (
    <div className="flex items-end gap-1.5" style={{ height: barH + 32 }}>
      {data.map((d, i) => {
        const h  = d.calories === 0 ? 3 : (d.calories / maxVal) * barH;
        const bg = d.isToday ? "#FF6B35" : d.calories > goal ? "#EF4444" : "#F0EDE8";
        const tc = d.isToday ? "#FF6B35" : "#BDBDBD";
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: barH }}>
              <motion.div initial={{ height: 0 }} animate={{ height: h }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: "easeOut" }}
                className="w-full rounded-t-lg" style={{ backgroundColor: bg, minHeight: 3 }} />
            </div>
            <span className="text-[7px] sm:text-[9px] font-black uppercase text-center" style={{ color: tc }}>{d.day?.slice(0, 3)}</span>
          </div>
        );
      })}
    </div>
  );
}
