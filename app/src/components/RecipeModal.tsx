import { motion, AnimatePresence } from "framer-motion";
import { X, ChefHat, UploadCloud, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { useState, useRef } from "react";
import { cn } from "./Common";

export default function RecipeModal({ onClose, onGenerate, loading, result, onSave }: any) {
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [additionalPrompt, setAdditionalPrompt] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      setImages(prev => {
        const combined = [...prev, ...newFiles].slice(0, 5);
        return combined;
      });
      
      setPreviews(prev => {
        const newUrls = newFiles.map(file => URL.createObjectURL(file));
        return [...prev, ...newUrls].slice(0, 5);
      });
      
      e.target.value = ""; // Reset input biar bisa upload file yg sama
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    const newPreviews = [...previews];
    URL.revokeObjectURL(newPreviews[index]);
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleGenerate = () => {
    // Bisa generate asalkan ada gambar ATAU ada text prompt
    if (images.length > 0 || additionalPrompt.trim() !== "") {
      onGenerate(images, additionalPrompt);
    }
  };

  const isDisable = loading || (images.length === 0 && additionalPrompt.trim() === "");

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/60 backdrop-blur-md" onClick={onClose}>
      <motion.div 
        initial={{ y: "100%", opacity: 0 }} 
        animate={{ y: 0, opacity: 1 }} 
        exit={{ y: "100%", opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-[3.5rem] sm:rounded-[3.5rem] overflow-hidden shadow-2xl relative max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 sm:p-8 pb-4 border-b border-[#F0EDE8]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-orange/10 flex items-center justify-center text-orange">
              <ChefHat size={20} />
            </div>
            <h3 className="text-xl font-black text-[#1A1C1E]">Resep Sisa Makro</h3>
          </div>
          <button onClick={onClose} className="p-2 bg-[#F8F7F4] rounded-full hover:bg-black/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto scrollbar-hide flex-1">
          {result ? (
            <AnimatePresence>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="p-6 bg-gradient-to-br from-[#FFF4F0] to-[#FFFBEB] rounded-3xl border border-orange/10 shadow-inner">
                  <div 
                    className="text-[#1A1C1E] text-sm leading-relaxed font-medium markdown-body space-y-2"
                    dangerouslySetInnerHTML={{ 
                      __html: result
                        .replace(/^#\s+(.*)$/gm, '<h1 class="text-2xl font-black text-orange mb-4 leading-tight">$1</h1>')
                        .replace(/^##\s+(.*)$/gm, '<h2 class="text-lg font-black text-[#1A1C1E] mt-5 mb-2">$1</h2>')
                        .replace(/^###\s+(.*)$/gm, '<h3 class="font-bold text-[#1A1C1E] mt-4 mb-1">$1</h3>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-black text-[#1A1C1E]">$1</strong>')
                        .replace(/\*([\s\S]*?)\*/g, '<span class="text-[#8A8886] italic">$1</span>')
                        .replace(/^- (.*)$/gm, '<div class="flex gap-2 mb-1"><span class="text-orange font-black">•</span><span class="flex-1">$1</span></div>')
                        .replace(/^(\d+)\.\s+(.*)$/gm, '<div class="flex gap-2 mb-2"><span class="text-orange font-black">$1.</span><span class="flex-1">$2</span></div>')
                        .replace(/\n\n/g, '<div class="h-3"></div>')
                        .replace(/\n/g, '<br />')
                        .replace(/<br \/>(?:<br \/>)+/g, '<br />')
                        .replace(/<\/div><br \/>/g, '</div>')
                        .replace(/<br \/><div/g, '<div')
                    }}
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => onSave?.(result)}
                    className="w-full bg-white border border-[#E5E3DF] hover:bg-[#F8F7F4] text-[#1A1C1E] h-14 rounded-[2rem] font-black shadow-sm active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Simpan ke Koleksi Resep 💾
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full bg-[#1A1C1E] hover:bg-black text-white h-14 rounded-[2rem] font-black shadow-lg active:scale-95 transition-all"
                  >
                    Tutup & Siap Masak! 🍳
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          ) : (
             <div className="space-y-6">
              <p className="text-sm text-[#8A8886] font-medium leading-relaxed">
                Foto bahan di kulkas (maks 5) dan/atau tambahkan request spesifik. AI akan racik resep sesuai sisa target kalori!
              </p>

              <input 
                type="file" 
                multiple 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
              />

              {previews.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    {previews.map((src, idx) => (
                      <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border border-[#F0EDE8] group">
                        <img src={src} className="w-full h-full object-cover" alt={`preview-${idx}`} />
                        <button 
                          onClick={() => removeImage(idx)}
                          className="absolute top-1 right-1 p-1 bg-black/50 text-white rounded-full opacity-100 transition-opacity"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    {previews.length < 5 && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-2xl border-2 border-dashed border-[#F0EDE8] flex flex-col items-center justify-center text-[#8A8886] hover:border-orange hover:text-orange transition-colors"
                      >
                        <Plus size={20} className="mb-1" />
                        <span className="text-[10px] font-black uppercase">Tambah</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-32 rounded-3xl border-2 border-dashed border-[#F0EDE8] bg-[#F8F7F4] flex flex-col items-center justify-center gap-3 text-[#8A8886] hover:border-orange hover:text-orange transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center group-hover:scale-110 transition-transform">
                    <ImageIcon size={20} className="text-orange" />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest">Pilih Foto Bahan</span>
                </button>
              )}

              <textarea
                value={additionalPrompt}
                onChange={e => setAdditionalPrompt(e.target.value)}
                placeholder="Request tambahan? (Cth: 'Lagi ngehindarin minyak, maunya direbus/dikukus aja')"
                className="w-full bg-[#F8F7F4] border border-[#F0EDE8] rounded-2xl p-4 text-sm font-medium text-[#1A1C1E] focus:outline-none focus:border-orange/50 focus:ring-1 transition-all resize-none h-24 placeholder:text-[#A6A4A1]"
              />

              <button 
                onClick={handleGenerate}
                disabled={isDisable}
                className={cn(
                  "w-full h-16 rounded-[2rem] font-black flex items-center justify-center gap-2 transition-all",
                  !isDisable 
                    ? "bg-gradient-to-tr from-orange to-[#FF8C61] text-white shadow-[0_10px_20px_-5px_#FF6B35] active:scale-95" 
                    : "bg-[#E5E3DF] text-[#A6A4A1] cursor-not-allowed"
                )}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Memasak Resep...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Buat Resep Sekarang
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

const Plus = ({ size, className }: { size: number, className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
);
