"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, History, Loader2, Plus, TrendingUp, User, X, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Components
import { GoalSlider, NavItem, NutrientBox, cn } from "../components/Common";
import GoalSetupModal from "../components/GoalSetupModal";
import HistoryTab from "../components/HistoryTab";
import HomeTab from "../components/HomeTab";
import LacakTab from "../components/LacakTab";
import ProfileTab from "../components/ProfileTab";
import RecipeChatModal from "../components/RecipeChatModal";
import RecipeModal from "../components/RecipeModal";
import VoiceOverlay from "../components/VoiceOverlay";

const BACKEND_URL = "http://localhost:8000";

const DEFAULT_SETTINGS = {
  username: "Cimeat User",
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

function getCalorieStatus(pct: number) {
  if (pct === 0) return { text: "Belum makan apa-apa. Tubuhmu butuh bahan bakar!", color: "#8A8886", bg: "#F0EDE8" };
  if (pct < 33) return { text: "Awal yang baik! Masih ada ruang untuk makan lebih 💪", color: "#22C55E", bg: "#F0FDF4" };
  if (pct < 66) return { text: "Setengah jalan, jaga ritmenya! 🎯", color: "#F59E0B", bg: "#FFFBEB" };
  if (pct < 90) return { text: "Hampir penuh! Pilih makananmu dengan bijak 🥗", color: "#FF6B35", bg: "#FFF4F0" };
  if (pct <= 100) return { text: "Hampir mencapai target hari ini! 🏁", color: "#FF6B35", bg: "#FFF4F0" };
  return { text: "Target terlampaui. Yuk olahraga ringan! 🔥", color: "#EF4444", bg: "#FEF2F2" };
}

function getWeeklyData(history: any[]) {
  const days = ["Ming", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return Array(7).fill(0).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const ds = d.toLocaleDateString("id-ID");
    const c = history.filter(h => h.date === ds).reduce((a, b) => a + b.calories, 0);
    return { date: ds, calories: c, day: days[d.getDay()], isToday: d.toLocaleDateString("id-ID") === new Date().toLocaleDateString("id-ID") };
  });
}

function getStreak(history: any[]) {
  if (!history || history.length === 0) return 0;
  let s = 0;
  const curr = new Date();

  // Create a set of unique dates from history for O(1) lookup
  const loggedDates = new Set(history.map(h => h.date));

  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(curr.getDate() - i);
    const ds = d.toLocaleDateString("id-ID");
    if (loggedDates.has(ds)) {
      s++;
    } else {
      // Allow current day to be empty without breaking streak if yesterday was logged
      if (i === 0) continue;
      break;
    }
  }
  return s;
}

function getGenZGreeting(username: string) {
  const hour = new Date().getHours();
  const name = username.split(" ")[0];
  if (hour < 11) return `Pagi ${name}! Ready buat glow-up hari ini? ✨`;
  if (hour < 15) return `Siang bestie! Jangan lupa lunch yang bergizi ya 🥗`;
  if (hour < 19) return `Sore bro! Spill dong snack sehat lo hari ini? 🍎`;
  return `Malam! Tidur yang nyenyak biar metabolisme lo lancar 🌙`;
}

