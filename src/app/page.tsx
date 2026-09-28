"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldCheck, 
  ArrowRight, 
  Sparkles, 
  Globe, 
  Zap, 
  Lock, 
  ChevronDown, 
  ChevronUp,
  Gift, 
  Quote, 
  Menu, 
  X,
  TrendingUp,
  Award,
  Layers,
  Bot,
  Sliders,
  CheckCircle2,
  Phone,
  BarChart3,
  Calendar,
  Users
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { Button } from "@/components/ui/Button";

export default function LandingPage() {
  const container = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [showPreloader, setShowPreloader] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "parrainage" | "nommo">("dashboard");
  const [referralCount, setReferralCount] = useState<number>(5);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Skip or execute preloader smoothly
  useEffect(() => {
    if (typeof window !== "undefined") {
      const alreadySeen = sessionStorage.getItem("nya_preloader_seen");
      if (alreadySeen) {
        setShowPreloader(false);
        // Animate entrance directly
        setTimeout(() => {
          gsap.to(".nav-bar", { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" });
          gsap.to(".hero-badge", { scale: 1, opacity: 1, duration: 0.8, ease: "power3.out" });
          gsap.to(".hero-title", { y: 0, opacity: 1, duration: 0.9, ease: "power4.out" });
          gsap.to(".hero-subtitle", { y: 0, opacity: 1, duration: 0.9, ease: "power3.out" });
          gsap.to(".hero-cta", { scale: 1, opacity: 1, duration: 0.8, ease: "back.out(1.5)" });
          gsap.to(".hero-metrics", { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" });
          gsap.to(".feature-card-anim", { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: "power2.out" });
          gsap.to(".scroll-ticker-anim", { opacity: 1, duration: 0.8 });
        }, 100);
      }
    }
  }, []);

  const skipPreloader = () => {
    sessionStorage.setItem("nya_preloader_seen", "true");
    setShowPreloader(false);
    gsap.to(".nav-bar", { y: 0, opacity: 1, duration: 0.6 });
    gsap.to(".hero-badge", { scale: 1, opacity: 1, duration: 0.6 });
    gsap.to(".hero-title", { y: 0, opacity: 1, duration: 0.8 });
    gsap.to(".hero-subtitle", { y: 0, opacity: 1, duration: 0.8 });
    gsap.to(".hero-cta", { scale: 1, opacity: 1, duration: 0.6 });
    gsap.to(".hero-metrics", { opacity: 1, y: 0, duration: 0.6 });
    gsap.to(".feature-card-anim", { y: 0, opacity: 1, stagger: 0.08, duration: 0.6 });
    gsap.to(".scroll-ticker-anim", { opacity: 1, duration: 0.6 });
  };

  useGSAP(() => {
    // Floating background shapes
    gsap.to(".floating-shape", {
      y: "random(-25, 25)",
      x: "random(-20, 20)",
      duration: "random(4, 7)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    const alreadySeen = typeof window !== "undefined" && sessionStorage.getItem("nya_preloader_seen");
    if (!alreadySeen && showPreloader) {
      const progressObj = { value: 0 };
      gsap.to(progressObj, {
        value: 100,
        duration: 1.4,
        ease: "power2.out",
        onUpdate: () => {
          setProgress(Math.round(progressObj.value));
        },
        onComplete: () => {
          sessionStorage.setItem("nya_preloader_seen", "true");
          const tlExit = gsap.timeline({
            onComplete: () => setShowPreloader(false)
          });

          tlExit.to(".preloader-logo", { scale: 1.15, filter: "blur(12px)", opacity: 0, duration: 0.5, ease: "power2.in" });
          tlExit.to(".preloader-progress", { opacity: 0, y: -20, duration: 0.3, ease: "power2.in" }, "-=0.3");
          tlExit.to(".preloader-screen", { 
            clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)", 
            duration: 0.6, 
            ease: "power3.inOut" 
          }, "-=0.1");

          const tlEntrance = gsap.timeline({ defaults: { ease: "power4.out" } });
          tlEntrance.fromTo(".nav-bar", { y: -50, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, "-=0.1");
          tlEntrance.fromTo(".hero-badge", { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8 }, "-=0.7");
          tlEntrance.fromTo(".hero-title", { y: 70, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, "-=0.8");
          tlEntrance.fromTo(".hero-subtitle", { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, "-=0.9");
          tlEntrance.fromTo(".hero-cta", { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8 }, "-=0.7");
          tlEntrance.fromTo(".hero-metrics", { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, "-=0.6");
          tlEntrance.fromTo(".feature-card-anim", { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.12, duration: 0.8 }, "-=0.6");
          tlEntrance.fromTo(".scroll-ticker-anim", { opacity: 0 }, { opacity: 1, duration: 1 }, "-=0.4");
        }
      });
    }
  }, { scope: container, dependencies: [showPreloader] });

  // Calculation for referral simulator
  const freeFormationsCount = Math.floor(referralCount / 5);
  const remainingForNext = 5 - (referralCount % 5);
  const getAmbassadorRank = (count: number) => {
    if (count >= 20) return { title: "Grand Maître Diamant", badge: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30" };
    if (count >= 15) return { title: "Élite Or", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" };
    if (count >= 10) return { title: "Élite Argent", badge: "bg-slate-300/20 text-slate-200 border-slate-300/30" };
    if (count >= 5) return { title: "Ambassadeur Certifié", badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" };
    return { title: "Apprenti Ambassadeur", badge: "bg-[#D4AF37]/20 text-[#D4AF37] border-[#D4AF37]/30" };
  };
  const rank = getAmbassadorRank(referralCount);

  const faqItems = [
    {
      q: "Qu'est-ce que NYA BLO GESTION ?",
      a: "NYA BLO est un système d'exploitation commercial et financier pour les entreprises ouest-africaines. Inspiré par la cosmologie Dogon d'équilibre et de rigueur, il unifie la gestion multi-filiales, le suivi des encaissements en temps réel, le reporting intelligent par IA, et les programmes de fidélité et parrainage."
    },
    {
      q: "Comment fonctionne le programme de Parrainage GALF ?",
      a: "Chaque membre s'inscrit gratuitement pour générer un code parrain unique. Pour chaque 5 filleuls ayant validé leur inscription à une formation GALF (HSE, CACES, Secourisme, Informatique), vous recevez automatiquement 1 formation certifiante 100% offerte !"
    },
    {
      q: "Mes données commerciales sont-elles sécurisées ?",
      a: "Absolument. Les données de vos filiales et clients sont chiffrées de bout en bout avec des règles de sécurité Firebase avancées, un journal d'audit infalsifiable et un cloisonnement strict par niveau d'accès (Agent, Superviseur, Admin Entreprise, Super Admin)."
    },
    {
      q: "Comment puis-je tester la solution ou former mes équipes ?",
      a: "Vous pouvez vous connecter à votre Espace Pro ou contacter nos bureaux régionaux à Abidjan, Bamako ou Dakar pour un déploiement clé-en-main en moins de 48 heures."
    }
  ];

  return (
    <div ref={container} className="min-h-screen bg-[#1A0F0A] text-[#F7EAE3] selection:bg-[#D4AF37]/30 overflow-x-hidden font-outfit relative">
      
      {/* Preloader Screen */}
      {showPreloader && (
        <div className="preloader-screen fixed inset-0 z-[9999] bg-[#1A0F0A] flex flex-col items-center justify-center preloader-clip">
          <div className="absolute inset-0 z-0">
             <div className="dogon-pattern absolute inset-0 opacity-5" />
          </div>
          <div className="relative z-10 flex flex-col items-center px-6">
             {/* Animating Kanaga Mask SVG */}
             <div className="preloader-logo mb-8 w-24 h-24 relative flex items-center justify-center">
                <svg viewBox="0 0 100 100" className="w-20 h-20 stroke-[#D4AF37] fill-none stroke-2 drop-shadow-[0_0_20px_rgba(212,175,55,0.5)] animate-pulse">
                   <path d="M 50 15 L 50 85 M 20 25 L 80 25 M 20 25 L 20 15 M 80 25 L 80 15 M 30 75 L 70 75 M 30 75 L 30 85 M 70 75 L 70 85" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
             </div>
             
             {/* Progress text */}
             <div className="preloader-progress text-center space-y-4 max-w-sm">
                <span className="text-[11px] uppercase font-bold tracking-[0.4em] text-[#D4AF37] animate-pulse block">Initialisation de l&apos;Écosystème</span>
                <div className="text-4xl font-bold font-dogon text-white tracking-widest leading-none">
                   {progress}%
                </div>
                {/* Horizontal Progress Bar */}
                <div className="w-56 h-1.5 bg-white/10 rounded-full overflow-hidden border border-white/10 mx-auto">
                   <div className="bg-gradient-to-r from-[#D4AF37] to-[#A66037] h-full rounded-full transition-all duration-100 ease-out" style={{ width: `${progress}%` }} />
                </div>
                {/* Skip button */}
                <button 
                  onClick={skipPreloader}
                  className="mt-3 text-[11px] text-[#B89E7E] hover:text-[#D4AF37] uppercase tracking-wider font-semibold transition-colors cursor-pointer py-1 px-3 rounded-full hover:bg-white/5 inline-flex items-center gap-1.5"
                >
                  Passer l&apos;introduction <ArrowRight className="w-3 h-3" />
                </button>
             </div>
          </div>
        </div>
      )}

      {/* Atmospheric Glow Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-[#A66037]/15 rounded-full blur-[140px] floating-shape" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#5C3D2E]/20 rounded-full blur-[140px] floating-shape" />
        <div className="absolute top-[40%] right-[10%] w-[35%] h-[35%] bg-[#D4AF37]/5 rounded-full blur-[160px]" />
        <div className="dogon-pattern absolute inset-0 opacity-[0.07]" />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#1A0F0A]/85 border-b border-white/10 transition-all">
        <nav className="nav-bar flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto opacity-0">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 bg-gradient-to-br from-[#D4AF37] to-[#A66037] rounded-2xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 group-hover:rotate-12 transition-transform duration-300">
               <ShieldCheck className="w-6 h-6 text-[#1A0F0A]" />
            </div>
            <div>
              <span className="text-xl font-bold font-dogon tracking-widest text-white uppercase block leading-none">NYA BLO</span>
              <span className="text-[9px] text-[#D4AF37] font-bold tracking-[0.25em] uppercase">Business OS</span>
            </div>
          </Link>

          {/* Desktop Links */}
          <div className="hidden lg:flex items-center gap-8">
             <a href="#vision" className="text-xs font-bold uppercase tracking-widest text-[#F7EAE3]/80 hover:text-[#D4AF37] transition-colors">Vision</a>
             <a href="#modules" className="text-xs font-bold uppercase tracking-widest text-[#F7EAE3]/80 hover:text-[#D4AF37] transition-colors">Écosystème</a>
             <a href="#demo" className="text-xs font-bold uppercase tracking-widest text-[#F7EAE3]/80 hover:text-[#D4AF37] transition-colors">Espace Démo</a>
             <a href="#simulateur" className="text-xs font-bold uppercase tracking-widest text-[#F7EAE3]/80 hover:text-[#D4AF37] transition-colors">Simulateur</a>
             <Link href="/parrainage" className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] hover:underline transition-colors flex items-center gap-1.5">
               <Gift className="w-3.5 h-3.5" /> Parrainage GALF
             </Link>
          </div>

          <div className="hidden sm:flex items-center gap-3">
             <Link href="/parrainage/inscription" className="text-xs font-bold uppercase tracking-wider text-[#B89E7E] hover:text-white px-4 py-2 rounded-xl transition-colors">
               Ambassadeur
             </Link>
             <Link href="/login">
                <Button variant="gold" className="rounded-xl px-6 py-2.5 text-xs uppercase tracking-wider font-bold shadow-gold cursor-pointer flex items-center gap-2 hover:scale-105 active:scale-95 transition-all">
                  Espace Pro <ArrowRight className="w-3.5 h-3.5" />
                </Button>
             </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-[#D4AF37]" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile Navigation Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-white/10 bg-[#1A0F0A]/95 backdrop-blur-2xl px-6 py-8 space-y-6 animate-fadeIn">
            <div className="flex flex-col gap-4 text-sm font-bold uppercase tracking-wider">
               <a 
                 href="#vision" 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
               >
                 Vision Dogon
               </a>
               <a 
                 href="#modules" 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
               >
                 Modules & Écosystème
               </a>
               <a 
                 href="#demo" 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
               >
                 Démonstration Interactive
               </a>
               <a 
                 href="#simulateur" 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
               >
                 Simulateur de Récompenses
               </a>
               <Link 
                 href="/parrainage" 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className="p-3 rounded-xl bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] flex items-center justify-between"
               >
                 <span>Programme Parrainage</span>
                 <Gift className="w-4 h-4" />
               </Link>
            </div>

            <div className="pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
              <Link href="/parrainage/inscription" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                <Button variant="outline" className="w-full rounded-xl py-3 border-white/20 text-xs font-bold">
                  S&apos;inscrire
                </Button>
              </Link>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="w-full">
                <Button variant="gold" className="w-full rounded-xl py-3 text-xs font-bold shadow-gold">
                  Connexion Pro
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 md:pt-24 pb-20 max-w-6xl mx-auto">
        
        {/* Live Status Pill */}
        <div className="hero-badge inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-white/10 to-white/5 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] mb-8 opacity-0 shadow-lg shadow-black/40">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          L&apos;excellence Dogon au service de votre Business
        </div>
        
        <h1 className="hero-title text-5xl sm:text-7xl md:text-9xl font-bold text-white font-dogon leading-[0.92] mb-8 opacity-0 tracking-tight">
          SYMÉTRIE & <span className="earth-gradient-text">TERRE</span>.
        </h1>
        
        <p className="hero-subtitle text-lg md:text-2xl text-[#E8DCC4]/90 max-w-3xl leading-relaxed mb-10 opacity-0 font-light">
          Le premier système d&apos;exploitation commercial inspiré de la cosmologie ancestrale. 
          Pilotez vos filiales, vos encaissements et vos parrainages avec une <span className="text-[#D4AF37] font-semibold">harmonie absolue</span>.
        </p>
        
        {/* Action Buttons */}
        <div className="hero-cta flex flex-col sm:flex-row items-center gap-4 opacity-0 mb-14 w-full sm:w-auto">
           <Link href="/login" className="w-full sm:w-auto">
              <Button variant="gold" size="lg" className="w-full sm:w-auto rounded-2xl h-16 px-10 text-base md:text-lg shadow-gold group cursor-pointer font-bold tracking-wide flex items-center justify-center">
                Accéder à l&apos;Espace Pro <ArrowRight className="ml-3 w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
              </Button>
           </Link>
           <a href="#demo" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-2xl h-16 px-9 text-base border-white/20 text-white hover:bg-white/10 cursor-pointer font-semibold backdrop-blur-md">
                Voir l&apos;Espace Démo
              </Button>
           </a>
        </div>

        {/* Live Metrics Ribbon */}
        <div className="hero-metrics opacity-0 w-full max-w-4xl grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-3xl bg-white/[0.04] border border-white/10 backdrop-blur-md shadow-2xl">
          <div className="p-3 text-center">
            <p className="text-2xl md:text-3xl font-bold font-dogon text-[#D4AF37]">15+</p>
            <p className="text-[10px] md:text-xs text-[#B89E7E] uppercase font-bold tracking-wider">Entités Opérationnelles</p>
          </div>
          <div className="p-3 text-center border-l border-white/5">
            <p className="text-2xl md:text-3xl font-bold font-dogon text-white">42M+</p>
            <p className="text-[10px] md:text-xs text-[#B89E7E] uppercase font-bold tracking-wider">FCFA Consignés / Mois</p>
          </div>
          <div className="p-3 text-center border-l border-white/5">
            <p className="text-2xl md:text-3xl font-bold font-dogon text-emerald-400">92%</p>
            <p className="text-[10px] md:text-xs text-[#B89E7E] uppercase font-bold tracking-wider">Taux de Recouvrement</p>
          </div>
          <div className="p-3 text-center border-l border-white/5">
            <p className="text-2xl md:text-3xl font-bold font-dogon text-[#A66037]">24/7</p>
            <p className="text-[10px] md:text-xs text-[#B89E7E] uppercase font-bold tracking-wider">IA Gardienne Nommo</p>
          </div>
        </div>

        <div className="mt-14 animate-bounce">
           <a href="#vision" aria-label="Défiler vers le bas" className="p-2 inline-block text-[#D4AF37]/60 hover:text-[#D4AF37] transition-colors">
             <ChevronDown className="w-6 h-6" />
           </a>
        </div>
      </main>

      {/* Marquee Concept Ticker */}
      <div className="scroll-ticker-anim overflow-hidden w-full border-y border-white/10 py-6 bg-[#2D1A12]/40 backdrop-blur-md relative z-10 opacity-0">
         <div className="animate-marquee flex gap-16 text-xs md:text-sm uppercase font-bold tracking-[0.4em] text-[#D4AF37]/70 whitespace-nowrap">
            <span>SAGESSE ANCESTRALE • GESTION COMMERCIALE • RECOUVREMENT • RÉSILIENCE DOGON • PROSPÉRITÉ • SYMETRIE • EXPÉDITION • INTÉGRITÉ</span>
            <span>SAGESSE ANCESTRALE • GESTION COMMERCIALE • RECOUVREMENT • RÉSILIENCE DOGON • PROSPÉRITÉ • SYMETRIE • EXPÉDITION • INTÉGRITÉ</span>
         </div>
      </div>

      {/* Interactive Showcase & Product Demo */}
      <section id="demo" className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-28">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <Sliders className="w-3.5 h-3.5" /> Expérience Interactive
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-dogon text-white mb-4">
            Explorez l&apos;Écosystème NYA BLO
          </h2>
          <p className="text-[#B89E7E] text-base max-w-2xl mx-auto">
            Sélectionnez une fonctionnalité pour prévisualiser la puissance de la plateforme en temps réel.
          </p>

          {/* Tab Selector */}
          <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "dashboard"
                  ? "bg-[#D4AF37] text-[#1A0F0A] shadow-lg shadow-[#D4AF37]/25 scale-105"
                  : "bg-white/5 text-[#E8DCC4] border border-white/10 hover:bg-white/10"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Pilotage Exécutif
            </button>
            <button
              onClick={() => setActiveTab("parrainage")}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "parrainage"
                  ? "bg-[#D4AF37] text-[#1A0F0A] shadow-lg shadow-[#D4AF37]/25 scale-105"
                  : "bg-white/5 text-[#E8DCC4] border border-white/10 hover:bg-white/10"
              }`}
            >
              <Gift className="w-4 h-4" />
              Programme Ambassadeurs
            </button>
            <button
              onClick={() => setActiveTab("nommo")}
              className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === "nommo"
                  ? "bg-[#D4AF37] text-[#1A0F0A] shadow-lg shadow-[#D4AF37]/25 scale-105"
                  : "bg-white/5 text-[#E8DCC4] border border-white/10 hover:bg-white/10"
              }`}
            >
              <Bot className="w-4 h-4" />
              Gardien Nommo IA
            </button>
          </div>
        </div>

        {/* Demo Content Container */}
        <div className="glass-card-luxury rounded-[40px] p-6 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[100px] pointer-events-none" />

          {activeTab === "dashboard" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase block mb-1">Aperçu en Direct • Filiales Rattachées</span>
                  <h3 className="text-2xl font-bold font-dogon text-white">Tableau de Bord Stratégique — NYA BLO</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Synchronisation Cloud Active
                  </span>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm" className="rounded-xl border-white/20 text-xs text-white">
                      Voir le Dashboard
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Simulated Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10">
                  <span className="text-xs text-[#B89E7E] uppercase tracking-wider font-semibold">Chiffre d&apos;Affaires Consigné</span>
                  <div className="text-2xl md:text-3xl font-bold font-dogon text-white mt-2">42 850 000 <span className="text-xs text-[#D4AF37]">FCFA</span></div>
                  <div className="mt-3 text-xs text-emerald-400 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" /> +18.4% vs mois précédent
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10">
                  <span className="text-xs text-[#B89E7E] uppercase tracking-wider font-semibold">Montant Total Encaissé</span>
                  <div className="text-2xl md:text-3xl font-bold font-dogon text-emerald-300 mt-2">38 565 000 <span className="text-xs text-[#D4AF37]">FCFA</span></div>
                  <div className="mt-3 text-xs text-[#E8DCC4]/70 font-semibold">
                    Reste à recouvrer : 4 285 000 FCFA
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10">
                  <span className="text-xs text-[#B89E7E] uppercase tracking-wider font-semibold">Efficacité Recouvrement</span>
                  <div className="text-2xl md:text-3xl font-bold font-dogon text-[#D4AF37] mt-2">90.0 %</div>
                  <div className="w-full bg-white/10 h-2 rounded-full mt-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-[#D4AF37] to-emerald-400 h-full rounded-full" style={{ width: "90%" }} />
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10">
                  <span className="text-xs text-[#B89E7E] uppercase tracking-wider font-semibold">Transactions Clôturées</span>
                  <div className="text-2xl md:text-3xl font-bold font-dogon text-white mt-2">142 <span className="text-xs text-[#B89E7E]">dossiers</span></div>
                  <div className="mt-3 text-xs text-cyan-400 font-semibold">
                    100% audités par signature de clé
                  </div>
                </div>
              </div>

              {/* Feed ticker */}
              <div className="p-6 rounded-3xl bg-black/30 border border-white/10">
                <div className="text-xs font-bold uppercase tracking-wider text-[#D4AF37] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-ping" />
                  Flux des Dernières Ventes Validées
                </div>
                <div className="space-y-2.5 text-xs text-white/80">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#A66037]/30 flex items-center justify-center font-bold text-[#D4AF37]">G</div>
                      <div>
                        <span className="font-bold text-white">Société Ivoirienne de BTP</span>
                        <span className="text-[#B89E7E] ml-2">• Formation CACES Chantiers (8 stagiaires)</span>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-400 font-mono">+1 850 000 FCFA</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#5C3D2E]/40 flex items-center justify-center font-bold text-[#D4AF37]">F</div>
                      <div>
                        <span className="font-bold text-white">Logistique Ouest Afrique</span>
                        <span className="text-[#B89E7E] ml-2">• Audit SST & Prévention Incendie</span>
                      </div>
                    </div>
                    <span className="font-bold text-emerald-400 font-mono">+950 000 FCFA</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "parrainage" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase block mb-1">Règle d&apos;Or : 5 Filleuls = 1 Formation Gratuite</span>
                  <h3 className="text-2xl font-bold font-dogon text-white">Le Programme Ambassadeurs GALF</h3>
                </div>
                <Link href="/parrainage/inscription">
                  <Button variant="gold" size="sm" className="rounded-xl text-xs font-bold uppercase tracking-wider">
                    Générer mon Code Parrain <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/15 flex items-center justify-center text-[#D4AF37] font-bold">01</div>
                  <h4 className="text-lg font-bold text-white font-dogon">Partagez votre Code</h4>
                  <p className="text-xs text-[#B89E7E] leading-relaxed">
                    Chaque ambassadeur dispose d&apos;un code exclusif à distribuer sur WhatsApp, réseaux ou auprès de ses contacts.
                  </p>
                </div>
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#A66037]/20 flex items-center justify-center text-[#A66037] font-bold">02</div>
                  <h4 className="text-lg font-bold text-white font-dogon">Validation des Dossiers</h4>
                  <p className="text-xs text-[#B89E7E] leading-relaxed">
                    Dès que votre contact confirme son inscription auprès du secrétariat GALF, votre compteur s&apos;incrémente automatiquement.
                  </p>
                </div>
                <div className="p-6 rounded-3xl bg-white/[0.04] border border-white/10 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold">03</div>
                  <h4 className="text-lg font-bold text-white font-dogon">Débloquez votre Bon</h4>
                  <p className="text-xs text-[#B89E7E] leading-relaxed">
                    À 5/5, recevez votre bon officiel pour une formation certifiante au choix (HSE, Conduite d&apos;engins, SST, Informatique).
                  </p>
                </div>
              </div>

              {/* Ambassador Card Mockup */}
              <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-[#2D1A12] to-[#5C3D2E] border border-[#D4AF37]/30 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
                <div>
                  <span className="text-[10px] font-bold text-[#D4AF37] tracking-widest uppercase">Badge Virtuel Ambassadeur</span>
                  <h4 className="text-xl font-bold font-dogon text-white mt-1">MAMADOU KONÉ • CODE: <span className="text-[#D4AF37] font-mono">MAMADOU26</span></h4>
                  <p className="text-xs text-[#E8DCC4]/70 mt-1">Formation cadeau choisie : Sécurité & Hygiène Industrielle (HSE)</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs font-bold text-white">4 / 5 Filleuls</span>
                    <span className="block text-[10px] text-emerald-400 font-bold">Plus qu&apos;un filleul pour la récompense !</span>
                  </div>
                  <Link href="/parrainage/check">
                    <Button variant="outline" size="sm" className="rounded-xl border-[#D4AF37]/40 text-[#D4AF37] text-xs">
                      Tester le Suivi
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {activeTab === "nommo" && (
            <div className="space-y-8 animate-fadeIn">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
                <div>
                  <span className="text-[10px] text-[#D4AF37] font-bold tracking-widest uppercase block mb-1">Intelligence d&apos;Affaires Vocale & Textuelle</span>
                  <h3 className="text-2xl font-bold font-dogon text-white">Nommo — L&apos;Esprit Gardien de vos Données</h3>
                </div>
                <span className="px-3.5 py-1.5 rounded-full bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold flex items-center gap-1.5">
                  <Bot className="w-3.5 h-3.5" /> Modèle Gemini 2.5 Pro Intégré
                </span>
              </div>

              <div className="max-w-3xl mx-auto space-y-4">
                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-[#5C3D2E] flex items-center justify-center font-bold text-[#D4AF37] shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Nommo IA • Synthèse Matinale</p>
                    <p className="text-sm text-white/90 leading-relaxed">
                      &ldquo;Salutations. Ce mois-ci, vos filiales ont atteint 90% de leur objectif de recouvrement. GALF Formation enregistre un record d&apos;inscriptions grâce aux 24 nouveaux filleuls ambassadeurs.&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-[#A66037]/20 border border-[#A66037]/30 ml-8">
                  <div className="w-10 h-10 rounded-xl bg-[#A66037] flex items-center justify-center font-bold text-white shrink-0">
                    DG
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#FAF3E0]/70 uppercase tracking-wider">Directeur Général</p>
                    <p className="text-sm text-white leading-relaxed">
                      &ldquo;Nommo, quels sont les impayés prioritaires à relancer aujourd&apos;hui ?&rdquo;
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.04] border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-[#5C3D2E] flex items-center justify-center font-bold text-[#D4AF37] shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">Nommo IA • Analyse Prédictive</p>
                    <p className="text-sm text-white/90 leading-relaxed">
                      &ldquo;Il reste 3 factures dépassant 30 jours pour un total de 1 200 000 FCFA. Un SMS de relance automatique avec le relevé bancaire a été préparé pour votre validation.&rdquo;
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Cosmology & Vision Section */}
      <section id="vision" className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-24 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
         <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#A66037]/15 border border-[#A66037]/30 text-[#A66037] text-xs font-bold uppercase tracking-[0.25em]">
               Architecture Conceptuelle
            </div>
            <h2 className="text-4xl md:text-5xl font-bold font-dogon text-white leading-tight">
               L&apos;Harmonie et le Grand Alignement Commercial.
            </h2>
            <p className="text-[#E8DCC4]/90 text-base md:text-lg leading-relaxed">
               Pour les bâtisseurs Dogons, chaque semence jetée en terre doit obéir à des cycles d&apos;équilibre céleste et terrestre. C&apos;est cette même rigueur que nous insufflons dans votre gestion. Chaque vente saisie, chaque créance recouvrée remplit durablement les greniers de votre entreprise.
            </p>
            <div className="border-l-4 border-[#D4AF37] pl-6 py-2 italic text-white/90 text-sm md:text-base font-medium bg-white/[0.02] rounded-r-2xl">
               &ldquo;La parole du commerce est comme le grain : si elle n&apos;est pas scellée dans le grenier de la rigueur, elle s&apos;envole au premier vent.&rdquo;
            </div>
         </div>
         <div className="relative p-1 bg-gradient-to-br from-white/10 to-white/5 border border-white/15 rounded-[44px] overflow-hidden aspect-video flex items-center justify-center shadow-2xl">
            <div className="absolute inset-0 dogon-pattern opacity-10" />
            <div className="relative text-center p-8 space-y-6">
               <div className="w-24 h-24 bg-[#D4AF37]/15 rounded-3xl flex items-center justify-center mx-auto border border-[#D4AF37]/30 shadow-lg shadow-[#D4AF37]/10">
                  <ShieldCheck className="w-12 h-12 text-[#D4AF37] animate-pulse" />
               </div>
               <div className="space-y-2">
                  <h4 className="text-xl font-bold font-dogon text-white">Chambre de Traçabilité & Scellement</h4>
                  <p className="text-xs md:text-sm text-[#B89E7E] max-w-sm mx-auto">
                    Toutes les actions financières sont consignées et scellées par des signatures cryptographiques inviolables.
                  </p>
               </div>
            </div>
         </div>
      </section>

      {/* Interactive Referral Simulator */}
      <section id="simulateur" className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 py-24">
        <div className="p-8 md:p-14 rounded-[44px] bg-gradient-to-br from-[#2A1810] via-[#1E100A] to-[#150C07] border border-[#D4AF37]/25 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-80 h-80 bg-[#D4AF37]/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] mb-4">
              <Gift className="w-3.5 h-3.5" /> Simulateur de Gain Ambassadeur
            </div>
            <h3 className="text-3xl md:text-4xl font-bold font-dogon text-white">
              Calculez Vos Formations Offertes
            </h3>
            <p className="text-sm text-[#B89E7E] max-w-lg mx-auto mt-2">
              Faites glisser le curseur pour voir combien de formations certifiantes GALF vous pouvez débloquer en recommandant vos collègues et amis.
            </p>
          </div>

          {/* Interactive Range Slider */}
          <div className="max-w-xl mx-auto space-y-6">
            <div className="flex items-center justify-between text-sm font-bold text-white">
              <span>Nombre de Filleuls Inscrits :</span>
              <span className="text-3xl font-dogon text-[#D4AF37] bg-white/5 px-5 py-2 rounded-2xl border border-white/10">
                {referralCount}
              </span>
            </div>

            <input 
              type="range" 
              min={1} 
              max={25} 
              value={referralCount}
              onChange={(e) => setReferralCount(Number(e.target.value))}
              className="w-full h-3 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
            />

            <div className="flex justify-between text-[11px] font-bold text-[#B89E7E] uppercase tracking-wider">
              <span>1 Filleul</span>
              <span>5 (1ère formation)</span>
              <span>15 (3 formations)</span>
              <span>25 Filleuls</span>
            </div>

            {/* Results Display Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
              <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-[#B89E7E] tracking-wider block mb-1">Formations Gratuites</span>
                <span className="text-4xl font-bold font-dogon text-emerald-400">{freeFormationsCount}</span>
                <span className="text-[10px] text-white/60 block mt-1">100% prises en charge</span>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-[#B89E7E] tracking-wider block mb-1">Statut Ambassadeur</span>
                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mt-2 ${rank.badge}`}>
                  {rank.title}
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-white/[0.04] border border-white/10 text-center">
                <span className="text-[10px] uppercase font-bold text-[#B89E7E] tracking-wider block mb-1">Prochain Palier</span>
                <span className="text-3xl font-bold font-dogon text-[#D4AF37]">{remainingForNext}</span>
                <span className="text-[10px] text-white/60 block mt-1">filleul(s) restant(s)</span>
              </div>
            </div>

            <div className="pt-4 text-center">
              <Link href="/parrainage/inscription">
                <Button variant="gold" size="lg" className="rounded-2xl px-8 py-4 text-sm font-bold uppercase tracking-wider shadow-gold hover:scale-105 active:scale-95 transition-all">
                  Obtenir mon Code Ambassadeur Maintenant
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Modules */}
      <section id="modules" className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-20">
         <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] mb-4">
              <Layers className="w-3.5 h-3.5" /> Fonctionnalités Clés
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold font-dogon text-white">L&apos;Arsenal de Gestion Complet</h2>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FeatureCard 
              icon={Globe}
              title="Multi-Filiales"
              desc="Pilotez GALF, Flowers CI et toutes vos entreprises dans une interface cloisonnée et unifiée."
            />
            <FeatureCard 
              icon={Zap}
              title="Saisie Temps Réel"
              desc="Encaissements, factures et acomptes synchronisés instantanément du terrain au bureau."
            />
            <FeatureCard 
              icon={Lock}
              title="Sécurité Dogon"
              desc="Chiffrement des données, cloisonnement par rôle et journal d'audit infalsifiable."
            />
            <FeatureCard 
              icon={Gift}
              title="Ambassadeurs GALF"
              desc="Programme de parrainage intégré : 5 filleuls validés = 1 formation professionnelle offerte."
            />
         </div>
      </section>

      {/* Stats Counters Section */}
      <section className="relative z-10 py-20 border-y border-white/10 bg-[#2D1A12]/30 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-dogon text-white">L&apos;Écosystème en Chiffres</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <AnimatedCounter target={15} suffix="+" label="Entreprises Gérées" />
            <AnimatedCounter target={45} suffix="+" label="Agents & Superviseurs" />
            <AnimatedCounter target={2500} suffix="+" label="Transactions Clôturées" />
            <AnimatedCounter target={92} suffix="%" label="Taux Recouvrement" />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 md:px-10 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <Quote className="w-3.5 h-3.5" /> Témoignages Clients
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-dogon text-white">Ils Développent Leurs Entreprises avec Nous</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { 
              name: "Amadou Diallo", 
              role: "Directeur Général, GALF Formation", 
              quote: "NYA BLO a transformé notre rigueur financière. En un coup d'œil, nous voyons les encaissements journaliers de chaque promotion.",
              badge: "GALF CI"
            },
            { 
              name: "Fatou Koné", 
              role: "Superviseur Commercial, Flowers CI", 
              quote: "L'interface est d'une clarté exemplaire. Le programme ambassadeurs nous a permis de multiplier nos inscriptions de 40% en un trimestre.",
              badge: "Flowers CI"
            },
            { 
              name: "Ibrahim Traoré", 
              role: "Agent Commercial Terrain", 
              quote: "Je saisis mes ventes depuis mon smartphone directement sur le chantier. Plus de paperasse, plus d'oubli de créances.",
              badge: "Terrain Abidjan"
            },
          ].map((t, i) => (
            <div key={i} className="feature-card-anim p-8 rounded-[36px] bg-white/[0.04] border border-white/10 hover:border-[#D4AF37]/40 transition-all opacity-0 relative flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <Quote className="w-8 h-8 text-[#D4AF37]/40" />
                  <span className="text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white/5 text-[#D4AF37] border border-white/10">
                    {t.badge}
                  </span>
                </div>
                <p className="text-white/85 text-sm md:text-base leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
              </div>
              <div className="flex items-center gap-3.5 pt-4 border-t border-white/5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#A66037] to-[#5C3D2E] flex items-center justify-center font-bold text-white font-dogon">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t.name}</p>
                  <p className="text-[11px] text-[#B89E7E]">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold font-dogon text-white mb-3">Foire Aux Questions</h2>
          <p className="text-sm text-[#B89E7E]">Tout ce que vous souhaitez savoir sur NYA BLO et le parrainage GALF.</p>
        </div>

        <div className="space-y-4">
          {faqItems.map((item, idx) => (
            <div 
              key={idx}
              className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.03] transition-colors"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-5 text-left font-bold text-white text-sm md:text-base cursor-pointer hover:bg-white/5 transition-colors"
              >
                <span>{item.q}</span>
                {openFaq === idx ? (
                  <ChevronUp className="w-5 h-5 text-[#D4AF37] shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#B89E7E] shrink-0 ml-4" />
                )}
              </button>
              {openFaq === idx && (
                <div className="p-5 pt-0 text-xs md:text-sm text-[#E8DCC4]/80 leading-relaxed border-t border-white/5">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="relative z-10 max-w-5xl mx-auto px-6 md:px-10 py-16">
        <div className="p-10 md:p-14 rounded-[44px] bg-gradient-to-br from-[#5C3D2E]/60 via-[#A66037]/30 to-[#1A0F0A] border border-[#D4AF37]/30 backdrop-blur-xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="flex-1 text-center md:text-left">
            <div className="w-14 h-14 bg-[#D4AF37]/20 rounded-2xl flex items-center justify-center mb-5 border border-[#D4AF37]/30 mx-auto md:mx-0">
              <Gift className="w-7 h-7 text-[#D4AF37]" />
            </div>
            <h3 className="text-2xl md:text-4xl font-bold font-dogon text-white mb-3">Rejoignez l&apos;Aventure Dogon</h3>
            <p className="text-sm md:text-base text-[#E8DCC4]/80 leading-relaxed max-w-md">
              Que vous soyez gestionnaire d&apos;entreprise ou futur ambassadeur GALF, faites l&apos;expérience d&apos;un écosystème commercial d&apos;exception.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3.5 shrink-0 w-full sm:w-auto">
            <Link href="/parrainage/inscription" className="w-full sm:w-auto">
              <Button variant="gold" size="lg" className="w-full sm:w-auto rounded-2xl px-8 py-4 text-sm font-bold shadow-gold">
                Devenir Ambassadeur
              </Button>
            </Link>
            <Link href="/login" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-2xl px-8 py-4 text-sm font-bold border-white/20 text-white hover:bg-white/10">
                Espace Pro
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-12 px-6 md:px-10 bg-[#150C07]/80">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2.5 mb-2">
                <div className="w-7 h-7 bg-[#D4AF37] rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 text-[#1A0F0A]" />
                </div>
                <span className="font-bold font-dogon text-white uppercase tracking-wider">NYA BLO SARL</span>
              </div>
              <p className="text-[#B89E7E] text-xs">© {new Date().getFullYear()} NYA BLO SARL. Architecture Commerciale & Intelligence Opérationnelle.</p>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-xs font-bold text-white/50 uppercase tracking-widest">
               <Link href="/parrainage" className="hover:text-[#D4AF37] transition-colors">Parrainage</Link>
               <Link href="/parrainage/check" className="hover:text-[#D4AF37] transition-colors">Suivi Direct</Link>
               <Link href="/parrainage/portal" className="hover:text-[#D4AF37] transition-colors">Portail</Link>
               <Link href="/login" className="hover:text-[#D4AF37] transition-colors">Espace Pro</Link>
            </div>

            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-[#B89E7E]/70">
               <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5">Abidjan</span>
               <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5">Bamako</span>
               <span className="px-2.5 py-1 rounded-full bg-white/5 border border-white/5">Dakar</span>
            </div>
         </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: any; title: string; desc: string }) {
  return (
    <div className="feature-card-anim group p-8 rounded-[36px] bg-white/[0.04] border border-white/10 hover:border-[#D4AF37]/40 transition-all opacity-0 flex flex-col justify-between hover:bg-white/[0.07]">
       <div>
         <div className="w-14 h-14 bg-gradient-to-br from-[#A66037]/20 to-[#D4AF37]/20 rounded-2xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
            <Icon className="w-7 h-7" />
         </div>
         <h3 className="text-xl font-bold text-white font-dogon mb-3">{title}</h3>
         <p className="text-[#B89E7E] leading-relaxed text-xs md:text-sm">{desc}</p>
       </div>
    </div>
  );
}

function AnimatedCounter({ target, suffix, label }: { target: number; suffix: string; label: string }) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const duration = 1800;
          const startTime = performance.now();
          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, hasAnimated]);

  return (
    <div ref={ref}>
      <div className="text-3xl md:text-5xl font-bold font-dogon text-[#D4AF37] mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-[#B89E7E] font-bold uppercase tracking-widest">{label}</div>
    </div>
  );
}
