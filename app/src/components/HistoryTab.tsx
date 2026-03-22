"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Mic, Pause, Play, Square, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { cn, NutrientBox } from "./Common";

export default function HistoryTab({ history, onSelectItem, onDeleteItem, onClear }: any) {
  const [selectedDate, setSelectedDate] = useState("");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [vols, setVols] = useState<number[]>(new Array(32).fill(10));
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);
  const playingIdRef = useRef<string | null>(null);

  const stopAudio = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => { });
    }
    setPlayingId(null);
    playingIdRef.current = null;
    setIsPaused(false);
    setVols(new Array(32).fill(10));
  };

  const pauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  };

  const updateSpectrum = (currentId: string) => {
    if (!analyserRef.current || playingIdRef.current !== currentId) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(data);

    // Process data for 32 bars now
    const numBars = 32;
    const rawVols = [];
    const step = Math.floor(data.length / numBars);
    for (let i = 0; i < numBars; i++) {
      let sum = 0;
      const start = i * step;
      for (let j = 0; j < step; j++) sum += data[start + j];
      const avg = sum / step;
      // Increased multiplier for h-16 container
      rawVols.push(Math.max(5, (avg / 255) * 110));
    }

    // "Middle-ing" reorder logic for 32 bars
    const middleVols = new Array(numBars);
    let l = 15;
    let r = 16;
    for (let i = 0; i < numBars; i++) {
      if (i % 2 === 0) {
        if (l >= 0) middleVols[l--] = rawVols[i];
      } else {
        if (r < numBars) middleVols[r++] = rawVols[i];
      }
    }

    setVols(middleVols);
    animationRef.current = requestAnimationFrame(() => updateSpectrum(currentId));
  };

  const playAudio = (id: string, url: string) => {
    if (playingId === id && audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
      animationRef.current = requestAnimationFrame(() => updateSpectrum(id));
      return;
    }

    stopAudio();
    const audio = new Audio(url);
    audioRef.current = audio;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    audioCtxRef.current = ctx;
    const analyser = ctx.createAnalyser();
    const source = ctx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(ctx.destination);
    analyser.fftSize = 64;
    analyserRef.current = analyser;

    setPlayingId(id);
    playingIdRef.current = id;
    setIsPaused(false);
    audio.onended = () => stopAudio();
    audio.onerror = () => stopAudio();
    
    // Explicitly resume context for auto-start
    ctx.resume().then(() => {
      audio.play();
      animationRef.current = requestAnimationFrame(() => updateSpectrum(id));
    });
  };

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0); 
    d.setDate(d.getDate() - i);
    return {
      dateObj: d,
      dateStr: d.toLocaleDateString("id-ID"),
      dayName: i === 0 ? "Hari Ini" : i === 1 ? "Kemarin" : d.toLocaleDateString("id-ID", { weekday: "short" }),
      dateNum: d.getDate(),
      fullDay: d.toLocaleDateString("id-ID", { weekday: "long" }),
    };
  });

  // Set initial selected date if not set (Today is at index 0)
  if (!selectedDate && days.length > 0) setSelectedDate(days[0].dateStr);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredHistory = history.filter((h: any) => h.date === selectedDate);
  const CATS = ["Cemilan", "Makan Malam", "Makan Siang", "Sarapan"];
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
    <motion.div key="history" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-4 pb-36 pt-4">

      {/* Calendar Ticker - Compact Today-First */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide py-2 px-2 -mx-2 snap-x">
        {days.map((d, i) => {
          const isActive = selectedDate === d.dateStr;
          const isToday = i === 0;
          return (
            <button key={`ticker-day-${i}`} onClick={() => setSelectedDate(d.dateStr)}
              className={cn("snap-start flex-shrink-0 flex flex-col items-center justify-center min-w-[4.4rem] px-2 h-[5.2rem] rounded-[1.8rem] transition-all relative border",
                isActive ? "bg-orange border-orange text-white shadow-lg shadow-orange/10" : "bg-white border-[#F0EDE8] text-[#8A8886] hover:bg-[#F8F7F4]")}>
              {isToday && !isActive && <div className="absolute top-2 w-1.5 h-1.5 bg-orange rounded-full" />}
              <span className={cn("text-[8px] font-black uppercase tracking-[0.15em] mb-1.5", isActive ? "text-white/80" : "text-[#8A8886]")}>{d.dayName === "Hari Ini" ? "Kini" : d.dayName}</span>
              <span className={cn("text-2xl font-black", isActive ? "text-white" : "text-[#1A1C1E]")}>{d.dateNum}</span>
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

                <div className="space-y-2 relative">
                  {g.items.map((item: any, idx: number) => {
                    const isExpanded = expandedId === item.id;
                    const scoreColor = item.score >= 80 ? "#22C55E" : item.score >= 50 ? "#F59E0B" : "#EF4444";

                    return (
                      <motion.div layout key={item.id || `${g.cat}-${idx}`} onClick={() => setExpandedId(isExpanded ? null : item.id)}
                        className={cn("w-full bg-white rounded-[1.5rem] p-3 flex flex-col border transition-all cursor-pointer overflow-hidden transform-gpu",
                          isExpanded ? "border-orange shadow-lg shadow-orange/5 z-10" : "border-[#F0EDE8] shadow-sm hover:border-orange/20")}>

                        {/* Header Item */}
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl overflow-hidden flex-shrink-0 border border-[#F0EDE8] relative flex items-center justify-center bg-[#F8F7F4]",
                          )}>
                            {item.image ? (
                              <img src={item.image} className="w-full h-full object-cover" alt="food" />
                            ) : (
                              <div
                                className="relative group active:scale-95 transition-transform"
                                onClick={(e) => {
                                  if (item.audioLog) {
                                    e.stopPropagation();
                                    playingId === item.id ? stopAudio() : playAudio(item.id, item.audioLog);
                                  }
                                }}
                              >
                                <Mic className={cn(item.audioLog ? "text-orange" : "text-[#8A8886]/40")} size={20} />
                                {item.audioLog && (
                                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-orange rounded-full flex items-center justify-center text-white border-2 border-white shadow-sm">
                                    {playingId === item.id && !isPaused ? (
                                      <div className="flex gap-[1px]">
                                        <div className="w-[1px] h-1.5 bg-white animate-pulse" />
                                        <div className="w-[1px] h-1.5 bg-white animate-pulse [animation-delay:0.2s]" />
                                      </div>
                                    ) : (
                                      <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[4px] border-l-white border-b-[3px] border-b-transparent ml-0.5" />
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-[14px] font-black text-[#1A1C1E] leading-tight mb-0.5 truncate">{item.name}</h4>
                            <div className="flex items-center gap-2">
                              {item.weight && <span className="text-[9px] font-black text-[#8A8886] bg-[#F8F7F4] px-1.5 py-0.5 rounded border border-[#F0EDE8]">{item.weight}g</span>}
                              <p className="text-[9px] font-black" style={{ color: scoreColor }}>⭐ {item.score}</p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end flex-shrink-0">
                            <p className="text-lg font-black text-orange leading-none">{item.calories}<span className="text-[8px] ml-0.5 uppercase tracking-tighter">Kcal</span></p>
                            <p className="text-[8px] text-[#8A8886] font-bold uppercase mt-1">{item.time}</p>
                          </div>
                        </div>

                        {/* Expanded Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div key={`expanded-${item.id}`} initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 pt-3 border-t border-[#F8F7F4]">
                              <div className="grid grid-cols-3 gap-2 mb-3">
                                <NutrientBox label="Protein" val={item.protein} unit="g" color="#22C55E" />
                                <NutrientBox label="Karbo" val={item.carbs} unit="g" color="#F59E0B" />
                                <NutrientBox label="Lemak" val={item.fat} unit="g" color="#EF4444" />
                              </div>
                              <div className="flex flex-col gap-2">
                                <AnimatePresence mode="wait">
                                  {playingId === item.id ? (
                                    <motion.div
                                      key="playing"
                                      initial={{ opacity: 0, y: 10 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{ opacity: 0, y: -10 }}
                                      className="w-full bg-orange/5 border border-orange/10 rounded-[1.2rem] p-3 mb-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-1.5">
                                          <div className="w-1.5 h-1.5 rounded-full bg-orange animate-pulse" />
                                          <span className="text-[9px] font-black text-orange uppercase tracking-wider">Memutar...</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); isPaused ? playAudio(item.id, item.audioLog) : pauseAudio(); }}
                                            className="w-8 h-8 bg-white border border-[#F0EDE8] rounded-lg flex items-center justify-center text-orange transition-transform active:scale-90"
                                          >
                                            {isPaused ? <Play size={14} fill="currentColor" /> : <Pause size={14} fill="currentColor" />}
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); stopAudio(); }} className="w-8 h-8 bg-white border border-[#F0EDE8] rounded-lg flex items-center justify-center text-orange transition-transform active:scale-90">
                                            <Square size={14} fill="currentColor" />
                                          </button>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-[2px] h-10 w-full overflow-hidden">
                                        {vols.map((v, i) => (
                                          <motion.div key={i}
                                            animate={{ height: isPaused ? 4 : Math.max(4, v * 0.5) }}
                                            className="flex-1 bg-orange/40 rounded-full min-h-[4px]"
                                            transition={{ type: "spring", stiffness: 350, damping: 25 }}
                                          />
                                        ))}
                                      </div>

                                      <div className="flex gap-2 w-full mt-3">
                                        <button onClick={(e) => { e.stopPropagation(); onSelectItem(item); }} className="flex-1 py-2 bg-white border border-[#F0EDE8] text-[#1A1C1E] text-xs font-black rounded-lg transition-colors active:scale-95">Detail</button>
                                        <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); setExpandedId(null); }} className="px-4 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors active:scale-90"><Trash2 size={14} /></button>
                                      </div>
                                    </motion.div>
                                  ) : (
                                    <motion.div key="default" className="flex gap-2 w-full">
                                      {item.audioLog && (
                                        <button
                                          onClick={(e) => { e.stopPropagation(); playAudio(item.id, item.audioLog); }}
                                          className="flex-1 py-2 bg-orange/10 text-orange text-xs font-black rounded-lg hover:bg-orange hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 group border border-orange/20"
                                        >
                                          <Play size={12} fill="currentColor" /> Putar Log
                                        </button>
                                      )}
                                      <button onClick={(e) => { e.stopPropagation(); onSelectItem(item); }} className={cn("py-2 bg-white border border-[#F0EDE8] hover:border-orange text-[#1A1C1E] text-xs font-black rounded-lg transition-colors active:scale-95", item.audioLog ? "flex-1" : "flex-1")}>Detail Laporan</button>
                                      <button onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); setExpandedId(null); }} className="px-4 bg-red-50 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors active:scale-90"><Trash2 size={14} /></button>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
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
