"use client";
import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Minimize2, Sparkles, User, Loader2, Volume2, VolumeX, Mic, MicOff } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function NommoAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Salutations. Je suis Nommo, l'esprit gardien de vos données. Comment puis-je vous éclairer aujourd'hui ?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSpeechIdx, setActiveSpeechIdx] = useState<number | null>(null);
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [autoSpeak, setAutoSpeak] = useState(false);
  
  const chatRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const { profile } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Clean up speech synthesis when chat window is closed or toggled
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setActiveSpeechIdx(null);
  }, [isOpen]);

  useGSAP(() => {
    if (isOpen) {
      gsap.to(chatRef.current, {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: "back.out(1.7)"
      });
      gsap.to(buttonRef.current, {
        rotation: 90,
        backgroundColor: "#5C3D2E",
        duration: 0.4
      });
    } else {
      gsap.to(chatRef.current, {
        scale: 0.8,
        opacity: 0,
        y: 50,
        duration: 0.4,
        ease: "power2.in"
      });
      gsap.to(buttonRef.current, {
        rotation: 0,
        backgroundColor: "#A66037",
        duration: 0.4
      });
    }
  }, { scope: chatRef, dependencies: [isOpen] });

  // Helper function to speak text out loud
  const speakText = (text: string, index: number) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    
    try {
      window.speechSynthesis.cancel();
      // Strip markdown symbols before reading aloud
      const cleanText = text.replace(/[*#`_\-]/g, "").trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = "fr-FR";
      
      utterance.onend = () => {
        setActiveSpeechIdx(null);
      };
      utterance.onerror = () => {
        setActiveSpeechIdx(null);
      };

      window.speechSynthesis.speak(utterance);
      setActiveSpeechIdx(index);
    } catch (e) {
      console.error("Speech Synthesis Error:", e);
      setActiveSpeechIdx(null);
    }
  };

  const toggleSpeech = (index: number, text: string) => {
    if (activeSpeechIdx === index) {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setActiveSpeechIdx(null);
    } else {
      speakText(text, index);
    }
  };

  const handleSend = async (customMessage?: string) => {
    const textToSend = customMessage || input;
    if (!textToSend.trim() || isLoading) return;

    // Interrupt any active speech reading
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setActiveSpeechIdx(null);
    }

    const userMessage = textToSend.trim();
    if (!customMessage) setInput("");
    
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: userMessage,
          context: {
            userName: profile?.displayName,
            role: profile?.role
          }
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      const reply = data.reply;
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);
      
      // Auto-vocalise the response if toggle is enabled
      if (autoSpeak) {
        // Wait slightly for DOM render, then speak
        setTimeout(() => {
          speakText(reply, newMessages.length);
        }, 300);
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Le flux des données est perturbé. Veuillez réessayer plus tard." }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe reference to handleSend for SpeechRecognition callbacks to avoid stale closures
  const handleSendRef = useRef(handleSend);
  useEffect(() => {
    handleSendRef.current = handleSend;
  });

  // Speech Recognition initialization
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = false;
        rec.lang = "fr-FR";

        rec.onstart = () => {
          setIsListening(true);
        };

        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          if (transcript.trim()) {
            handleSendRef.current(transcript);
          }
        };

        rec.onerror = (event: any) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          if (event.error === "not-allowed") {
            toast.error("Accès micro refusé. Veuillez autoriser le micro.");
          }
        };

        rec.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("La reconnaissance vocale n'est pas supportée par ce navigateur.");
      return;
    }
    
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      // Cancel active speech before recording
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setActiveSpeechIdx(null);
      recognitionRef.current.start();
    }
  };

  return (
    <div className="fixed bottom-8 right-8 z-[40] font-outfit">
      {/* Chat Window */}
      <div 
        ref={chatRef}
        className={`absolute bottom-20 right-0 w-[400px] h-[600px] bg-white rounded-[32px] shadow-dogon border border-[#E8DCC4] overflow-hidden flex flex-col origin-bottom-right transition-all duration-300 ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{ opacity: 0, scale: 0.8, transform: 'translateY(50px)' }}
      >
        {/* Header */}
        <div className="p-6 bg-[#2D1A12] text-[#FAF3E0] flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 animate-pulse">
                <Bot className="w-6 h-6 text-[#2D1A12]" />
             </div>
             <div>
                <h3 className="font-bold font-dogon tracking-wider text-sm">NOMMO AI</h3>
                <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Esprit Gardien</p>
             </div>
          </div>
          <div className="flex items-center gap-1">
             {/* Auto-vocalise toggle */}
             <button 
               onClick={() => setAutoSpeak(!autoSpeak)} 
               className={`p-2 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer outline-none border ${
                 autoSpeak 
                   ? "bg-[#D4AF37] text-[#2D1A12] border-[#D4AF37] font-bold" 
                   : "hover:bg-white/10 text-[#FAF3E0]/60 border-transparent"
               }`}
               title={autoSpeak ? "Désactiver la lecture auto" : "Activer la lecture auto"}
             >
                {autoSpeak ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-[9px] uppercase tracking-wider hidden sm:inline">{autoSpeak ? "Voix ON" : "Voix OFF"}</span>
             </button>
             <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors cursor-pointer">
                <Minimize2 className="w-4 h-4" />
             </button>
             <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group cursor-pointer">
                <X className="w-4 h-4 group-hover:text-red-400" />
             </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#FAF3E0]/30 relative">
          <div className="absolute inset-0 dogon-pattern opacity-5 pointer-events-none" />
          
          {/* Voice Listening Overlay */}
          {isListening && (
            <div className="absolute inset-0 bg-[#FAF3E0]/95 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-6">
              <div className="w-20 h-20 bg-[#D4AF37]/20 rounded-full flex items-center justify-center animate-pulse">
                <Mic className="w-10 h-10 text-[#5C3D2E] listening-pulse" />
              </div>
              <div className="flex gap-1.5 items-center justify-center h-10">
                <span className="speech-bar" />
                <span className="speech-bar" />
                <span className="speech-bar" />
                <span className="speech-bar" />
                <span className="speech-bar" />
              </div>
              <p className="text-sm font-bold text-[#5C3D2E] uppercase tracking-widest animate-pulse">Nommo vous écoute...</p>
              <button 
                onClick={toggleListening}
                className="px-6 py-2.5 bg-[#5C3D2E] hover:bg-[#A66037] text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-md cursor-pointer"
              >
                Annuler
              </button>
            </div>
          )}
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} relative z-10`}>
              <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                  m.role === "user" ? "bg-[#5C3D2E] text-white" : "bg-[#D4AF37] text-[#2D1A12]"
                }`}>
                  {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm flex flex-col ${
                  m.role === "user" 
                  ? "bg-[#5C3D2E] text-white rounded-tr-none" 
                  : "bg-white text-[#2D1A12] border border-[#E8DCC4] rounded-tl-none"
                }`}>
                  <div className="whitespace-pre-line">{m.content}</div>
                  
                  {m.role === "assistant" && (
                    <div className="mt-2.5 pt-2 border-t border-[#E8DCC4]/30 flex items-center justify-between text-[10px] text-[#A66037]">
                      <span className="font-semibold uppercase tracking-wider text-[8px] opacity-75">Nommo Vocale</span>
                      <button 
                        onClick={() => toggleSpeech(i, m.content)}
                        className="p-1 hover:bg-[#FAF3E0]/50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer text-[#A66037] hover:text-[#5C3D2E] outline-none"
                      >
                        {activeSpeechIdx === i ? (
                          <>
                            <div className="flex gap-0.5 items-center px-1 shrink-0 h-3">
                              <span className="audio-wave-bar" />
                              <span className="audio-wave-bar" />
                              <span className="audio-wave-bar" />
                            </div>
                            <VolumeX className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            <span className="font-bold text-[8px] uppercase tracking-wider">Écouter</span>
                            <Volume2 className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="flex gap-3 items-center bg-white/50 px-4 py-2 rounded-2xl border border-[#E8DCC4]">
                 <Loader2 className="w-4 h-4 text-[#A66037] animate-spin" />
                 <span className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest">Nommo réfléchit...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-white border-t border-[#E8DCC4] space-y-3 relative z-10">
          {/* Quick Suggestions Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ scrollbarWidth: "none" }}>
            {[
              { label: "📊 Chiffre d'affaires", query: "Quel est le chiffre d'affaires total ?" },
              { label: "🕒 Dernières ventes", query: "Quelles sont les dernières opérations ?" },
              { label: "🏢 Filiales", query: "Fais un point sur les ventes par filiale." },
              { label: "💰 Recouvrements", query: "Combien reste-t-il à recouvrer ?" }
            ].map((chip, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(chip.query)}
                disabled={isLoading}
                className="whitespace-nowrap px-3 py-1.5 rounded-full bg-[#FAF3E0] hover:bg-[#5C3D2E] hover:text-white border border-[#E8DCC4] text-[10px] font-bold text-[#5C3D2E] transition-all duration-200 shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {chip.label}
              </button>
            ))}
          </div>
          <div className="relative flex items-center gap-2">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Interroger l'esprit des données..."
              className="w-full pl-4 pr-24 py-4 rounded-2xl bg-[#FAF3E0]/50 border-none focus:ring-2 focus:ring-[#D4AF37]/30 text-sm font-medium placeholder-[#B89E7E]"
            />
            <div className="absolute right-2 flex items-center gap-1.5">
               <button
                 onClick={toggleListening}
                 type="button"
                 className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                   isListening 
                     ? "bg-[#D4AF37] text-[#2D1A12] listening-pulse font-bold" 
                     : "bg-[#FAF3E0] text-[#5C3D2E] hover:bg-[#5C3D2E]/10"
                 }`}
                 title={isListening ? "Arrêter l'écoute" : "Poser une question avec votre voix"}
               >
                 {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
               </button>
               <button 
                 onClick={() => handleSend()}
                 disabled={isLoading || !input.trim()}
                 className="p-2.5 bg-[#5C3D2E] text-white rounded-xl hover:bg-[#A66037] transition-all disabled:opacity-50 disabled:grayscale cursor-pointer"
               >
                 <Send className="w-4 h-4" />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <button 
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 rounded-[24px] bg-[#A66037] text-white flex items-center justify-center shadow-dogon hover:scale-110 active:scale-95 transition-all relative group overflow-hidden cursor-pointer"
      >
        <div className="absolute inset-0 dogon-pattern opacity-10" />
        <Bot className="w-8 h-8 relative z-10" />
        {!isOpen && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D4AF37] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-[#D4AF37]"></span>
          </span>
        )}
      </button>
    </div>
  );
}
