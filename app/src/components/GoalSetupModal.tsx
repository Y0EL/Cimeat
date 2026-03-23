"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check, ChevronLeft, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { GoalSlider, cn } from "./Common";

export default function GoalSetupModal({ initialSettings, onSave, onClose }: any) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState({
    gender: "Laki-laki",
    age: 25,
    weight: 65,
    height: 170,
    activity: 1.2,
    goal: "Maintain",
  });
  
  const [settings, setSettings] = useState(initialSettings);
  const [mode, setMode] = useState<"wizard" | "manual">("wizard");

  const calculateTDEE = () => {
    let bmr = 10 * data.weight + 6.25 * data.height - 5 * data.age;
    bmr += data.gender === "Laki-laki" ? 5 : -161;
    let tdee = bmr * data.activity;
    
    if (data.goal === "Cut") tdee -= 400;
    if (data.goal === "Bulk") tdee += 400;
    
    // Macro ratio: 30% Protein, 40% Carbs, 30% Fat
    const p = Math.round((tdee * 0.3) / 4);
    const c = Math.round((tdee * 0.4) / 4);
    const f = Math.round((tdee * 0.3) / 9);
    
    setSettings({
      ...settings,
      calorieGoal: Math.round(tdee),
      proteinGoal: p,
      carbsGoal: c,
      fatGoal: f
    });
    setMode("manual");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/40 backdrop-blur-md">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-sm bg-white rounded-[3rem] shadow-2xl border border-white overflow-hidden relative min-h-[500px] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 pb-2 border-b border-[#F0EDE8]/50">
           {mode === "wizard" && step > 1 ? (
              <button onClick={() => setStep(step - 1)} className="p-2 bg-[#F8F7F4] rounded-full text-[#1A1C1E]"><ChevronLeft size={18} /></button>
           ) : <div className="w-9" />}
           
           <h3 className="text-lg font-black text-[#1A1C1E] text-center">
             {mode === "wizard" ? `Langkah ${step} / 3` : "Target Nutrisi"}
           </h3>
           <button onClick={onClose} className="p-2 bg-[#F8F7F4] rounded-full text-[#8A8886] hover:bg-orange/10 hover:text-orange transition-colors"><X size={18} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide pb-8">
          <AnimatePresence mode="wait">
            {mode === "wizard" && step === 1 && (
              <motion.div key="s1" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                 <div className="text-center mb-6 mt-2">
                    <h2 className="text-2xl font-black text-[#1A1C1E] mb-2">Profil Biologis</h2>
                    <p className="text-xs text-[#8A8886] font-medium">Bantu AI merekomendasikan nutrisimu</p>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3 mb-6">
                    {["Laki-laki", "Perempuan"].map(g => (
                      <button key={g} onClick={() => setData({...data, gender: g})}
                        className={cn("p-4 rounded-2xl border-2 font-black transition-all", data.gender === g ? "border-orange bg-orange/5 text-orange" : "border-[#F0EDE8] bg-white text-[#8A8886]")}>
                        {g}
                      </button>
                    ))}
                 </div>
                 
                 <GoalSlider label="Umur" unit="Thn" min={15} max={80} step={1} value={data.age} onChange={(v: any) => setData({...data, age: v})} />
                 <GoalSlider label="Berat" unit="Kg" min={40} max={150} step={1} value={data.weight} onChange={(v: any) => setData({...data, weight: v})} />
                 <GoalSlider label="Tinggi" unit="Cm" min={140} max={210} step={1} value={data.height} onChange={(v: any) => setData({...data, height: v})} />
                 
                 <button onClick={() => setStep(2)} className="w-full bg-[#1A1C1E] text-white h-14 rounded-[2rem] font-black flex items-center justify-center gap-2 mt-4 shadow-xl shadow-black/10 active:scale-95 transition-transform hover:bg-[#2A2D30]">Lanjut <ArrowRight size={18} /></button>
                 <button onClick={() => setMode("manual")} className="w-full text-[10px] font-black uppercase text-[#8A8886] tracking-widest mt-4 hover:text-orange">Lewati Wizard</button>
              </motion.div>
            )}

            {mode === "wizard" && step === 2 && (
              <motion.div key="s2" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                 <div className="text-center mb-6 mt-2">
                    <h2 className="text-2xl font-black text-[#1A1C1E] mb-2">Aktivitas & Tujuan</h2>
                 </div>
                 
                 <div className="space-y-3">
                    <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest pl-1">Tingkat Aktivitas Harian</p>
                    {[
                      { l: "Santai", v: 1.2, sub: "Jarang olahraga & rebahan" },
                      { l: "Manusia Normal", v: 1.375, sub: "Olahraga 1-3x seminggu" },
                      { l: "Aktif", v: 1.55, sub: "Olahraga 3-5x seminggu" },
                    ].map(a => (
                      <button key={a.l} onClick={() => setData({...data, activity: a.v})}
                        className={cn("w-full p-4 rounded-2xl border-2 text-left flex justify-between items-center transition-all", data.activity === a.v ? "border-orange bg-orange/5" : "border-[#F0EDE8] bg-white")}>
                        <div><p className={cn("font-black", data.activity === a.v ? "text-orange" : "text-[#1A1C1E]")}>{a.l}</p><p className="text-[10px] text-[#8A8886] font-bold mt-1">{a.sub}</p></div>
                        {data.activity === a.v && <Check size={18} className="text-orange" />}
                      </button>
                    ))}
                 </div>

                 <div className="space-y-3 mt-4">
                    <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest pl-1">Tujuan Fisik</p>
                    <div className="grid grid-cols-3 gap-2">
                       {["Cut", "Maintain", "Bulk"].map(g => (
                         <button key={g} onClick={() => setData({...data, goal: g})}
                           className={cn("p-3 rounded-2xl border-2 font-black text-[11px] uppercase tracking-wider transition-all", data.goal === g ? "border-orange bg-orange/5 text-orange" : "border-[#F0EDE8] bg-white text-[#8A8886]")}>
                           {g}
                         </button>
                       ))}
                    </div>
                 </div>

                 <button onClick={() => setStep(3)} className="w-full bg-[#1A1C1E] text-white h-14 rounded-[2rem] font-black flex items-center justify-center gap-2 mt-4 shadow-xl shadow-black/10 active:scale-95 transition-transform hover:bg-[#2A2D30]">Lanjut <ArrowRight size={18} /></button>
              </motion.div>
            )}

            {mode === "wizard" && step === 3 && (
              <motion.div key="s3" initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }} className="space-y-6">
                 <div className="text-center mb-6 mt-2">
                    <h2 className="text-2xl font-black text-[#1A1C1E] mb-2">Preferensi Pintar</h2>
                    <p className="text-xs text-[#8A8886] font-medium">Bantu AI merekomendasikan resto terdekat</p>
                 </div>

                 <div className="p-5 bg-[#F8F7F4] rounded-[2rem] border border-[#F0EDE8] space-y-4">
                    <div className="flex justify-between items-center px-1">
                      <div>
                        <p className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-widest">Gunakan Lokasi</p>
                        <p className="text-[9px] text-[#8A8886] font-medium">Izin lokasi buat sarankan tempat makan</p>
                      </div>
                      <button 
                        onClick={() => setSettings({...settings, useLocation: !settings.useLocation})}
                        className={cn("w-12 h-6 rounded-full transition-all relative", settings.useLocation ? "bg-orange" : "bg-white border border-[#F0EDE8]")}
                      >
                        <motion.div initial={{ x: 2 }} animate={{ x: settings.useLocation ? 26 : 2 }} className="absolute top-1 left-0 w-4 h-4 bg-white shadow-md rounded-full" style={!settings.useLocation ? { backgroundColor: '#F0EDE8' } : {}} />
                      </button>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[#F0EDE8]">
                      <p className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-widest pl-1">Preferensi Makanan</p>
                      <div className="flex flex-col gap-2">
                        {[
                          { id: "balanced", label: "Seimbang", sub: "Mix sehat & hemat", color: "blue" },
                          { id: "affordable", label: "Hemat & Affordable", sub: "Warteg/PKL vibe", color: "orange" },
                          { id: "healthy", label: "Sehat & Hijau", sub: "Salad/Clean food", color: "green" }
                        ].map(p => (
                          <button key={p.id} onClick={() => setSettings({...settings, diningPreference: p.id})}
                            className={cn("w-full p-3 rounded-2xl border-2 text-left flex justify-between items-center transition-all", 
                              settings.diningPreference === p.id ? "border-orange bg-orange/5" : "border-white bg-white")}>
                            <div>
                               <p className={cn("text-xs font-black", settings.diningPreference === p.id ? "text-orange" : "text-[#1A1C1E]")}>{p.label}</p>
                               <p className="text-[9px] text-[#8A8886] font-bold">{p.sub}</p>
                            </div>
                            {settings.diningPreference === p.id && <Check size={14} className="text-orange" />}
                          </button>
                        ))}
                      </div>
                    </div>
                 </div>

                 <button onClick={calculateTDEE} className="w-full bg-orange text-white h-14 rounded-[2rem] font-black flex items-center justify-center gap-2 mt-4 shadow-xl shadow-orange/20 active:scale-95 transition-transform"><Sparkles size={18} /> Kalkulasi BMR AI</button>
              </motion.div>
            )}

            {mode === "manual" && (
              <motion.div key="manual" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-6">
                 <div className="bg-orange/10 p-4 rounded-[1.5rem] flex items-center gap-4 mb-4 border border-orange/20">
                    <div className="w-12 h-12 bg-orange rounded-full flex flex-shrink-0 items-center justify-center shadow-lg"><Sparkles className="text-white" size={20} /></div>
                    <div><p className="text-[10px] font-black text-orange uppercase tracking-[0.2em] mb-0.5">Rekomendasi Pintar</p><p className="text-[10px] font-bold text-[#1A1C1E]">Angka ini telah disesuaikan dengan BMR tubuhmu secara saintifik.</p></div>
                 </div>
                 
                 <GoalSlider label="Target Kalori" unit="Kcal" value={settings.calorieGoal} min={1200} max={4000} step={50} onChange={(v: any) => setSettings({...settings, calorieGoal: v})} />
                 
                  <div className="grid grid-cols-1 gap-5 mt-6">
                    <div className="p-4 bg-[#F8F7F4] rounded-[2rem] border border-[#F0EDE8] space-y-5">
                       <GoalSlider label="Protein" unit="g" value={settings.proteinGoal} min={50} max={300} step={5} onChange={(v: any) => setSettings({...settings, proteinGoal: v})} />
                       <GoalSlider label="Karbo" unit="g" value={settings.carbsGoal} min={100} max={500} step={10} onChange={(v: any) => setSettings({...settings, carbsGoal: v})} />
                       <GoalSlider label="Lemak" unit="g" value={settings.fatGoal} min={30} max={150} step={5} onChange={(v: any) => setSettings({...settings, fatGoal: v})} />
                    </div>

                    <div className="p-5 bg-white rounded-[2rem] border border-[#F0EDE8] space-y-4">
                      <div className="flex justify-between items-center px-1">
                        <div>
                          <p className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-widest">Gunakan Lokasi</p>
                          <p className="text-[9px] text-[#8A8886] font-medium">Sarankan tempat makan terdekat</p>
                        </div>
                        <button 
                          onClick={() => setSettings({...settings, useLocation: !settings.useLocation})}
                          className={cn("w-12 h-6 rounded-full transition-all relative", settings.useLocation ? "bg-orange" : "bg-[#F0EDE8]")}
                        >
                          <motion.div animate={{ x: settings.useLocation ? 26 : 2 }} className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-sm" />
                        </button>
                      </div>

                      <div className="space-y-2 pt-2 border-t border-[#F0EDE8]">
                        <p className="text-[10px] font-black text-[#1A1C1E] uppercase tracking-widest pl-1">Preferensi Makan</p>
                        <div className="flex gap-2">
                          {["balanced", "affordable", "healthy"].map(p => (
                            <button key={p} onClick={() => setSettings({...settings, diningPreference: p})}
                              className={cn("flex-1 py-2 rounded-xl text-[10px] font-black capitalize transition-all",
                                settings.diningPreference === p ? "bg-[#1A1C1E] text-white" : "bg-[#F8F7F4] text-[#8A8886]")}>
                              {p === "balanced" ? "Seimbang" : p === "affordable" ? "Hemat" : "Sehat"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                 <button onClick={() => onSave(settings)}
                   className="w-full bg-orange text-white h-16 rounded-[2rem] font-black flex items-center justify-center gap-2 shadow-xl shadow-orange/20 active:scale-95 transition-all mt-6">
                   Simpan Kombinasi <Check size={20} />
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
