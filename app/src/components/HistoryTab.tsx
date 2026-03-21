"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Trash2, ChevronDown, Sparkles } from "lucide-react";
import { useState } from "react";
import { cn, NutrientBox } from "./Common";

export default function HistoryTab({ history, onSelectItem, onDeleteItem, onClear }: any) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      dateObj: d,
      dateStr: d.toLocaleDateString("id-ID"),
      dayName: i === 0 ? "Hari Ini" : i === 1 ? "Kemarin" : d.toLocaleDateString("id-ID", { weekday: "short" }),
      dateNum: d.getDate(),
    };
  }).reverse();

  const [selectedDate, setSelectedDate] = useState(days[6].dateStr);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredHistory = history.filter((h: any) => h.date === selectedDate);
  const CATS = ["Sarapan", "Makan Siang", "Makan Malam", "Cemilan"];
  const grouped = CATS
    .map(cat => ({
      cat,
      items: filteredHistory.filter((h: any) => h.category === cat),
      total: filteredHistory.filter((h: any) => h.category === cat).reduce((a: any, c: any) => a + c.calories, 0)
    }))
    .filter(g => g.items.length > 0);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6 pb-36">
      
      <div className="flex justify-between items-center mb-2 px-2">
        <div>
           <h2 className="text-2xl font-black text-[#1A1C1E] tracking-tight">Riwayat Nutrisi</h2>
           <p className="text-xs text-[#8A8886] font-medium">Jurnal makanan harianmu</p>
        </div>
        {history.length > 0 && (
          <button onClick={onClear} className="p-3 text-[#EF4444] bg-red-50 hover:bg-red-100 rounded-2xl active:scale-95 transition-all">
            <Trash2 size={20} />
          </button>
        )}
      </div>

      {/* Calendar Ticker */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide py-4 px-2 -mx-2 snap-x">
        {days.map((d) => {
          const isActive = selectedDate === d.dateStr;
          return (
            <button key={d.dateStr} onClick={() => setSelectedDate(d.dateStr)}
              className={cn("snap-center flex-shrink-0 flex flex-col items-center justify-center min-w-[5.5rem] px-3 h-[6.5rem] rounded-[2rem] transition-all border",
                isActive ? "bg-orange border-orange text-white" : "bg-white border-[#F0EDE8]/60 text-[#8A8886] hover:bg-[#F8F7F4]")}>
              <span className={cn("text-[9px] font-black uppercase tracking-wider mb-1", isActive ? "opacity-80 text-white" : "opacity-80 text-[#8A8886]")}>{d.dayName}</span>
              <span className={cn("text-3xl font-black", isActive ? "text-white" : "text-[#1A1C1E]")}>{d.dateNum}</span>
            </button>
          );
        })}
      </div>

      <motion.div variants={containerVariants} initial="hidden" animate="show" className="min-h-[300px]">
        {filteredHistory.length > 0 ? (
          <div className="space-y-6">
            {grouped.map((g: any) => (
              <motion.div variants={itemVariants} key={g.cat} className="space-y-3">
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg bg-white w-8 h-8 rounded-full flex items-center justify-center shadow-sm border border-[#F0EDE8]/50">{g.cat === "Sarapan" ? "☀️" : g.cat === "Makan Siang" ? "🌤️" : g.cat === "Makan Malam" ? "🌙" : "🍪"}</span>
                    <h4 className="font-black text-[#1A1C1E]">{g.cat}</h4>
                  </div>
                  <span className="text-[10px] font-black text-orange bg-orange/10 px-3 py-1.5 rounded-full uppercase tracking-widest">{g.total} Kcal</span>
                </div>
                
                <div className="space-y-3 relative">
                  {g.items.map((item: any) => {
                    const isExpanded = expandedId === item.id;
                    const scoreColor = item.score >= 80 ? "#22C55E" : item.score >= 50 ? "#F59E0B" : "#EF4444";
                    
                    return (
                      <motion.div layout key={item.id} onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className={cn("w-full bg-white rounded-[2rem] p-4 flex flex-col border transition-all cursor-pointer overflow-hidden transform-gpu",
                          isExpanded ? "border-orange/40 shadow-xl shadow-orange/10 scale-[1.02] z-10" : "border-[#F0EDE8]/60 shadow-sm hover:border-orange/20")}>
                        
                        {/* Header Item */}
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 rounded-[1.2rem] bg-[#F8F7F4] overflow-hidden flex-shrink-0 border border-[#F0EDE8]/50 relative">
                            {item.image ? <img src={item.image} className="w-full h-full object-cover" alt="food" /> : <div className="w-full h-full flex items-center justify-center"><Sparkles className="text-orange/40" size={22} /></div>}
                            <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[1.2rem]" />
                          </div>
                          
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="text-[15px] font-black text-[#1A1C1E] leading-tight mb-1.5 truncate">{item.name}</h4>
                            <div className="flex items-center gap-2">
                              {item.weight && <span className="text-[10px] font-bold text-[#8A8886] bg-[#F8F7F4] px-2 py-0.5 rounded-md border border-[#F0EDE8]/50">{item.weight}g</span>}
                              <p className="text-[10px] font-bold" style={{ color: scoreColor }}>⭐ {item.score}</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <p className="text-xl font-black text-orange leading-none">{item.calories}<span className="text-[9px] ml-0.5 uppercase">Kcal</span></p>
                            <p className="text-[9px] text-[#8A8886] font-bold uppercase">{item.time}</p>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-4 pt-4 border-t border-[#F8F7F4]">
                               <div className="grid grid-cols-3 gap-2 mb-4">
                                  <NutrientBox label="Protein" val={item.protein} unit="g" color="#22C55E" />
                                  <NutrientBox label="Karbo" val={item.carbs} unit="g" color="#F59E0B" />
                                  <NutrientBox label="Lemak" val={item.fat} unit="g" color="#EF4444" />
                               </div>
                               <div className="flex gap-2">
                                  <button onClick={(e) => { e.stopPropagation(); onSelectItem(item); }} className="flex-1 py-3 bg-[#F8F7F4] hover:bg-orange/10 hover:text-orange text-[#1A1C1E] text-xs font-black rounded-xl transition-colors active:scale-95">Detail Laporan</button>
                                  <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); setExpandedId(null); }} className="px-5 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors active:scale-90"><Trash2 size={16} /></button>
                               </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Chevron Indicator */}
                        {!isExpanded && (
                          <div className="absolute bottom-1 right-1/2 translate-x-1/2 opacity-30 text-[#8A8886]">
                             <ChevronDown size={14} />
                          </div>
                        )}
                        
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div variants={itemVariants} className="text-center py-16 px-6 bg-white/40 rounded-[3rem] border border-dashed border-[#E8E6E1] mt-4 flex flex-col items-center">
              <motion.div animate={{ rotate: [0, -10, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 3 }} className="text-6xl mb-4 opacity-30 drop-shadow-sm">🗓️</motion.div>
              <h3 className="text-[#1A1C1E] font-black text-lg mb-1">Tidak Ada Data</h3>
              <p className="text-xs text-[#8A8886] max-w-[200px]">Kamu belum mencatat makanan apa pun pada tanggal ini.</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