function getNutriLevel(historyCount: number) {
  const level = Math.floor(historyCount / 10) + 1;
  const exp = (historyCount % 10) * 10;
  const titles = ["Newbie Eater", "Nutri Scout", "Macro Guard", "Calorie Sage", "Fit Legend", "Cimeat Master"];
  return { level, exp, title: titles[Math.min(level - 1, titles.length - 1)] };
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function App() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"home" | "lacak" | "history" | "profile">("home");
  const [userEmail, setUserEmail] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [analyzeStep, setAnalyzeStep] = useState(0);
  const [history, setHistory] = useState<any[]>([]);
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [loadingRec, setLoadingRec] = useState(false);
  const [draftItem, setDraftItem] = useState<any>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [randomCal, setRandomCal] = useState(0);
  const [showGoalSetup, setShowGoalSetup] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeResult, setRecipeResult] = useState("");
  const [savedRecipes, setSavedRecipes] = useState<any[]>([]);
  const [activeRecipeChat, setActiveRecipeChat] = useState<any>(null);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [tempSettings, setTempSettings] = useState(DEFAULT_SETTINGS);
  const [mounted, setMounted] = useState(false);
  const [playingDraft, setPlayingDraft] = useState(false);
  const [water, setWater] = useState(0);

  useEffect(() => {
    if (mounted) {
      const today = new Date().toLocaleDateString("id-ID");
      const w = localStorage.getItem("cimeat_water_" + today);
      if (w) setWater(parseInt(w));
    }
  }, [mounted]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Auth Guard & Initial Load
  useEffect(() => {
    setMounted(true);
    const auth = localStorage.getItem("cimeat_auth");
    if (!auth) {
      router.push("/login");
      return;
    } else {
      setUserEmail(JSON.parse(auth).email);
    }

    const h = localStorage.getItem("cimeat_history");
    if (h) setHistory(JSON.parse(h));
    const s = localStorage.getItem("cimeat_settings");
    if (s) {
      const parsed = JSON.parse(s);
      setSettings(parsed);
      setTempSettings(parsed);
    } else {
      setShowGoalSetup(true);
    }
    const sr = localStorage.getItem("cimeat_saved_recipes");
    if (sr) setSavedRecipes(JSON.parse(sr));
  }, []);

  // ── Analyzing animation
  useEffect(() => {
    let ci: any, si: any;
    if (analyzing) {
      ci = setInterval(() => setRandomCal(Math.floor(Math.random() * 900) + 100), 60);
      si = setInterval(() => setAnalyzeStep((p: any) => (p + 1) % ANALYZE_STEPS.length), 1200);
    } else {
      setAnalyzeStep(0);
    }
    return () => { clearInterval(ci); clearInterval(si); };
  }, [analyzing]);

  // ── Helper for streaming
  const readStream = async (response: Response, onChunk: (text: string) => void) => {
    const reader = response.body?.getReader();
    if (!reader) return "";
    const decoder = new TextDecoder();
    let accumulated = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      accumulated += chunk;
      onChunk(accumulated);
    }
    return accumulated;
  };

  // ── AI Recommendation fetch
  const fetchRecommendation = async (forceRefresh = false) => {
    if (loadingRec) return;
    const today = new Date().toLocaleDateString("id-ID");
    const todayH = history.filter(h => h.date === today);
    const pastH = history.filter(h => h.date !== today).slice(0, 30);
    const cacheKey = "cimeat_ai_rec_" + today;

    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setAiRecommendation(cached);
        return;
      }
      if (aiRecommendation) return;
    }

    setLoadingRec(true);
    setAiRecommendation(""); // Clear for streaming effect
    try {
      const res = await fetch(`${BACKEND_URL}/recommend/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ history_today: todayH, history_past: pastH, settings }),
      });
      if (!res.ok) throw new Error("Gagal fetch streaming");
      
      const fullText = await readStream(res, (text) => setAiRecommendation(text));
      localStorage.setItem(cacheKey, fullText);
    } catch (err) {
      console.error(err);
      if (!aiRecommendation) {
        setAiRecommendation("Tetap disiplin jaga targetmu hari ini ya bro! 💪");
      }
    } finally {
      setLoadingRec(false);
    }
  };

  useEffect(() => {
    if (activeTab === "lacak") {
      fetchRecommendation();
    }
  }, [activeTab]);

  // ── Actions
  const handleGenerateRecipe = async (images: File[], additionalPrompt: string = "") => {
    setRecipeLoading(true);
    setRecipeResult("");

    const today = new Date().toLocaleDateString("id-ID");
    const todayHist = history.filter(h => h.date === today);
    const consumed = todayHist.reduce((a, c) => ({
      cal: a.cal + (c.calories || 0),
      pro: a.pro + (c.protein || 0),
      car: a.car + (c.carbs || 0),
      fat: a.fat + (c.fat || 0)
    }), { cal: 0, pro: 0, car: 0, fat: 0 });

    const remCal = Math.max(0, settings.calorieGoal - consumed.cal);
    const remPro = Math.max(0, settings.proteinGoal - consumed.pro);
    const remCar = Math.max(0, settings.carbsGoal - consumed.car);
    const remFat = Math.max(0, settings.fatGoal - consumed.fat);

    const fd = new FormData();
    if (images && images.length > 0) {
      images.forEach(img => fd.append("images", img));
    }
    fd.append("calorieGoal", remCal.toString());
    fd.append("proteinGoal", remPro.toString());
    fd.append("carbsGoal", remCar.toString());
    fd.append("fatGoal", remFat.toString());
    if (additionalPrompt) fd.append("additionalPrompt", additionalPrompt);

    try {
      const res = await fetch(`${BACKEND_URL}/recipe/stream`, { method: "POST", body: fd });
      if (!res.ok) throw new Error("Gagal membuat resep");
      await readStream(res, (text) => setRecipeResult(text));
    } catch (err) {
      setRecipeResult("Maaf bro, Chef AI lagi bermasalah. Coba lagi nanti ya! 👨‍🍳");
    } finally {
      setRecipeLoading(false);
    }
  };

  const pushHistory = (item: any) => {
    const updated = [item, ...history].slice(0, 50);
    setHistory(updated);
    localStorage.setItem("cimeat_history", JSON.stringify(updated));

    // Invalidate AI Coach cache so it refreshes with the new food
    const today = new Date().toLocaleDateString("id-ID");
    localStorage.removeItem("cimeat_ai_rec_" + today);
    setAiRecommendation(""); // Clear state to force re-fetch on next LacakTab visit
  };

  const deleteItem = (id: string) => {
    const updated = history.filter(h => h.id !== id);
    setHistory(updated);
    localStorage.setItem("cimeat_history", JSON.stringify(updated));

    // Invalidate AI Coach cache
    const today = new Date().toLocaleDateString("id-ID");
    localStorage.removeItem("cimeat_ai_rec_" + today);
    setAiRecommendation("");
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

  const saveRecipe = (text: string) => {
    const match = text.match(/^#\s+(.*)$/m) || text.match(/^##\s+(.*)$/m);
    let title = match ? match[1].replace(/🍳/g, '').trim() : "Resep Baru dari AI";
    const newRecipe = { id: Date.now().toString(), title, text, date: new Date().toLocaleDateString("id-ID"), chat_history: [] };
    const updated = [newRecipe, ...savedRecipes];
    setSavedRecipes(updated);
    localStorage.setItem("cimeat_saved_recipes", JSON.stringify(updated));
    setShowRecipeModal(false);
    setActiveTab("profile");
  };

  const deleteSavedRecipe = (id: string) => {
    if (confirm("Hapus resep ini?")) {
      const updated = savedRecipes.filter(r => r.id !== id);
      setSavedRecipes(updated);
      localStorage.setItem("cimeat_saved_recipes", JSON.stringify(updated));
    }
  };

  const updateSavedRecipe = (updatedRecipe: any) => {
    const updated = savedRecipes.map(r => r.id === updatedRecipe.id ? updatedRecipe : r);
    setSavedRecipes(updated);
    localStorage.setItem("cimeat_saved_recipes", JSON.stringify(updated));
    if (activeRecipeChat?.id === updatedRecipe.id) {
      setActiveRecipeChat(updatedRecipe);
    }
  };

  const logout = () => {
    localStorage.removeItem("cimeat_auth");
    window.location.href = "/login";
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
      const baseW = data.estimated_weight_g || 150;
      setDraftItem({
        name: data.food_name,
        baseWeight: baseW,
        weight: baseW,
        baseCalories: data.calories,
        baseProtein: data.macronutrients.protein_g,
        baseCarbs: data.macronutrients.carbs_g,
        baseFat: data.macronutrients.fat_g,
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

  const handleVoiceLog = async (browserText: string, audioDataUrl: string | null = null) => {
    setAnalyzing(true);
    let finalTranscription = browserText;

    try {
      // 🕵️‍♀️ STEP 1: Whisper Transcription
      if (audioDataUrl) {
        try {
          const resB = await fetch(audioDataUrl);
          const blob = await resB.blob();
          const fd = new FormData();
          fd.append("audio", blob, "voice.webm");

          const transcribeRes = await fetch(`${BACKEND_URL}/transcribe`, {
            method: "POST",
            body: fd,
          });
          if (transcribeRes.ok) {
            const tData = await transcribeRes.json();
            if (tData.text && tData.text.trim().length > 2) {
              finalTranscription = tData.text; 
            }
          }
        } catch (e) {
          console.error("Whisper error, falling back to browser text:", e);
        }
      }

      // 🧠 STEP 2: Food Analysis
      const res = await fetch(`${BACKEND_URL}/analyze-text`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: finalTranscription }),
      });
      if (!res.ok) throw new Error("Gagal menganalisis makanan");
      const data = await res.json();
      
      const baseW = data.estimated_weight_g || 150;
      setDraftItem({
        name: data.food_name,
        baseWeight: baseW,
        weight: baseW,
        baseCalories: data.calories,
        baseProtein: data.macronutrients.protein_g,
        baseCarbs: data.macronutrients.carbs_g,
        baseFat: data.macronutrients.fat_g,
        calories: data.calories,
        protein: data.macronutrients.protein_g,
        carbs: data.macronutrients.carbs_g,
        fat: data.macronutrients.fat_g,
        score: data.health_score,
        time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        date: new Date().toLocaleDateString("id-ID"),
        image: null,
        audioLog: audioDataUrl,
        originalText: finalTranscription, // <--- SAVE THIS
        category: "Cemilan",
      });
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Backend error bro!"));
    } finally {
      setAnalyzing(false);
      setShowVoiceOverlay(false);
    }
  };

  const handleWeightChange = (newWeight: number) => {
    if (!draftItem) return;
    const ratio = newWeight / draftItem.baseWeight;
    setDraftItem({
      ...draftItem,
      weight: newWeight,
      calories: Math.round(draftItem.baseCalories * ratio),
      protein: Math.round(draftItem.baseProtein * ratio),
      carbs: Math.round(draftItem.baseCarbs * ratio),
      fat: Math.round(draftItem.baseFat * ratio),
    });
  };

  const confirmSave = () => {
    if (!draftItem) return;
    const newId = mounted && typeof window !== 'undefined' && window.crypto?.randomUUID ? window.crypto.randomUUID() : Date.now().toString() + Math.random().toString(36).substr(2, 9);
    pushHistory({ ...draftItem, id: newId });
    setDraftItem(null);
  };

  // ── Derived data
  const today = new Date().toLocaleDateString("id-ID");
  const todayHist = history.filter(h => h.date === today);
  const consumed = todayHist.reduce((a, c) => a + c.calories, 0);
  const goal = settings.calorieGoal;
  const progress = (consumed / goal) * 100;
  const status = getCalorieStatus(progress);

  const dailyMacros = todayHist.reduce(
    (a, c) => ({ protein: a.protein + (c.protein || 0), carbs: a.carbs + (c.carbs || 0), fat: a.fat + (c.fat || 0) }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  const weeklyData = mounted ? getWeeklyData(history) : Array(7).fill({ date: "", calories: 0, day: "", isToday: false });
  const streak = mounted ? getStreak(history) : 0;

  const CATS = ["Sarapan", "Makan Siang", "Makan Malam", "Cemilan"];
  const grouped = CATS
    .map(cat => ({ cat, items: history.filter(h => h.category === cat), total: history.filter(h => h.category === cat).reduce((a, c) => a + c.calories, 0) }))
    .filter(g => g.items.length > 0);

  const weekDates = weeklyData.map(d => d.date);
  const weekMac = history.filter(h => weekDates.includes(h.date)).reduce(
    (a, c) => ({ protein: a.protein + (c.protein || 0), carbs: a.carbs + (c.carbs || 0), fat: a.fat + (c.fat || 0) }),
    { protein: 0, carbs: 0, fat: 0 }
  );

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-[#F8F7F4] font-sans">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFile} />

      {/* ── Header ── */}
      <header className="px-6 pt-10 pb-3 flex justify-between items-start animate-slide-up">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-2xl font-black text-[#1A1C1E] tracking-tight holographic-text">
              Cimeat <span className="opacity-80">AI</span>
            </h1>
            <div className="bg-orange/10 px-2 py-0.5 rounded-md flex items-center gap-1.5">
              <Zap size={10} className="text-orange fill-orange" />
              <span className="text-[10px] text-orange font-black uppercase tracking-widest">{streak} Day Streak</span>
            </div>
          </div>
          <div className="flex flex-col">
            <p className="text-[13px] font-bold text-[#1A1C1E] opacity-90">{getGenZGreeting(settings.username)}</p>
            {analyzing && (
              <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mt-1">
                <Loader2 size={12} className="text-orange animate-spin" />
                <span className="text-[10px] text-orange font-black uppercase tracking-widest">{ANALYZE_STEPS[analyzeStep]}</span>
              </motion.div>
            )}
          </div>
        </div>
        <button onClick={() => setActiveTab("profile")} className="relative group">
          <div className="absolute inset-0 bg-orange/20 rounded-full blur-md group-hover:bg-orange/40 transition-all scale-110" />
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-orange to-orange-light flex items-center justify-center text-white ring-2 ring-white shadow-xl relative z-10 active:scale-90 transition-transform">
            <User size={22} />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center shadow-sm">
              <p className="text-[9px] font-black text-orange">{getNutriLevel(history.length).level}</p>
            </div>
          </div>
        </button>
      </header>

      {/* ── Main Content Area ── */}
      <main className="flex-1 overflow-y-auto px-6 pb-32 scrollbar-hide">
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="h-full"
          >
            {activeTab === "home" && (
              <HomeTab {...{ consumed, goal, progress, analyzing, randomCal, status, todayHist }}
                onScan={() => fileInputRef.current?.click()}
                onSeeAll={() => setActiveTab("history")}
                onSelectItem={setSelectedItem}
                onDeleteItem={deleteItem}
                onVoiceLogStart={() => setShowVoiceOverlay(true)}
                water={water}
                onUpdateWater={(v: number) => setWater(v)}
              />
            )}
            {activeTab === "lacak" && (
              <LacakTab {...{ settings, dailyMacros, streak, weeklyData, weekMac, aiRecommendation, loadingRec }} onRefreshRec={() => fetchRecommendation(true)} onOpenRecipe={() => { setShowRecipeModal(true); setRecipeResult(""); }} />
            )}
            {activeTab === "history" && (
              <HistoryTab {...{ history, grouped }}
                onSelectItem={setSelectedItem}
                onDeleteItem={deleteItem}
                onClear={clearHistory} />
            )}
            {activeTab === "profile" && (
              <ProfileTab
                userSettings={settings} onUpdateSettings={setSettings} userEmail={userEmail} streak={streak} onLogout={logout} onOpenGoalSetup={() => { setTempSettings(settings); setShowGoalSetup(true); }}
                savedRecipes={savedRecipes} onOpenChat={(r: any) => setActiveRecipeChat(r)} onDeleteRecipe={deleteSavedRecipe}
                historyCount={history.length}
                waterCount={water}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Bottom Nav ── */}
      <nav className="fixed bottom-8 left-6 right-6 h-20 rounded-[2.5rem] flex items-center justify-between px-2 shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] z-40 border border-white/60 bg-white/70 backdrop-blur-xl">
        <NavItem icon={<TrendingUp size={24} strokeWidth={activeTab === "home" ? 2.5 : 2} />} label="Beranda" active={activeTab === "home"} onClick={() => setActiveTab("home")} />
        <NavItem icon={<Zap size={24} strokeWidth={activeTab === "lacak" ? 2.5 : 2} />} label="Lacak" active={activeTab === "lacak"} onClick={() => setActiveTab("lacak")} />
        <div className="w-20 h-20 flex items-center justify-center -mt-16 bg-[#F8F7F4] rounded-full p-2 border-t border-white/50">
          <motion.button onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.05, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 15 }}
            className="w-full h-full rounded-full bg-gradient-to-tr from-[#FF6B35] to-[#FF8C61] shadow-[0_15px_30px_-5px_#FF6B35] flex items-center justify-center relative overflow-hidden group">
            <Plus className="text-white z-10 drop-shadow-sm" size={32} strokeWidth={3} />
          </motion.button>
        </div>
        <NavItem icon={<History size={24} strokeWidth={activeTab === "history" ? 2.5 : 2} />} label="Riwayat" active={activeTab === "history"} onClick={() => setActiveTab("history")} />
        <NavItem icon={<User size={24} strokeWidth={activeTab === "profile" ? 2.5 : 2} />} label="Profil" active={activeTab === "profile"} onClick={() => setActiveTab("profile")} />
      </nav>

      {/* ── Modals (Goal, Draft, Detail, Recipe) ── */}
      <AnimatePresence>
        {/* Recipe Modal */}
        {showRecipeModal && (
          <RecipeModal
            key="modal-recipe-gen"
            onClose={() => setShowRecipeModal(false)}
            onGenerate={handleGenerateRecipe}
            loading={recipeLoading}
            result={recipeResult}
            onSave={saveRecipe}
          />
        )}

        {/* Recipe Chat Modal */}
        {activeRecipeChat && (
          <RecipeChatModal
            key={`modal-recipe-chat-${activeRecipeChat.id}`}
            recipe={activeRecipeChat}
            onClose={() => setActiveRecipeChat(null)}
            onUpdateRecipe={updateSavedRecipe}
            onDelete={(id: string) => { deleteSavedRecipe(id); setActiveRecipeChat(null); }}
          />
        )}

        {/* Floating Modals */}
        <VoiceOverlay
          key="modal-voice-overlay"
          isOpen={showVoiceOverlay}
          onClose={() => setShowVoiceOverlay(false)}
          onConfirm={handleVoiceLog}
          isAnalyzing={analyzing}
        />

        {/* Goal Setup Full Modal Wizard */}
        {showGoalSetup && (
          <GoalSetupModal
            key="modal-goal-setup"
            initialSettings={tempSettings}
            onSave={(newSet: any) => {
              setSettings(newSet);
              localStorage.setItem("cimeat_settings", JSON.stringify(newSet));
              setShowGoalSetup(false);
            }}
            onClose={() => setShowGoalSetup(false)}
          />
        )}
        {/* Draft Modal */}
        {draftItem && (
          <div key="modal-draft-overlay" className="fixed inset-0 z-50 flex items-end justify-center px-4 pb-10 bg-black/40 backdrop-blur-sm" onClick={() => setDraftItem(null)}>
            <motion.div key="modal-draft-content" initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[3rem] p-7 shadow-2xl border border-white max-h-[90vh] overflow-y-auto scrollbar-hide">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-xl font-black text-[#1A1C1E]">Hasil Scan AI</h3>
                <button onClick={() => setDraftItem(null)} className="p-2 bg-[#F8F7F4] rounded-full"><X size={18} /></button>
              </div>
              <div className="space-y-6">
                <div className="flex flex-col gap-4">
                  <div className={cn(
                    "w-full h-40 rounded-[2rem] overflow-hidden border border-[#F0EDE8] shadow-inner relative flex items-center justify-center",
                    draftItem.image ? "bg-white" : "bg-gradient-to-br from-orange/5 to-orange/10"
                  )}>
                    {draftItem.image ? (
                      <img src={draftItem.image} className="w-full h-full object-cover" alt="food" />
                    ) : (
                      <div className="flex flex-col items-center justify-center w-full h-full bg-gradient-to-br from-orange/5 to-orange/10 relative overflow-hidden">
                        {draftItem.audioLog && (
                          <div 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (playingDraft) return;
                              setPlayingDraft(true);
                              const audio = new Audio(draftItem.audioLog);
                              audio.onended = () => setPlayingDraft(false);
                              audio.onerror = () => setPlayingDraft(false);
                              audio.play();
                            }}
                            className={cn(
                              "cursor-pointer active:scale-95 transition-all p-4 rounded-3xl",
                              playingDraft ? "bg-orange/5" : "hover:bg-orange/5"
                            )}
                          >
                            <div className="flex items-center gap-1.5 h-10">
                              {[1, 2, 3, 4, 5, 6, 7, 8].map((bar) => (
                                <motion.div
                                  key={bar}
                                  animate={playingDraft ? {
                                    height: [10, 30, 10],
                                    opacity: [0.5, 1, 0.5]
                                  } : {
                                    height: [15, 20, 15],
                                    opacity: 0.3
                                  }}
                                  transition={{
                                    repeat: Infinity,
                                    duration: 0.8,
                                    delay: bar * 0.1
                                  }}
                                  className="w-1.5 rounded-full bg-orange"
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    <div className="absolute inset-0 ring-1 ring-inset ring-black/5 rounded-[2rem]" />
                  </div>
                  <div className="text-center px-1">
                    <input
                      value={draftItem.name}
                      onChange={(e) => setDraftItem({ ...draftItem, name: e.target.value })}
                      className="text-xl font-black text-[#1A1C1E] leading-tight mb-1 uppercase tracking-tight bg-transparent text-center border-b border-transparent hover:border-orange/30 focus:border-orange outline-none transition-colors w-full"
                    />
                    <p className="text-4xl font-black text-orange">{draftItem.calories}<span className="text-xs ml-1 uppercase">Kcal</span></p>
                  </div>
                </div>

                <div className="bg-[#F8F7F4] p-5 rounded-[2rem] border border-[#F0EDE8]">
                  <GoalSlider label="Porsi/Berat" unit="g" value={draftItem.weight} min={10} max={1000} step={10} onChange={handleWeightChange} />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <NutrientBox label="Protein" val={draftItem.protein} unit="g" color="#22C55E" />
                  <NutrientBox label="Karbo" val={draftItem.carbs} unit="g" color="#F59E0B" />
                  <NutrientBox label="Lemak" val={draftItem.fat} unit="g" color="#EF4444" />
                </div>
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest pl-1">Pilih Kategori</p>
                  <div className="flex flex-wrap gap-2">
                    {CATS.map(c => (
                      <button key={c} onClick={() => setDraftItem({ ...draftItem, category: c })}
                        className={cn("px-4 py-2 rounded-full text-xs font-black transition-all",
                          draftItem.category === c ? "bg-orange text-white shadow-lg shadow-orange/20" : "bg-[#F8F7F4] text-[#8A8886]")}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                {draftItem.originalText && (
                  <div className="bg-[#F8F7F4] p-4 rounded-2xl border border-[#F0EDE8] relative">
                    <p className="text-[9px] text-[#8A8886] font-black uppercase tracking-widest mb-1.5 opacity-60">Transcript Suara</p>
                    <p className="text-xs font-medium text-[#1A1C1E] italic leading-relaxed">"{draftItem.originalText}"</p>
                  </div>
                )}
                <button onClick={confirmSave}
                  className="w-full bg-orange text-white h-16 rounded-[2rem] font-black flex items-center justify-center gap-2 group shadow-xl shadow-orange/20 active:scale-95 transition-all">
                  Simpan ke Riwayat <Check size={20} />
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Selected Item Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md" onClick={() => setSelectedItem(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm bg-white rounded-[3.5rem] overflow-hidden shadow-2xl relative">
              <button onClick={() => setSelectedItem(null)}
                className="absolute top-6 right-6 z-10 p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40"><X size={20} /></button>
              <div className={cn("min-h-[16rem] relative flex flex-col items-center justify-center p-8 overflow-hidden",
                selectedItem.image ? "bg-[#F8F7F4]" : "bg-gradient-to-br from-[#FFAB70] to-[#FF8C61]")}>

                {selectedItem.image ? (
                  <>
                    <img src={selectedItem.image} className="absolute inset-0 w-full h-full object-cover" alt="food" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-6 relative z-10 mb-4">
                  </div>
                )}

                <div className={cn("relative z-10 w-full flex flex-col pt-4", selectedItem.image ? "h-full justify-end" : "items-center text-center mt-2")}>
                  <p className={cn("text-xs font-black uppercase tracking-[0.2em] mb-1", selectedItem.image ? "text-white/70" : "text-white/80")}>
                    {selectedItem.category}
                  </p>
                  <h3 className={cn("font-black text-white tracking-tight leading-tight",
                    selectedItem.name.length > 20 ? "text-2xl" : "text-4xl",
                    selectedItem.image ? "" : "max-w-[280px]"
                  )}>
                    {selectedItem.name}
                  </h3>
                </div>
              </div>
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest mb-1">Total Energi</p>
                    <p className="text-5xl font-black text-[#1A1C1E] tracking-tighter">{selectedItem.calories}<span className="text-sm font-bold ml-1 text-[#8A8886]">Kcal</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest mb-1">Health Score</p>
                    <p className="text-4xl font-black" style={{ color: selectedItem.score >= 80 ? "#22C55E" : "#F59E0B" }}>{selectedItem.score}<span className="text-sm">/100</span></p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <NutrientBox label="Protein" val={selectedItem.protein} unit="g" color="#22C55E" />
                  <NutrientBox label="Karbo" val={selectedItem.carbs} unit="g" color="#F59E0B" />
                  <NutrientBox label="Lemak" val={selectedItem.fat} unit="g" color="#EF4444" />
                </div>
                <div className="flex gap-3 pt-2">
                  <div className="flex-1 bg-[#F8F7F4] rounded-2xl p-4 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-[#8A8886] font-black uppercase mb-1">Waktu</p>
                    <p className="font-black text-[#1A1C1E]">{selectedItem.time}</p>
                  </div>
                  <div className="flex-1 bg-[#F8F7F4] rounded-2xl p-4 flex flex-col items-center justify-center">
                    <p className="text-[10px] text-[#8A8886] font-black uppercase mb-1">Tanggal</p>
                    <p className="font-black text-[#1A1C1E]">{selectedItem.date?.split("/").slice(0, 2).join("/")}</p>
                  </div>
                </div>
                {selectedItem.originalText && (
                  <div className="bg-[#F8F7F4] p-5 rounded-3xl border border-[#F0EDE8]">
                    <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest mb-2">Transcript Suara</p>
                    <p className="text-sm font-medium text-[#1A1C1E] italic leading-relaxed">"{selectedItem.originalText}"</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
