"use client";

import { clsx, type ClassValue } from "clsx";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight, Camera, Check, ChevronRight, Cookie,
  Flame, History, Loader2, Moon, Plus, Sparkles,
  Sun, SunDim, Target, Trash2, TrendingUp, User, X, Zap
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BACKEND_URL = "http://localhost:8000";

const DEFAULT_SETTINGS = {
  calorieGoal: 2000,
  proteinGoal: 150,
  carbsGoal: 250,
  fatGoal: 65,
};

const ANALYZE_STEPS = [
  "Mendeteksi jenis makanan...",
  "Menghitung kalori...",
  "Menganalisis nutrisi makro...",
  "Hampir selesai...",
];

// ── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return { sub: "Sudah sarapan?", emoji: "☀️" };
  if (h >= 11 && h < 15) return { sub: "Waktunya makan siang!", emoji: "🌤️" };
  if (h >= 15 && h < 18) return { sub: "Hati-hati jajan ya!", emoji: "🌅" };
  if (h >= 18 && h < 21) return { sub: "Makan malam gimana?", emoji: "🌙" };
  return { sub: "Jangan lupa minum air ya", emoji: "💧" };
}

function getCalorieStatus(pct: number) {
  if (pct === 0)  return { text: "Belum makan apa-apa. Tubuhmu butuh bahan bakar!", color: "#8A8886", bg: "#F0EDE8" };
  if (pct < 33)   return { text: "Awal yang baik! Masih ada ruang untuk makan lebih 💪", color: "#22C55E", bg: "#F0FDF4" };
  if (pct < 66)   return { text: "Setengah jalan, jaga ritmenya! 🎯", color: "#F59E0B", bg: "#FFFBEB" };
  if (pct < 90)   return { text: "Hampir penuh! Pilih makananmu dengan bijak 🥗", color: "#FF6B35", bg: "#FFF4F0" };
  if (pct <= 100) return { text: "Hampir mencapai target hari ini! 🏁", color: "#FF6B35", bg: "#FFF4F0" };
  return { text: "Target terlampaui. Yuk olahraga ringan! 🔥", color: "#EF4444", bg: "#FEF2F2" };
}

function getWeeklyData(history: any[]) {
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toLocaleDateString("id-ID");
    const cals = history.filter(h => h.date === dateStr).reduce((a, c) => a + c.calories, 0);
    return {
      date: dateStr,
      calories: cals,
      day: date.toLocaleDateString("id-ID", { weekday: "short" }),
      isToday: i === 6,
    };
  });
}

