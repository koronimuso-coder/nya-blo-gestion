"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, ArrowLeft, Home } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#1A0F0A] text-[#F7EAE3] flex flex-col items-center justify-center relative overflow-hidden font-outfit selection:bg-[#D4AF37]/30">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#A66037]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#5C3D2E]/10 rounded-full blur-[120px]" />
        <div className="dogon-pattern absolute inset-0 opacity-[0.04]" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-lg">
        {/* Kanaga SVG */}
        <div className="mb-8 flex justify-center">
          <svg viewBox="0 0 100 100" className="w-24 h-24 stroke-[#D4AF37] fill-none stroke-2 drop-shadow-[0_0_15px_rgba(212,175,55,0.3)] animate-pulse">
            <path d="M 50 15 L 50 85 M 20 25 L 80 25 M 20 25 L 20 15 M 80 25 L 80 15 M 30 75 L 70 75 M 30 75 L 30 85 M 70 75 L 70 85" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        {/* 404 */}
        <h1 className="text-8xl md:text-9xl font-bold font-dogon text-[#D4AF37]/20 leading-none mb-4">404</h1>

        <h2 className="text-2xl md:text-3xl font-bold font-dogon text-white mb-4">
          Vous avez quitté le sentier sacré
        </h2>

        <p className="text-[#B89E7E] leading-relaxed mb-10">
          Cette page n&apos;existe pas dans l&apos;architecture de NYA BLO. 
          Comme le disent les anciens : <em className="text-white/70">&ldquo;Celui qui s&apos;éloigne du grenier finit par errer dans la brousse.&rdquo;</em>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#D4AF37] text-[#1A0F0A] rounded-2xl font-bold shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all hover:scale-105 active:scale-95">
            <Home className="w-5 h-5" /> Retour à l&apos;accueil
          </Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl border border-white/10 text-white hover:bg-white/5 transition-all font-bold">
            <ArrowLeft className="w-5 h-5" /> Dashboard
          </Link>
        </div>

        <div className="mt-16 flex items-center justify-center gap-3">
          <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-[#1A0F0A]" />
          </div>
          <span className="text-xs text-white/30 font-bold uppercase tracking-widest">NYA BLO GESTION</span>
        </div>
      </div>
    </div>
  );
}
