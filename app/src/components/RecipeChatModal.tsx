import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Bot, User, Trash2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "./Common";

export default function RecipeChatModal({ recipe, onClose, onUpdateRecipe, onDelete }: any) {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [recipe.chat_history, loading]);

  const handleSend = async () => {
    if (!msg.trim() || loading) return;
    const userMsg = msg.trim();
    setMsg("");
    setLoading(true);

    const historyCopy = [...(recipe.chat_history || [])];
    
    // Add user message to UI optimistic
    const updatedHistory = [...historyCopy, { role: "user", content: userMsg }];
    onUpdateRecipe({ ...recipe, chat_history: updatedHistory });

    try {
      const res = await fetch("http://localhost:8000/chat_recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipe_text: recipe.text,
          chat_history: historyCopy,
          message: userMsg
        })
      });
      if (!res.ok) throw new Error("Gagal nanya AI");
      const data = await res.json();
      
      const finalHistory = [...updatedHistory, { role: "assistant", content: data.reply }];
      onUpdateRecipe({ ...recipe, chat_history: finalHistory });
    } catch (err) {
      const finalHistory = [...updatedHistory, { role: "assistant", content: "Waduh bro, Chef AI gagal nangkep nih. Coba lagi ya!" }];
      onUpdateRecipe({ ...recipe, chat_history: finalHistory });
    } finally {
      setLoading(false);
    }
  };

  const formatMarkdown = (str: string) => {
    let html = str;
    html = html.replace(/^#\s+(.*)$/gm, '<h1 class="text-2xl font-black text-orange mb-4 leading-tight">$1</h1>');
    html = html.replace(/^##\s+(.*)$/gm, '<h2 class="text-lg font-black text-[#1A1C1E] mt-5 mb-2">$1</h2>');
    html = html.replace(/^###\s+(.*)$/gm, '<h3 class="font-bold text-[#1A1C1E] mt-4 mb-1">$1</h3>');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-[#1A1C1E]">$1</strong>');
    html = html.replace(/\*([\s\S]*?)\*/g, '<div class="text-[#8A8886] font-medium italic mb-4 border-l-2 border-orange/30 pl-3 py-1">$1</div>');
    html = html.replace(/^- (.*)$/gm, '<div class="flex gap-2 mb-1"><span class="text-orange font-black">•</span><span class="flex-1">$1</span></div>');
    html = html.replace(/^(\d+)\.\s+(.*)$/gm, '<div class="flex gap-2 mb-2"><span class="text-orange font-black">$1.</span><span class="flex-1">$2</span></div>');
    html = html.replace(/\n\n/g, '<div class="h-3"></div>');
    html = html.replace(/\n/g, '<br />');
    html = html.replace(/<br \/>(?:<br \/>)+/g, '<br />');
    html = html.replace(/<\/div><br \/>/g, '</div>');
    html = html.replace(/<br \/><div/g, '<div');
    return html;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: "100%", opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-[#F8F7F4] rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl relative h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 bg-white border-b border-[#F0EDE8] shadow-sm z-10 shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <h3 className="text-xl font-black text-[#1A1C1E] truncate">{recipe.title}</h3>
            <p className="text-[10px] text-[#8A8886] font-bold uppercase tracking-widest">{recipe.date}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => { onDelete(recipe.id); onClose(); }} className="p-2 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors">
              <Trash2 size={16} />
            </button>
            <button onClick={onClose} className="p-2 bg-[#F8F7F4] rounded-full hover:bg-black/5 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Chat Area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {/* Base Recipe Message */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-orange flex items-center justify-center shrink-0 shadow-lg shadow-orange/20">
              <Bot size={16} className="text-white" />
            </div>
            <div className="flex-1 bg-white p-5 rounded-3xl rounded-tl-none shadow-sm border border-[#F0EDE8]/50">
              <div 
                className="text-[#1A1C1E] text-sm leading-relaxed font-medium space-y-2"
                dangerouslySetInnerHTML={{ __html: formatMarkdown(recipe.text) }}
              />
            </div>
          </div>

          {/* Chat History */}
          {(recipe.chat_history || []).map((msgItem: any, i: number) => {
            const isUser = msgItem.role === 'user';
            return (
              <div key={i} className={cn("flex gap-3", isUser ? "flex-row-reverse" : "")}>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm", 
                  isUser ? "bg-[#1A1C1E] text-white" : "bg-orange text-white shadow-orange/20")}>
                  {isUser ? <User size={16} /> : <Bot size={16} />}
                </div>
                <div className={cn("p-4 rounded-3xl text-sm font-medium leading-relaxed max-w-[85%]", 
                  isUser ? "bg-[#1A1C1E] text-white rounded-tr-none" 
                         : "bg-white text-[#1A1C1E] border border-[#F0EDE8]/50 rounded-tl-none")}>
                  {isUser ? (
                    msgItem.content
                  ) : (
                    <div dangerouslySetInnerHTML={{ __html: formatMarkdown(msgItem.content) }} />
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading State */}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-orange flex items-center justify-center shrink-0">
                <Bot size={16} className="text-white" />
              </div>
              <div className="bg-white p-4 rounded-3xl rounded-tl-none border border-[#F0EDE8]/50 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-orange" />
                <span className="text-xs text-[#8A8886] font-bold">Chef AI lagi ngetik...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-[#F0EDE8] shrink-0">
          <div className="flex gap-3 items-center">
            <input 
              type="text" 
              value={msg}
              onChange={e => setMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Tanya soal resep ini..."
              className="flex-1 bg-[#F8F7F4] border border-[#F0EDE8] h-14 rounded-full px-5 text-sm font-medium text-[#1A1C1E] focus:outline-none focus:border-orange/50 transition-all placeholder:text-[#A6A4A1]"
            />
            <button 
              onClick={handleSend}
              disabled={!msg.trim() || loading}
              className="w-14 h-14 bg-gradient-to-tr from-orange to-[#FF8C61] hover:to-orange text-white rounded-full flex items-center justify-center shrink-0 shadow-[0_10px_20px_-5px_#FF6B35] disabled:opacity-50 disabled:shadow-none transition-all active:scale-95"
            >
              <Send size={20} className={loading ? "opacity-50" : ""} />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