function getStreak(history: any[]) {
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    if (history.some(h => h.date === d.toLocaleDateString("id-ID"))) streak++;
    else break;
  }
  return streak;
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function Home() {
  const [activeTab, setActiveTab] = useState<"home" | "lacak" | "history">("home");
  const [analyzing, setAnalyzing]   = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [history, setHistory]        = useState<any[]>([]);
  const [draftItem, setDraftItem]    = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [randomCal, setRandomCal]    = useState(0);
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [settings, setSettings]      = useState(DEFAULT_SETTINGS);
  const [tempSettings, setTempSettings] = useState(DEFAULT_SETTINGS);
  const [mounted, setMounted]        = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Load from localStorage (client only)
  useEffect(() => {
    setMounted(true);
    const h = localStorage.getItem("cimeat_history");
    if (h) setHistory(JSON.parse(h));
    const s = localStorage.getItem("cimeat_settings");
    if (s) {
      const parsed = JSON.parse(s);
      setSettings(parsed);
      setTempSettings(parsed);
    } else {
      setShowGoalSetup(true); // first run
    }
  }, []);

  // ── Analyzing animation
  useEffect(() => {
    let ci: any, si: any;
    if (analyzing) {
      ci = setInterval(() => setRandomCal(Math.floor(Math.random() * 900) + 100), 60);
      si = setInterval(() => setAnalyzeStep(p => (p + 1) % ANALYZE_STEPS.length), 1200);
    } else {
      setAnalyzeStep(0);
    }
    return () => { clearInterval(ci); clearInterval(si); };
  }, [analyzing]);

  // ── Actions
  const pushHistory = (item: any) => {
    const updated = [item, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem("cimeat_history", JSON.stringify(updated));
  };

  const deleteItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem("cimeat_history", JSON.stringify(updated));
  };

  const clearHistory = () => {
    if (confirm("Hapus semua riwayat?")) {
      setHistory([]);
      localStorage.removeItem("cimeat_history");
    }
  };

  const saveSettings = () => {
    setSettings(tempSettings);
    localStorage.setItem("cimeat_settings", JSON.stringify(tempSettings));
    setShowGoalSetup(false);
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAnalyzing(true);
    const tempImg = URL.createObjectURL(file);
    const fd = new FormData();
    fd.append("image", file);
    try {
      const res = await fetch(`${BACKEND_URL}/analyze`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Gagal menganalisis gambar");
      const data = await res.json();
      setDraftItem({
        name: data.food_name,
        calories: data.calories,
        protein: data.macronutrients.protein_g,
        carbs: data.macronutrients.carbs_g,
        fat: data.macronutrients.fat_g,
        score: data.health_score,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        date: new Date().toLocaleDateString("id-ID"),
        image: tempImg,
        category: "Cemilan",
      });
      setAnalyzing(false);
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Backend mati bro!"));
      setAnalyzing(false);
    }
    e.target.value = "";
  };

  const confirmSave = () => {
    if (!draftItem) return;
    pushHistory({ ...draftItem, id: Date.now().toString() });
    setDraftItem(null);
  };

  // ── Derived data
  const today       = new Date().toLocaleDateString("id-ID");
  const todayHist   = history.filter(h => h.date === today);
  const consumed    = todayHist.reduce((a, c) => a + c.calories, 0);
  const goal        = settings.calorieGoal;
  const progress    = (consumed / goal) * 100;
  const status      = getCalorieStatus(progress);

  const dailyMacros = todayHist.reduce(
    (a, c) => ({ protein: a.protein + (c.protein||0), carbs: a.carbs + (c.carbs||0), fat: a.fat + (c.fat||0) }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  // Client-only time-sensitive values
  const greeting    = mounted ? getGreeting() : { sub: "Selamat datang!", emoji: "👋" };
  const weeklyData  = mounted ? getWeeklyData(history) : Array(7).fill({ date: "", calories: 0, day: "", isToday: false });
  const streak      = mounted ? getStreak(history) : 0;

  // History grouped
  const CATS = ["Sarapan", "Makan Siang", "Makan Malam", "Cemilan"];
  const grouped = CATS
    .map(cat => ({ cat, items: history.filter(h => h.category === cat), total: history.filter(h => h.category === cat).reduce((a, c) => a + c.calories, 0) }))
    .filter(g => g.items.length > 0);

  // Weekly macros
  const weekDates = weeklyData.map(d => d.date);
  const weekHist  = history.filter(h => weekDates.includes(h.date));
  const weekMac   = weekHist.reduce(
    (a, c) => ({ protein: a.protein + (c.protein||0), carbs: a.carbs + (c.carbs||0), fat: a.fat + (c.fat||0) }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F8F7F4] font-sans">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFile} />

      {/* ── Header ── */}
      <header className="px-6 pt-10 pb-3 flex justify-between items-start animate-slide-up">
        <div>
          <p className="text-[#8A8886] text-sm font-medium">{greeting.emoji} {greeting.sub}</p>
          <h1 className="text-2xl font-black text-[#1A1C1E] tracking-tight flex items-center gap-2">
            Cimeat <span className="text-[#FF6B35]">AI</span>
            {analyzing && (
              <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }}
                className="bg-orange/10 px-2 py-0.5 rounded-md flex items-center gap-1.5">
                <Loader2 size={12} className="text-orange animate-spin" />
                <span className="text-[10px] text-orange font-bold uppercase tracking-widest">Analyzing</span>
              </motion.div>
            )}
          </h1>
          {analyzing && (
            <motion.p key={analyzeStep} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              className="text-xs text-orange font-semibold mt-0.5">
              {ANALYZE_STEPS[analyzeStep]}
            </motion.p>
          )}
        </div>
        <button onClick={() => { setTempSettings(settings); setShowGoalSetup(true); }}
          className="w-10 h-10 rounded-full bg-orange flex items-center justify-center text-white ring-4 ring-orange/10 shadow-lg shadow-orange/20 active:scale-90 transition-transform mt-1">
          <User size={20} />
        </button>
      </header>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto px-6 pb-32 scrollbar-hide">
        <AnimatePresence mode="wait">

          {/* HOME TAB - ZEN OVERVIEW */}
          {activeTab === "home" && (
            <motion.div key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-6">

              {/* Minimal Circle Ring */}
              <div className="rounded-[3rem] p-10 bg-white border border-[#F0EDE8]/50 shadow-sm flex flex-col items-center justify-center">
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
              <button onClick={() => fileInputRef.current?.click()}
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
                <div className="space-y-3">
                  <div className="flex justify-between items-center px-1">
                    <h4 className="text-sm font-black text-[#1A1C1E] opacity-40 uppercase tracking-widest">Baru Saja Dimakan</h4>
                    <span className="text-[10px] font-bold text-orange">{todayHist.length} Item</span>
                  </div>
                  <HistoryCard key={todayHist[0].id} item={todayHist[0]} onClick={() => setSelectedItem(todayHist[0])} onDelete={() => deleteItem(todayHist[0].id)} />
                </div>
              )}

            </motion.div>
          )}

          {/* LACAK TAB - STATS & MACROS */}
          {activeTab === "lacak" && (
            <motion.div key="lacak" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
              
              {/* Profile/Daily Macro Card */}
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
                    <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest mb-1">Kesenjangan Streak 🔥</p>
                    <p className="text-3xl font-black text-[#1A1C1E]">{streak} <span className="text-sm font-medium text-[#8A8886]">hari berturut</span></p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-orange/5 flex items-center justify-center text-orange border border-orange/10">
                    <Flame size={24} />
                  </div>
                </div>
                
                <div className="mb-8">
                   <div className="flex justify-between items-end mb-4">
                      <p className="text-sm font-black text-[#1A1C1E]">Grafik Kalori Mingguan</p>
                      <p className="text-xs font-bold text-[#8A8886]">Rata-rata: {Math.round(weeklyData.reduce((a, d) => a + d.calories, 0) / 7)} kcal</p>
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

              <div className="rounded-[2.5rem] p-8 bg-[#1A1C1E] text-white overflow-hidden relative group">
                  <Sparkles className="absolute top-4 right-4 text-orange/30 group-hover:scale-125 transition-transform" size={40} />
                  <h4 className="text-xl font-black mb-2">Tips Diet AI</h4>
                  <p className="text-white/60 text-sm leading-relaxed">
                    "Kamu sudah mengonsumsi {dailyMacros.protein}g protein hari ini. {dailyMacros.protein < settings.proteinGoal ? 'Coba tambahkan dada ayam atau tempe di meal berikutnya!' : 'Kerja bagus, kebutuhan proteinmu sudah tercapai!'}"
                  </p>
              </div>

            </motion.div>
          )}

          {/* HISTORY TAB */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
              <div className="flex justify-between items-center mb-2 px-1">
                <h2 className="text-xl font-black text-[#1A1C1E]">Semua Log Makanan</h2>
                {history.length > 0 && (
                  <button onClick={clearHistory} className="p-2 text-[#EF4444] bg-red-50 rounded-full active:scale-90 transition-transform">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>

              {history.length > 0 ? (
                <div className="space-y-8">
                  {grouped.map(g => (
                    <div key={g.cat}>
                      <div className="flex justify-between items-center mb-4 px-1 border-l-4 border-orange pl-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{g.cat === "Sarapan" ? "☀️" : g.cat === "Makan Siang" ? "🌤️" : g.cat === "Makan Malam" ? "🌙" : "🍪"}</span>
                          <h4 className="font-black text-[#1A1C1E]">{g.cat}</h4>
                        </div>
                        <span className="text-xs font-black text-orange bg-orange/10 px-3 py-1 rounded-full">{g.total} Kcal</span>
                      </div>
                      <div className="space-y-3">
                        {g.items.map(item => (
                          <HistoryCard key={item.id} item={item}
                            onClick={() => setSelectedItem(item)}
                            onDelete={() => deleteItem(item.id)} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-20 text-[#8A8886] font-medium bg-white/40 rounded-[2.5rem] border border-dashed border-[#E8E6E1]">
                    <div className="text-4xl mb-3 opacity-20">📜</div>
                    <p>Log makanan masih kosong bro.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Updated 4-Item Bottom Nav ── */}
      <nav className="fixed bottom-8 left-6 right-6 h-20 glass rounded-[2.5rem] flex items-center justify-between px-3 shadow-2xl shadow-charcoal/10 z-40 border-white/40">
        
        <NavItem icon={<TrendingUp size={22} />} label="Beranda" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
        
        <NavItem icon={<Zap size={22} />} label="Lacak" active={activeTab === "lacak"} onClick={() => setActiveTab("lacak")} />

        <div className="w-16 h-16 flex items-center justify-center -mt-16 bg-[#F8F7F4] rounded-full">
          <button onClick={() => fileInputRef.current?.click()}
            className="w-14 h-14 rounded-full bg-orange shadow-[0_10px_30px_-5px_#FF6B35] flex items-center justify-center active:scale-95 transition-all group">
            <Plus className="text-white group-hover:rotate-90 transition-transform duration-300" size={28} />
          </button>
        </div>

        <NavItem icon={<History size={22} />} label="Riwayat" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
        
        <NavItem icon={<Check size={22} />} label="Stats" active={false} onClick={() => alert("Coming soon 🚀")} />
      </nav>

      {/* ── Goal Setup Modal ── */}
      <AnimatePresence>
        {showGoalSetup && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => { if (localStorage.getItem("cimeat_settings")) setShowGoalSetup(false); }}
              className="fixed inset-0 bg-[#1A1C1E]/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[3rem] p-8 z-50 shadow-2xl">
              <div className="w-12 h-1.5 bg-[#E5E2DE] rounded-full mx-auto mb-6" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-orange/10 flex items-center justify-center">
                  <Target size={20} className="text-orange" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-[#1A1C1E]">Setup Target Harian</h3>
                  <p className="text-xs text-[#8A8886]">Personalisasi sesuai kebutuhan kamu</p>
                </div>
              </div>
              <div className="space-y-5">
                <GoalSlider label="🔥 Target Kalori" unit="kcal" value={tempSettings.calorieGoal}
                  onChange={v => setTempSettings(s => ({ ...s, calorieGoal: v }))} min={1000} max={5000} step={50} />
                <GoalSlider label="💪 Target Protein" unit="gram" value={tempSettings.proteinGoal}
                  onChange={v => setTempSettings(s => ({ ...s, proteinGoal: v }))} min={30} max={300} step={5} />
                <GoalSlider label="🍚 Target Karbohidrat" unit="gram" value={tempSettings.carbsGoal}
                  onChange={v => setTempSettings(s => ({ ...s, carbsGoal: v }))} min={50} max={500} step={5} />
                <GoalSlider label="🥑 Target Lemak" unit="gram" value={tempSettings.fatGoal}
                  onChange={v => setTempSettings(s => ({ ...s, fatGoal: v }))} min={20} max={200} step={5} />
              </div>
              <button onClick={saveSettings}
                className="w-full h-14 rounded-[2rem] bg-orange text-white font-black text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-orange/20 mt-6">
                <Check size={20} /> Simpan Target
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Confirmation Sheet ── */}
      <AnimatePresence>
        {draftItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDraftItem(null)}
              className="fixed inset-0 bg-[#1A1C1E]/60 backdrop-blur-sm z-50" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[3rem] p-8 z-50 shadow-2xl">
              <div className="w-12 h-1.5 bg-[#E5E2DE] rounded-full mx-auto mb-8" />
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-orange/20 flex-shrink-0">
                  <img src={draftItem.image} className="w-full h-full object-cover" alt="draft" />
                </div>
                <div className="flex-1 min-w-0">
                  <input className="text-xl font-black text-[#1A1C1E] bg-transparent border-none p-0 focus:ring-0 w-full outline-none"
                    value={draftItem.name} onChange={e => setDraftItem({ ...draftItem, name: e.target.value })} />
                  <div className="flex items-center gap-2 mt-1">
                    <input type="number" className="text-3xl font-black text-orange bg-transparent border-none p-0 focus:ring-0 w-24 outline-none"
                      value={draftItem.calories} onChange={e => setDraftItem({ ...draftItem, calories: parseInt(e.target.value) || 0 })} />
                    <span className="text-sm font-bold text-[#8A8886]">Kcal</span>
                  </div>
                </div>
              </div>
              <div className="mb-8">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#8A8886] mb-4">Pilih Kategori Meal</p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    { id: "Sarapan",    icon: <Sun size={18} />,    color: "#F59E0B" },
                    { id: "Makan Siang",icon: <SunDim size={18} />, color: "#22C55E" },
                    { id: "Makan Malam",icon: <Moon size={18} />,   color: "#8B5CF6" },
                    { id: "Cemilan",    icon: <Cookie size={18} />, color: "#EC4899" },
                  ].map(cat => (
                    <button key={cat.id} onClick={() => setDraftItem({ ...draftItem, category: cat.id })}
                      className={cn("flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all",
                        draftItem.category === cat.id ? "bg-orange/5 border-orange" : "border-[#F0EDE8] opacity-60")}>
                      <div className="p-2 rounded-xl mb-1" style={{ color: cat.color }}>{cat.icon}</div>
                      <span className="text-[8px] font-black uppercase text-[#1A1C1E]">{cat.id.split(" ")[0]}</span>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={confirmSave}
                className="w-full h-16 rounded-[2rem] bg-orange text-white font-black text-lg flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl shadow-orange/20">
                <Check size={24} /> Simpan Catatan
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── History Detail Modal ── */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSelectedItem(null)}
            className="fixed inset-0 bg-[#1A1C1E]/90 backdrop-blur-md z-50 p-6 flex items-center justify-center">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-[3rem] w-full max-w-sm overflow-hidden">
              <div className="relative h-56 w-full">
                <img src={selectedItem.image} className="w-full h-full object-cover" alt="food" />
                <button onClick={() => setSelectedItem(null)}
                  className="absolute top-5 right-5 w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white">
                  <X size={20} />
                </button>
                <div className="absolute bottom-5 left-5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/20 flex items-center gap-2">
                  <History size={14} className="text-white" />
                  <span className="text-white text-xs font-black">{selectedItem.time}</span>
                </div>
              </div>
              <div className="p-7">
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <h2 className="text-2xl font-black text-[#1A1C1E] mb-1">{selectedItem.name}</h2>
                    <span className="text-[10px] font-black uppercase bg-orange/10 text-orange px-3 py-1 rounded-full">{selectedItem.category}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-orange leading-none">{selectedItem.calories}</p>
                    <p className="text-[10px] font-bold text-[#8A8886] uppercase">Kcal</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <NutrientBox label="Protein" val={selectedItem.protein} unit="g" color="#22C55E" />
                  <NutrientBox label="Karbo"   val={selectedItem.carbs}   unit="g" color="#F59E0B" />
                  <NutrientBox label="Lemak"   val={selectedItem.fat}     unit="g" color="#EF4444" />
                </div>
                <div className="bg-[#F8F7F4] rounded-3xl p-5 border border-[#F0EDE8]">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-xs font-black text-[#1A1C1E] uppercase tracking-widest flex items-center gap-2">
                      <Sparkles size={13} className="text-orange" /> Health Score
                    </p>
                    <p className="text-xl font-black text-[#1A1C1E]">{selectedItem.score}/100</p>
                  </div>
                  <div className="h-2 w-full bg-[#E5E2DE] rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${selectedItem.score}%` }}
                      className="h-full bg-orange" />
                  </div>
                  <p className="text-[10px] text-[#8A8886] mt-2.5 font-medium italic text-center">Analisis berdasarkan nutrisi makro yang terdeteksi AI.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatItem({ label, val, unit, color }: any) {
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

function NavItem({ icon, label, active, onClick }: any) {
  return (
    <button onClick={onClick} className={cn("flex-1 flex flex-col items-center justify-center gap-1.5 transition-all duration-300",
      active ? "text-orange" : "text-[#B0ADAA]")}>
      <div className={cn("p-2.5 rounded-2xl transition-all duration-500", active && "bg-orange/10 scale-110")}>{icon}</div>
      <span className={cn("text-[10px] font-black uppercase tracking-tighter transition-all duration-300",
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-1")}>{label}</span>
    </button>
  );
}

function HistoryCard({ item, onClick, onDelete }: any) {
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

function MacroBar({ label, current, target, color }: any) {
  const pct = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] text-[#8A8886] font-black uppercase w-11 flex-shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-[#F0EDE8] rounded-full overflow-hidden">
        <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className="h-full rounded-full" style={{ backgroundColor: color }} />
      </div>
      <span className="text-[10px] text-[#1A1C1E] font-black w-20 text-right flex-shrink-0">{current}/{target}g</span>
    </div>
  );
}

function NutrientBox({ label, val, unit, color }: any) {
  return (
    <div className="bg-[#F8F7F4] p-3 rounded-2xl border border-[#F0EDE8] text-center">
      <p className="text-[8px] font-black text-[#8A8886] uppercase tracking-widest mb-1">{label}</p>
      <p className="text-base font-black text-[#1A1C1E] leading-none">{val}<span className="text-[9px] ml-0.5 text-[#8A8886] font-bold">{unit}</span></p>
      <div className="h-1 w-5 mx-auto mt-2 rounded-full overflow-hidden" style={{ backgroundColor: "#E5E2DE" }}>
        <div className="h-full w-3/5 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  );
}

function EmptyState({ onScan }: { onScan: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white/50 rounded-[2rem] p-10 border border-dashed border-[#E8E6E1] text-center">
      <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
        className="text-4xl mb-3">🥗</motion.div>
      <p className="text-sm font-black text-[#1A1C1E] mb-1">Belum ada makanan hari ini!</p>
      <p className="text-xs text-[#8A8886] mb-5">Foto makananmu — AI hitung kalorinya dalam detik ⚡</p>
      <button onClick={onScan}
        className="inline-flex items-center gap-2 bg-orange text-white text-xs font-black px-5 py-2.5 rounded-full active:scale-95 transition-transform shadow-lg shadow-orange/20">
        <Camera size={14} /> Scan Sekarang
      </button>
    </motion.div>
  );
}

function GoalSlider({ label, unit, value, onChange, min, max, step }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <label className="text-sm font-black text-[#1A1C1E]">{label}</label>
        <span className="text-lg font-black text-orange">{value} <span className="text-xs text-[#8A8886] font-bold">{unit}</span></span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseInt(e.target.value))}
        className="w-full accent-orange h-1.5 cursor-pointer" />
      <div className="flex justify-between mt-1">
        <span className="text-[9px] text-[#8A8886]">{min}</span>
        <span className="text-[9px] text-[#8A8886]">{max}</span>
      </div>
    </div>
  );
}

function WeeklyChart({ data, goal }: { data: any[]; goal: number }) {
  const maxVal = Math.max(...data.map(d => d.calories), goal, 1);
  const barH   = 80;
  return (
    <div className="flex items-end gap-1.5" style={{ height: barH + 32 }}>
      {data.map((d, i) => {
        const h  = d.calories === 0 ? 3 : (d.calories / maxVal) * barH;
        const bg = d.isToday ? "#FF6B35" : d.calories > goal ? "#FCA5A5" : "#F0EDE8";
        const tc = d.isToday ? "#FF6B35" : "#BDBDBD";
        return (
          <div key={i} className="flex-1 flex flex-col items-center justify-end gap-1">
            <div className="w-full flex flex-col justify-end" style={{ height: barH }}>
              <motion.div initial={{ height: 0 }} animate={{ height: h }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: "easeOut" }}
                className="w-full rounded-t-lg" style={{ backgroundColor: bg, minHeight: 3 }} />
            </div>
            <span className="text-[9px] font-bold capitalize" style={{ color: tc }}>{d.day.slice(0, 2)}</span>
            {d.calories > 0 && (
              <span className="text-[8px] font-black" style={{ color: tc }}>
                {d.calories >= 1000 ? `${(d.calories / 1000).toFixed(1)}k` : d.calories}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
