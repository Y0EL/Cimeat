"use client";

import { motion } from "framer-motion";
import { Edit2, Flame, LogOut, Mail, ShieldCheck, Sparkles, User, UserCheck } from "lucide-react";
import { useState } from "react";

export default function ProfileTab({ userSettings, onUpdateSettings, userEmail, streak, onLogout, onOpenGoalSetup }: any) {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(userSettings.username || "Cimeat User");

  const saveName = () => {
    onUpdateSettings({ ...userSettings, username: newName });
    setIsEditing(false);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 pb-12">
      
      {/* Header Profile */}
      <div className="bg-white rounded-[3rem] p-10 border border-[#F0EDE8]/50 shadow-sm flex flex-col items-center text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
           <Sparkles size={120} className="text-orange" />
        </div>
        
        <div className="w-28 h-28 rounded-[2.5rem] bg-orange/10 flex items-center justify-center text-orange border-4 border-white shadow-xl mb-6 relative group overflow-hidden">
           <User size={56} />
           <div className="absolute inset-0 bg-orange/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
              <Edit2 size={24} className="text-white" />
           </div>
        </div>

        {isEditing ? (
          <div className="flex items-center gap-2 mb-2 w-full max-w-[200px]">
             <input autoFocus className="text-2xl font-black text-[#1A1C1E] bg-orange/5 border-b-2 border-orange p-1 outline-none w-full text-center"
               value={newName} onChange={(e) => setNewName(e.target.value)} onBlur={saveName} onKeyDown={(e) => e.key === "Enter" && saveName()} />
          </div>
        ) : (
          <div className="flex items-center gap-2 mb-2 group cursor-pointer" onClick={() => setIsEditing(true)}>
             <h2 className="text-3xl font-black text-[#1A1C1E] tracking-tight">{userSettings.username || "Cimeat User"}</h2>
             <Edit2 size={16} className="text-[#8A8886] opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        )}
        
        <div className="flex items-center gap-1.5 bg-orange/5 px-3 py-1 rounded-full border border-orange/10 mb-6 font-bold">
           <UserCheck size={12} className="text-orange" />
           <span className="text-[10px] font-black uppercase text-orange">{userEmail || "Cimeat User"}</span>
        </div>

        <div className="grid grid-cols-2 gap-4 w-full pt-6 border-t border-[#F8F7F4]">
           <div className="text-center">
              <p className="text-[10px] text-[#8A8886] font-black uppercase mb-1">Weekly Streak</p>
              <div className="flex items-center justify-center gap-1 text-orange">
                 <Flame size={16} />
                 <span className="text-xl font-black">{streak} Hari</span>
              </div>
           </div>
           <div className="w-[1px] h-full bg-[#F8F7F4] mx-auto" />
           <div className="text-center">
              <p className="text-[10px] text-[#8A8886] font-black uppercase mb-1">Status Akun</p>
              <div className="flex items-center justify-center gap-1 text-[#22C55E]">
                 <ShieldCheck size={16} />
                 <span className="text-xl font-black">Gratis</span>
              </div>
           </div>
        </div>
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
