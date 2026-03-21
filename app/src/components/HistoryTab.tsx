"use client";

import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import { HistoryCard } from "./Common";

export default function HistoryTab({ history, grouped, onSelectItem, onDeleteItem, onClear }: any) {
  return (
    <motion.div key="history" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4 pb-20">
      <div className="flex justify-between items-center mb-2 px-1">
        <h2 className="text-xl font-black text-[#1A1C1E]">Semua Log Makanan</h2>
        {history.length > 0 && (
          <button onClick={onClear} className="p-2 text-[#EF4444] bg-red-50 rounded-full active:scale-90 transition-transform">
            <Trash2 size={18} />
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-8">
          {grouped.map((g: any) => (
            <div key={g.cat}>
              <div className="flex justify-between items-center mb-4 px-1 border-l-4 border-orange pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{g.cat === "Sarapan" ? "☀️" : g.cat === "Makan Siang" ? "🌤️" : g.cat === "Makan Malam" ? "🌙" : "🍪"}</span>
                  <h4 className="font-black text-[#1A1C1E]">{g.cat}</h4>
                </div>
                <span className="text-xs font-black text-orange bg-orange/10 px-3 py-1 rounded-full">{g.total} Kcal</span>
              </div>
              <div className="space-y-3">
                {g.items.map((item: any) => (
                  <HistoryCard key={item.id} item={item}
                    onClick={() => onSelectItem(item)}
                    onDelete={() => onDeleteItem(item.id)} />
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
  );
}
