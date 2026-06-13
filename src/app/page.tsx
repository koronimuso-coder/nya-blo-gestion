"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Globe, 
  Zap, 
  Lock,
  ChevronDown
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  const container = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [showPreloader, setShowPreloader] = useState(true);

  useGSAP(() => {
    const progressObj = { value: 0 };

    // Floating background shapes
    gsap.to(".floating-shape", {
      y: "random(-30, 30)",
      x: "random(-30, 30)",
      duration: "random(3, 5)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Smooth progress counter animation
    gsap.to(progressObj, {
      value: 100,
      duration: 2.2,
      ease: "power2.out",
      onUpdate: () => {
        setProgress(Math.round(progressObj.value));
      },
      onComplete: () => {
        // Exit preloader animation
        const tlExit = gsap.timeline({
          onComplete: () => setShowPreloader(false)
        });

        tlExit.to(".preloader-logo", { scale: 1.15, filter: "blur(12px)", opacity: 0, duration: 0.6, ease: "power2.in" });
        tlExit.to(".preloader-progress", { opacity: 0, y: -20, duration: 0.4, ease: "power2.in" }, "-=0.4");
        tlExit.to(".preloader-screen", { 
          clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)", 
          duration: 0.8, 
          ease: "power3.inOut" 
        }, "-=0.2");

        // Staggered entrance for hero page elements
        const tlEntrance = gsap.timeline({ defaults: { ease: "power4.out" } });
        tlEntrance.fromTo(".nav-bar", { y: -55, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, "-=0.2");
        tlEntrance.fromTo(".hero-badge", { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 1 }, "-=0.9");
        tlEntrance.fromTo(".hero-title", { y: 80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.4 }, "-=1.1");
        tlEntrance.fromTo(".hero-subtitle", { y: 35, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, "-=1.2");
        tlEntrance.fromTo(".hero-cta", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 1 }, "-=1.0");
        tlEntrance.fromTo(".feature-card-anim", { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.15, duration: 0.8 }, "-=0.7");
        tlEntrance.fromTo(".scroll-ticker-anim", { opacity: 0 }, { opacity: 1, duration: 1.2 }, "-=0.5");
      }
    });
  }, { scope: container });

  return (
    <div ref={container} className="min-h-screen bg-[#1A0F0A] text-[#F7EAE3] selection:bg-[#D4AF37]/30 overflow-x-hidden font-outfit">
      
      {/* Preloader Screen */}
      {showPreloader && (
        <div className="preloader-screen fixed inset-0 z-[9999] bg-[#1A0F0A] flex flex-col items-center justify-center preloader-clip">
          <div className="absolute inset-0 z-0">
             <div className="dogon-pattern absolute inset-0 opacity-5" />
          </div>
          <div className="relative z-10 flex flex-col items-center">
             {/* Animating Kanaga Mask SVG */}
             <div className="preloader-logo mb-8 w-24 h-24 relative flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-20 h-20 stroke-[#D4AF37] fill-none stroke-2 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] animate-pulse">
                   <path d="M 50 15 L 50 85 M 20 25 L 80 25 M 20 25 L 20 15 M 80 25 L 80 15 M 30 75 L 70 75 M 30 75 L 30 85 M 70 75 L 70 85" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
             </div>
             
             {/* Progress text */}
             <div className="preloader-progress text-center space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-[0.4em] text-[#B89E7E] animate-pulse block">Initialisation de l&apos;Écosystème</span>
                <div className="text-3xl font-bold font-dogon text-white tracking-widest leading-none">
                   {progress}%
                </div>
                {/* Horizontal Progress Bar */}
                <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden border border-white/10 mx-auto">
                   <div className="bg-[#D4AF37] h-full rounded-full transition-all duration-100 ease-out" style={{ width: `${progress}%` }} />
                </div>
             </div>
          </div>
        </div>
      )}

      {/* Background Patterns */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#A66037]/20 rounded-full blur-[120px] floating-shape" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#5C3D2E]/20 rounded-full blur-[120px] floating-shape" />
        <div className="dogon-pattern absolute inset-0 opacity-10" />
      </div>

      {/* Navigation */}
      <nav className="nav-bar relative z-10 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto opacity-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
             <ShieldCheck className="w-6 h-6 text-[#1A0F0A]" />
          </div>
          <span className="text-xl font-bold font-dogon tracking-widest text-white uppercase">NYA BLO</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
           <a href="#vision" className="text-sm font-bold uppercase tracking-widest hover:text-[#D4AF37] transition-colors">Vision</a>
           <a href="#modules" className="text-sm font-bold uppercase tracking-widest hover:text-[#D4AF37] transition-colors">Écosystème</a>
           <Link href="/login">
              <Button variant="gold" className="rounded-xl px-8 shadow-gold cursor-pointer">Espace Pro</Button>
           </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-20 pb-20 max-w-5xl mx-auto min-h-[75vh]">
        <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-8 opacity-0">
          <Sparkles className="w-3 h-3" /> L'excellence Dogon au service du Business
        </div>
        
        <h1 className="hero-title text-7xl md:text-9xl font-bold text-white font-dogon leading-[0.9] mb-10 opacity-0">
          SYMÉTRIE & <span className="text-[#A66037]">TERRE</span>.
        </h1>
        
        <p className="hero-subtitle text-xl md:text-2xl text-[#B89E7E] max-w-2xl leading-relaxed mb-12 opacity-0">
          Le premier système d'exploitation commercial inspiré par la sagesse ancestrale. Pilotez vos entreprises avec une harmonie absolue.
        </p>
        
        <div className="hero-cta flex flex-col sm:flex-row gap-4 opacity-0">
           <Link href="/login">
              <Button variant="gold" size="lg" className="rounded-2xl h-16 px-10 text-lg shadow-gold group cursor-pointer">
                Commencer l'expédition <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
           </Link>
           <a href="#vision">
              <Button variant="outline" size="lg" className="rounded-2xl h-16 px-10 text-lg border-white/10 text-white hover:bg-white/5 cursor-pointer">
                   Explorer la Vision
              </Button>
           </a>
        </div>

        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 animate-bounce">
           <ChevronDown className="w-6 h-6 text-[#D4AF37]" />
        </div>
      </main>

      {/* Concept Marquee */}
      <div className="scroll-ticker-anim overflow-hidden w-full border-y border-white/5 py-8 bg-[#2D1A12]/30 backdrop-blur-sm relative z-10 my-12 opacity-0">
         <div className="animate-marquee flex gap-20 text-xs md:text-sm uppercase font-bold tracking-[0.4em] text-[#D4AF37]/50 whitespace-nowrap">
            <span>SAGESSE • TERRE • HARMONIE • PRÉCISION • RÉSILIENCE • ABONDANCE • SYMETRIE • PROSPERITE</span>
            <span>SAGESSE • TERRE • HARMONIE • PRÉCISION • RÉSILIENCE • ABONDANCE • SYMETRIE • PROSPERITE</span>
         </div>
      </div>

      {/* Cosmology & Vision Section */}
      <section id="vision" className="relative z-10 max-w-7xl mx-auto px-8 py-32 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
         <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#A66037]/10 border border-[#A66037]/20 text-[#A66037] text-[10px] font-bold uppercase tracking-[0.3em]">
               Architecture Conceptuelle
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-dogon text-white leading-tight">
               L&apos;Harmonie et le Grand Alignement Commercial.
            </h2>
            <p className="text-[#B89E7E] leading-relaxed">
               Pour les Dogons, chaque semence jetée en terre doit obéir à des cycles d&apos;équilibre céleste et terrestre. C&apos;est cette même philosophie que nous appliquons à votre architecture SaaS. Chaque vente saisie, chaque encaissement perçu est ordonné pour remplir les greniers de votre prospérité.
            </p>
            <div className="border-l-4 border-[#D4AF37] pl-6 italic text-white/80 text-sm font-medium">
               &ldquo;La parole du commerce est comme le grain : s&apos;il n&apos;est pas protégé avec soin dans le grenier de la rigueur, il s&apos;envole au premier vent.&rdquo;
            </div>
         </div>
         <div className="relative p-1 bg-white/5 border border-white/10 rounded-[40px] overflow-hidden aspect-video flex items-center justify-center shadow-2xl">
            <div className="absolute inset-0 dogon-pattern opacity-10" />
            {/* Styled interactive graphic representation */}
            <div className="relative text-center p-8 space-y-6">
               <div className="w-20 h-20 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto border border-[#D4AF37]/20">
                  <ShieldCheck className="w-10 h-10 text-[#D4AF37] animate-pulse" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-lg font-dogon text-white">Chambre de Rigueur et de Traçabilité</h4>
                  <p className="text-xs text-[#B89E7E] max-w-xs mx-auto">Toutes les actions administratives et financières sont consignées et scellées par des clés de sécurité inviolables.</p>
               </div>
            </div>
         </div>
      </section>

      {/* Features Preview */}
      <section id="modules" className="relative z-10 max-w-7xl mx-auto px-8 py-20">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <FeatureCard 
              icon={Globe}
              title="Multi-Filiale"
              desc="Gérez GALF, Flowers et toutes vos entités dans un seul écosystème unifié."
            />
            <FeatureCard 
              icon={Zap}
              title="Saisie Réelle"
              desc="Des points journaliers synchronisés en temps réel avec une précision chirurgicale."
            />
            <FeatureCard 
              icon={Lock}
              title="Étanchéité"
              desc="Sécurité Dogon garantie par Firebase pour une protection totale de vos secrets."
            />
         </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-12 px-8">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[#B89E7E] text-sm italic">© {new Date().getFullYear()} NYA BLO SARL. L'architecture du futur.</p>
            <div className="flex gap-6">
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Abidjan</span>
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Bamako</span>
               <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Dakar</span>
            </div>
         </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
  return (
    <div className="feature-card-anim group p-10 rounded-[40px] bg-white/5 border border-white/5 hover:border-[#D4AF37]/30 transition-all opacity-0">
       <div className="w-14 h-14 bg-[#A66037]/20 rounded-2xl flex items-center justify-center text-[#D4AF37] mb-8 group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6" />
       </div>
       <h3 className="text-2xl font-bold text-white font-dogon mb-4">{title}</h3>
       <p className="text-[#B89E7E] leading-relaxed text-sm">{desc}</p>
    </div>
  );
}
