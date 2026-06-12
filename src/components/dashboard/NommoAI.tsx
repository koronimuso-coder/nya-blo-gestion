"use client";

import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, X, Minimize2, Sparkles, User, Loader2, Volume2, VolumeX } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useAuth } from "@/context/AuthContext";

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
  
  const chatRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
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

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => [...prev, { role: "assistant", content: "Le flux des données est perturbé. Veuillez réessayer plus tard." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSpeech = (index: number, text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    if (activeSpeechIdx === index) {
      window.speechSynthesis.cancel();
      setActiveSpeechIdx(null);
    } else {
      window.speechSynthesis.cancel();
      
      // Strip markdown before reading aloud
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
          <div className="flex items-center gap-2">
             <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <Minimize2 className="w-4 h-4" />
             </button>
             <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-red-500/20 rounded-lg transition-colors group">
                <X className="w-4 h-4 group-hover:text-red-400" />
             </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#FAF3E0]/30">
          <div className="absolute inset-0 dogon-pattern opacity-5 pointer-events-none" />
          
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} relative z-10`}>
              <div className={`flex gap-3 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center ${
                  m.role === "user" ? "bg-[#5C3D2E] text-white" : "bg-[#D4AF37] text-[#2D1A12]"
                }`}>
                  {m.role === "user" ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm flex flex-col ${
                  m.role === "user" 
                  ? "bg-[#5C3D2E] text-white rounded-tr-none" 
                  : "bg-white text-[#2D1A12] border border-[#E8DCC4] rounded-tl-none"
                }`}>
                  <div>{m.content}</div>
                  
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
        <div className="p-4 bg-white border-t border-[#E8DCC4] space-y-3">
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
              className="w-full pl-4 pr-12 py-4 rounded-2xl bg-[#FAF3E0]/50 border-none focus:ring-2 focus:ring-[#D4AF37]/30 text-sm font-medium placeholder-[#B89E7E]"
            />
            <button 
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 p-2.5 bg-[#5C3D2E] text-white rounded-xl hover:bg-[#A66037] transition-all disabled:opacity-50 disabled:grayscale cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
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

