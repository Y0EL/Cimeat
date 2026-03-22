"use client";

import { motion } from "framer-motion";
import { Edit2, Flame, LogOut, Mail, ShieldCheck, Sparkles, User, UserCheck, BookOpen, Trash2, MessageSquare, Zap } from "lucide-react";
import { useState } from "react";

export default function ProfileTab({ userSettings, onUpdateSettings, userEmail, streak, onLogout, onOpenGoalSetup, savedRecipes, onOpenChat, onDeleteRecipe, historyCount, waterCount }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(userSettings.username || "Cimeat User");

  const levelInfo = getNutriLevel(historyCount || 0);

  const saveName = () => {
    onUpdateSettings({ ...userSettings, username: newName });
    setIsEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 pb-36">
      
      {/* Header Profile */}
      <div className="bg-white rounded-[3rem] p-10 border border-[#F0EDE8]/50 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10 floating">
           <Zap size={140} className="text-orange" />
        </div>
        
        <div className="w-28 h-28 rounded-[2.5rem] bg-gradient-to-tr from-orange to-orange-light flex items-center justify-center text-white border-4 border-white shadow-xl mb-6 relative group overflow-hidden orbit-glow">
           <User size={56} />
           <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Edit2 size={24} className="text-white" />
           </div>
        </div>

        {/* Level & Title */}
        <div className="relative z-10 mb-4">
           <div className="bg-orange/5 px-3 py-1 rounded-full border border-orange/10 inline-flex items-center gap-2 mb-2">
              <Sparkles size={12} className="text-orange" />
              <span className="text-[10px] font-black uppercase text-orange tracking-widest">{levelInfo.title}</span>
           </div>
           
           {isEditing ? (
             <div className="flex items-center gap-2 mb-1 w-full max-w-[200px] mx-auto">
                <input autoFocus className="text-3xl font-black text-[#1A1C1E] bg-orange/5 border-b-2 border-orange p-1 outline-none w-full text-center"
                  value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={saveName} onKeyDown={(e) => e.key === "Enter" && saveName()} />
             </div>
           ) : (
             <div className="flex items-center justify-center gap-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
                <h2 className="text-3xl font-black text-[#1A1C1E] tracking-tight">{userSettings.username || "Cimeat User"}</h2>
                <Edit2 size={16} className="text-[#8A8886] opacity-0 group-hover:opacity-100 transition-opacity" />
             </div>
           )}
           <p className="text-[11px] font-bold text-[#8A8886]">{userEmail || "nutrition.bestie@cimeat.ai"}</p>
        </div>

        {/* Level XP Bar */}
        <div className="w-full bg-[#F8F7F4] p-5 rounded-[2.5rem] mt-2 mb-6 border border-[#F0EDE8]/40">
           <div className="flex justify-between items-end mb-2">
              <p className="text-[9px] font-black text-[#1A1C1E] uppercase">Level {levelInfo.level}</p>
              <p className="text-[9px] font-black text-[#8A8886] uppercase">{levelInfo.exp}% to next level</p>
           </div>
           <div className="h-2 w-full bg-white rounded-full overflow-hidden border border-[#F0EDE8]/30">
              <motion.div initial={{ width: 0 }} animate={{ width: `${levelInfo.exp}%` }} transition={{ duration: 1.5, ease: "circOut" }}
                className="h-full bg-gradient-to-r from-orange to-orange-light rounded-full" />
           </div>
        </div>

        <div className="grid grid-cols-[1fr_1px_1fr] gap-0 w-full pt-8 border-t border-[#F8F7F4]">
           <div className="text-center group active:scale-95 transition-transform cursor-pointer py-2">
              <p className="text-[10px] text-[#8A8886] font-black uppercase mb-1 tracking-widest">Streak</p>
              <div className="flex items-center justify-center gap-1.5 text-orange">
                 <Flame size={18} className="fill-orange/20 animate-pulse" />
                 <span className="text-2xl font-black">{streak}d</span>
              </div>
           </div>
           
           <div className="w-[1px] h-10 bg-[#F0EDE8] self-center" />
           
           <div className="text-center group active:scale-95 transition-transform cursor-pointer py-2">
              <p className="text-[10px] text-[#8A8886] font-black uppercase mb-1 tracking-widest">Logged</p>
              <div className="flex items-center justify-center gap-1.5 text-[#1A1C1E]">
                 <div className="p-1 rounded-lg bg-green-50">
                    <ShieldCheck size={16} className="text-[#22C55E]" />
                 </div>
                 <span className="text-2xl font-black">{historyCount}</span>
              </div>
           </div>
        </div>
      </div>

      {/* Trophy / Achievement Badges */}
      <div className="space-y-4">
         <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest px-4">Trophy Room</p>
         <div className="flex gap-4 overflow-x-auto px-4 pb-2 scrollbar-hide">
             <AchievementBadge icon="🏆" label="Early Bird" active={historyCount >= 5} />
             <AchievementBadge icon="🔥" label="Hot Streak" active={streak >= 3} />
             <AchievementBadge icon="💧" label="Water King" active={waterCount >= 8} />
             <AchievementBadge icon="🥗" label="Clean Eater" active={historyCount >= 10} />
         </div>
      </div>

      {/* Koleksi Resep */}
      <div className="space-y-4">
         <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest px-4 flex items-center gap-2">
            <BookOpen size={12} className="text-orange" /> Koleksi Resep AI
         </p>
         
         {savedRecipes?.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 px-1">
               {savedRecipes.map((recipe: any, idx: number) => (
                  <div key={recipe.id || `recipe-${idx}`} onClick={() => onOpenChat(recipe)} className="bg-white rounded-3xl p-5 border border-[#F0EDE8]/50 shadow-sm flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer hover:border-orange/30">
                     <div className="flex-1 min-w-0 pr-3">
                        <h4 className="font-black text-[#1A1C1E] text-sm truncate">{recipe.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                           <p className="text-[10px] bg-[#F8F7F4] text-[#8A8886] px-2 py-0.5 rounded-full font-bold">{recipe.date}</p>
                           {recipe.chat_history?.length > 0 && (
                              <p className="text-[10px] text-orange font-bold flex items-center gap-1">
                                 <MessageSquare size={10} /> {recipe.chat_history.length / 2} Obrolan
                              </p>
                           )}
                        </div>
                     </div>
                     <button onClick={(e) => { e.stopPropagation(); onDeleteRecipe(recipe.id); }} className="p-2.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100">
                        <Trash2 size={16} />
                     </button>
                  </div>
               ))}
            </div>
         ) : (
            <div className="bg-[#F8F7F4] rounded-3xl p-6 border-2 border-dashed border-[#F0EDE8] text-center opacity-70">
               <BookOpen size={24} className="text-[#A6A4A1] mx-auto mb-2" />
               <p className="text-xs font-bold text-[#8A8886]">Belum ada resep yang disimpan. Tanya AI sekarang!</p>
            </div>
         )}
      </div>

      {/* Menu Options */}
      <div className="space-y-3">
         <p className="text-[10px] text-[#8A8886] font-black uppercase tracking-widest px-4">Pengaturan Akun</p>
         
         <div onClick={() => onOpenGoalSetup()}>
            <ProfileMenu icon={<Sparkles size={20} />} label="Target Nutrisi" sub="Atur ulang target harianmu" />
         </div>
         
         <ProfileMenu icon={<Mail size={20} />} label="Email Saya" sub={userEmail || "cimeat.user@example.com"} />

         <div className="bg-white rounded-[2rem] p-6 border border-[#F0EDE8]/50 shadow-sm flex items-center justify-between opacity-50 relative overflow-hidden group">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-[#F8F7F4] flex items-center justify-center text-[#1A1C1E]">
                  <Sparkles size={22} />
               </div>
               <div>
                  <h4 className="font-black text-[#1A1C1E]">Cimeat Premium</h4>
                  <p className="text-xs text-[#8A8886]">Coming Soon 🚀</p>
               </div>
            </div>
            <div className="bg-orange/10 px-3 py-1 rounded-full border border-orange/10 group-hover:bg-orange/20 transition-all">
               <span className="text-[10px] font-black text-orange uppercase tracking-widest">Upgrade</span>
            </div>
         </div>

         <button onClick={onLogout}
            className="w-full bg-red-50 hover:bg-red-100 text-red-500 rounded-[2rem] p-6 border border-red-100 shadow-sm flex items-center justify-between transition-all active:scale-[0.98]">
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-sm">
                  <LogOut size={22} />
               </div>
               <h4 className="font-black">Keluar dari Cimeat</h4>
            </div>
         </button>
      </div>

    </motion.div>
  );
}


function AchievementBadge({ icon, label, active }: any) {
  return (
    <div className={cn("flex-shrink-0 w-24 h-28 rounded-[2rem] p-4 flex flex-col items-center justify-center gap-2 border transition-all",
      active ? "bg-white border-orange/20 shadow-sm opacity-100" : "bg-[#F8F7F4] border-transparent opacity-30 grayscale")}>
       <div className="text-2xl mb-1">{icon}</div>
       <p className="text-[9px] font-black text-center text-[#1A1C1E] leading-tight uppercase">{label}</p>
    </div>
  );
}

function getNutriLevel(historyCount: number) {
  const level = Math.floor(historyCount / 10) + 1;
  const exp = (historyCount % 10) * 10;
  const titles = ["Newbie Eater", "Nutri Scout", "Macro Guard", "Calorie Sage", "Fit Legend", "Cimeat Master"];
  return { level, exp, title: titles[Math.min(level - 1, titles.length - 1)] };
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

function ProfileMenu({ icon, label, sub }: any) {
  return (
    <div className="bg-white rounded-[2rem] p-6 border border-[#F0EDE8]/50 shadow-sm flex items-center justify-between group active:scale-[0.99] transition-all cursor-pointer">
       <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-orange/5 group-hover:bg-orange/10 flex items-center justify-center text-orange transition-all">
             {icon}
          </div>
          <div>
             <h4 className="font-black text-[#1A1C1E]">{label}</h4>
             <p className="text-xs text-[#8A8886]">{sub}</p>
          </div>
       </div>
    </div>
  );
}
