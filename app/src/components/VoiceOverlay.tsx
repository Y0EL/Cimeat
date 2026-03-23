"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Mic, X, Check, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "./Common";

export default function VoiceOverlay({ isOpen, onClose, onConfirm, isAnalyzing }: any) {
  const [transcript, setTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [volumes, setVolumes] = useState(new Array(25).fill(5));
  const [standbyMsg, setStandbyMsg] = useState<string | null>(null);
  
  const STANDBY_PROMPTS = [
    "Hey, apa kamu masih di sana??",
    "Halo? Kok diem aja bro?",
    "Cimeat udah siap nyatet nih, yuk ngomong!",
    "Lagi mikir ya makan apa? Kasih tau gue dong!",
    "Gue dengerin kok, santai aja!",
    "Ada makanan rahasia yang mau dicatat? 😉"
  ];
  
  const recognitionRef = useRef<any>(null);
  const silenceTimerRef = useRef<any>(null);
  const standbyTimerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);

  const startSession = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Setup Visualizer
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 64;
      startVisualizerAnimation();

      // Setup Recorder & Start immediately for natural lead-in
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorderRef.current.start(200);
      isRecordingRef.current = true;

      // Start Listening only after everything is ready
      startListening();
      resetStandbyTimer();
    } catch (err) {
      console.error("Session start error:", err);
      onClose();
    }
  };

  const startVisualizerAnimation = () => {
    if (!analyserRef.current) return;
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const update = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const raw = [];
      const step = Math.floor(dataArray.length / 25);
      for (let i = 0; i < 25; i++) {
        let sum = 0;
        const start = i * step;
        for (let j = 0; j < step; j++) sum += dataArray[start + j];
        raw.push(Math.max(5, (sum / step / 255) * 65));
      }

      const mid = new Array(25);
      let l = 12;
      let r = 13;
      for (let i = 0; i < 25; i++) {
         if (i % 2 === 0) {
            if (l >= 0) mid[l--] = raw[i];
         } else {
            if (r < 25) mid[r++] = raw[i];
         }
      }

      setVolumes(mid);
      animationFrameRef.current = requestAnimationFrame(update);
    };
    update();
  };

  useEffect(() => {
    if (isOpen) {
      setTranscript("");
      setFinalTranscript("");
      setStandbyMsg(null);
      setIsConfirming(false); // Reset lock
      startSession();
    } else {
      stopListening();
    }
    return () => stopListening();
  }, [isOpen]);

  const resetStandbyTimer = () => {
    if (standbyTimerRef.current) clearTimeout(standbyTimerRef.current);
    standbyTimerRef.current = setTimeout(() => {
       const text = (finalTranscript + transcript).trim();
       if (!text) {
          const randomIdx = Math.floor(Math.random() * STANDBY_PROMPTS.length);
          setStandbyMsg(STANDBY_PROMPTS[randomIdx]);
       }
    }, 5000);
  };

  const startListening = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = "id-ID";
    recognitionRef.current.interimResults = true;
    recognitionRef.current.continuous = true;

    recognitionRef.current.onstart = () => setIsListening(true);
    recognitionRef.current.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) final += event.results[i][0].transcript;
        else interim += event.results[i][0].transcript;
      }
      if (final) setFinalTranscript(prev => prev + " " + final);
      setTranscript(interim);
      setStandbyMsg(null); // Clear nudge if talking
      resetStandbyTimer(); // Reset the 5s nudge timer


      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = setTimeout(() => {
        const text = (finalTranscript + final + interim).trim();
        if (text) {
           handleConfirm(); 
        }
      }, 4500); // More natural 4.5s silence timeout
    };

    recognitionRef.current.onend = () => setIsListening(false);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close();
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (standbyTimerRef.current) clearTimeout(standbyTimerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
       mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
    isRecordingRef.current = false;
  };

  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (isConfirming || isAnalyzing) return;
    const fullText = (finalTranscript + " " + transcript).trim();
    if (!fullText) return;

    setIsConfirming(true);

    // Stop everything immediately
    if (recognitionRef.current) {
       try { recognitionRef.current.stop(); } catch(e) {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (standbyTimerRef.current) clearTimeout(standbyTimerRef.current);
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    
    // Stop recorder and wait for final chunks
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      const stopPromise = new Promise<string | null>((resolve) => {
        if (!mediaRecorderRef.current) return resolve(null);
        
        mediaRecorderRef.current.onstop = () => {
          if (audioChunksRef.current.length === 0) return resolve(null);
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        };
        mediaRecorderRef.current.stop();
      });

      const audioData = await stopPromise;
      onConfirm(fullText, audioData);
    } else {
      onConfirm(fullText, null);
    }
    
    // Cleanup stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setIsListening(false);
    isRecordingRef.current = false;
    // We don't reset isConfirming here because the modal will close anyway, 
    // or if it stays open for analysis info, we want it to stay 'locked'.
  };

  const currentText = (finalTranscript + " " + transcript).trim();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isAnalyzing ? onClose : undefined}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[3rem] p-8 z-[101] shadow-2xl safe-p-bottom min-h-[45vh] flex flex-col items-center justify-between"
          >
            {/* Offside Standby Nudge */}
            <AnimatePresence>
              {standbyMsg && !currentText && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="absolute bottom-full left-6 mb-2 z-50 pointer-events-none"
                >
                  <div className="bg-white/95 backdrop-blur-xl py-2.5 px-6 rounded-full border border-white/50 shadow-2xl flex items-center justify-center">
                    <p className="text-[12px] font-black text-[#1A1C1E] tracking-tight leading-none px-1">
                      {standbyMsg}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="w-12 h-1.5 bg-[#F0EDE8] rounded-full mb-8" />
            
            <div className="flex-1 flex flex-col items-center justify-center w-full space-y-8 py-4">
              {/* Visualizer Orb */}
              <div className="relative h-24 w-full flex items-center justify-center gap-1.5 px-10">
                {volumes.map((vol, i) => (
                  <motion.div
                    key={`bar-${i}`}
                    animate={{ 
                      height: isAnalyzing ? [10, 40, 10] : (isListening ? vol : 5),
                      opacity: isAnalyzing ? 1 : (isListening ? 1 : 0.3)
                    }}
                    transition={isAnalyzing ? { repeat: Infinity, duration: 1, delay: i * 0.05 } : { duration: 0.1 }}
                    className="w-2 bg-orange rounded-full"
                    style={{ 
                      backgroundColor: isAnalyzing ? `hsl(${25 + i * 2}, 100%, 50%)` : `hsl(25, 100%, ${40 + (i * 1.5)}%)`
                    }}
                  />
                ))}
              </div>

              {/* Transcript Display */}
              <div className="text-center px-4 max-w-md">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={isAnalyzing ? "anal" : "trans"}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "text-xl font-black transition-all leading-tight", 
                      currentText ? "text-[#1A1C1E]" : "text-[#8A8886]/30 italic",
                      isAnalyzing && "text-orange animate-pulse"
                    )}
                  >
                    {isAnalyzing ? "AI sedang mikir bentar ya..." : (currentText || "Sebutkan makananmu...")}
                  </motion.p>
                </AnimatePresence>
                
                {isListening && !isAnalyzing && (
                  <div className="flex flex-col items-center justify-center gap-2 mt-8">
                    <p className="text-[10px] uppercase font-black tracking-[0.4em] text-orange opacity-40">Mendengarkan</p>
                    {currentText && !isAnalyzing && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[9px] font-bold text-orange/60 italic mt-2">
                        Berhenti bicara selama 3 detik untuk konfirmasi otomatis...
                      </motion.p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <AnimatePresence>
              {!isAnalyzing && (
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 20 }}
                   className="flex items-center gap-4 w-full mt-10"
                >
                  <button 
                    onClick={onClose}
                    className="flex-1 h-16 rounded-[1.5rem] bg-[#F8F7F4] text-[#1A1C1E] font-black tracking-tight active:scale-95 transition-all flex items-center justify-center gap-2 border border-[#F0EDE8]"
                  >
                    <X size={18} /> Batal
                  </button>
                  <button 
                    onClick={handleConfirm}
                    disabled={!currentText || isConfirming || isAnalyzing}
                    className="flex-[2] h-16 rounded-[1.5rem] bg-orange text-white font-black tracking-tight active:scale-95 transition-all shadow-xl shadow-orange/30 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isConfirming || isAnalyzing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                    {isConfirming ? "Memproses..." : "Konfirmasi"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
