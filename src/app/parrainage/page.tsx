"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { 
  Gift, 
  UserPlus, 
  Search, 
  LogIn, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck,
  BookOpen,
  Users,
  Award,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Star,
  Menu,
  X,
  Zap
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const FORMATIONS = [
  { name: "Sécurité & HSE", desc: "Hygiène, Sécurité et Environnement en milieu professionnel & industriel", icon: ShieldCheck, tag: "N°1 Populaire" },
  { name: "Conduite d'Engins (CACES)", desc: "Permis CACES, conduite d'engins de chantier et manutention", icon: Star, tag: "Forte Demande" },
  { name: "Secourisme (SST)", desc: "Sauveteur Secouriste du Travail — Certification officielle d'État", icon: Award, tag: "Certifiant" },
  { name: "Informatique & Excel Pro", desc: "Bureautique avancée, tableaux de bord et gestion commerciale", icon: BookOpen, tag: "Essentiel" },
];

const STEPS = [
  { num: "01", title: "Inscrivez-vous Gratuitement", desc: "Devenez ambassadeur GALF en renseignant votre profil. Recevez votre code unique et votre lien à partager en 2 minutes." },
  { num: "02", title: "Partagez sur WhatsApp", desc: "Diffusez votre code auprès de votre réseau. Chaque inscription confirmée et réglée est comptabilisée en direct." },
  { num: "03", title: "Recevez Votre Formation", desc: "Dès 5 inscriptions validées, vous obtenez une formation certifiante GALF 100% offerte au choix. Sans aucun plafond !" },
];

const FAQ_ITEMS = [
  { q: "Comment fonctionne le programme de parrainage ?", a: "Inscrivez-vous comme ambassadeur, recevez un code unique, partagez-le. Pour chaque 5 filleuls validés ayant réglé leur scolarité, vous débloquez automatiquement une formation complète offerte." },
  { q: "Qu'est-ce qu'une inscription validée ?", a: "Une inscription est validée lorsque votre filleul a complété son dossier administratif et effectué son premier versement ou règlement complet auprès de notre secrétariat." },
  { q: "Puis-je choisir n'importe quelle formation ?", a: "Oui ! Toutes les formations standards GALF sont éligibles (HSE, CACES, SST, Informatique, etc.). Vous pouvez changer votre choix jusqu'au jour de la remise du bon." },
  { q: "Y a-t-il une limite au nombre de formations gratuites ?", a: "Absolument aucune ! 5 filleuls = 1 formation, 10 filleuls = 2 formations, 15 filleuls = 3 formations. Plus vous parrainez, plus vous cumulez." },
  { q: "Comment suivre ma progression en temps réel ?", a: "Utilisez notre outil de Suivi Rapide en ligne avec votre code parrain ou votre numéro de mobile, accessible sans mot de passe." },
];

export default function ParrainageLandingPage() {
  const container = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    
    tl.from(".parr-hero-badge", { scale: 0.8, opacity: 0, duration: 1 });
    tl.from(".parr-hero-title", { y: 60, opacity: 0, duration: 1.1 }, "-=0.7");
    tl.from(".parr-hero-desc", { y: 30, opacity: 0, duration: 0.9 }, "-=0.8");
    tl.from(".parr-cta-card", { y: 40, opacity: 0, stagger: 0.12, duration: 0.8 }, "-=0.6");

    gsap.to(".parr-float", {
      y: "random(-20, 20)",
      x: "random(-15, 15)",
      duration: "random(4, 7)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }, { scope: container });

  return (
    <div ref={container} className="min-h-screen bg-[#1A0F0A] text-[#F7EAE3] selection:bg-[#D4AF37]/30 overflow-x-hidden font-outfit relative">
      
      {/* Background Glowing Orbs */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-[#A66037]/15 rounded-full blur-[140px] parr-float" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[50%] h-[50%] bg-[#5C3D2E]/20 rounded-full blur-[140px] parr-float" />
        <div className="dogon-pattern absolute inset-0 opacity-[0.05]" />
      </div>

      {/* Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#1A0F0A]/85 border-b border-white/10">
        <nav className="flex items-center justify-between px-6 md:px-10 py-4 max-w-7xl mx-auto">
          <Link href="/" className="flex items-center gap-3.5 group">
            <div className="w-11 h-11 bg-gradient-to-br from-[#D4AF37] to-[#A66037] rounded-2xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 group-hover:rotate-12 transition-transform">
              <ShieldCheck className="w-6 h-6 text-[#1A0F0A]" />
            </div>
            <div>
              <span className="text-lg font-bold font-dogon tracking-widest text-white uppercase block leading-none">GALF</span>
              <span className="text-[9px] text-[#D4AF37] font-bold tracking-[0.25em] uppercase">Formation</span>
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link href="/parrainage/check" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B89E7E] hover:text-[#D4AF37] transition-colors py-2 px-3 rounded-xl hover:bg-white/5">
              <Search className="w-4 h-4" /> Suivi Rapide
            </Link>
            <Link href="/parrainage/portal" className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#B89E7E] hover:text-[#D4AF37] transition-colors py-2 px-3 rounded-xl hover:bg-white/5">
              <LogIn className="w-4 h-4" /> Espace Ambassadeur
            </Link>
            <Link href="/parrainage/inscription" className="px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#A66037] text-[#1A0F0A] rounded-xl text-xs font-bold uppercase tracking-wider shadow-lg shadow-[#D4AF37]/20 hover:scale-105 active:scale-95 transition-all">
              Devenir Ambassadeur
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-white"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6 text-[#D4AF37]" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-[#1A0F0A]/95 backdrop-blur-2xl px-6 py-6 space-y-4 animate-fadeIn">
            <Link 
              href="/parrainage/check"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-sm font-bold uppercase"
            >
              <span>Suivi en Direct</span>
              <Search className="w-4 h-4 text-[#D4AF37]" />
            </Link>
            <Link 
              href="/parrainage/portal"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 text-sm font-bold uppercase"
            >
              <span>Espace Personnel Porté</span>
              <LogIn className="w-4 h-4 text-emerald-400" />
            </Link>
            <Link 
              href="/parrainage/inscription"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block p-3 rounded-xl bg-[#D4AF37] text-[#1A0F0A] text-sm font-bold uppercase text-center"
            >
              Devenir Ambassadeur
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 pt-16 pb-24 text-center">
        <div className="parr-hero-badge inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-[#D4AF37]/30 text-[#D4AF37] text-xs font-bold uppercase tracking-[0.25em] mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping inline-block" />
          <Sparkles className="w-3.5 h-3.5" /> Programme Ambassadeurs GALF 2026
        </div>

        <h1 className="parr-hero-title text-5xl sm:text-7xl md:text-8xl font-bold text-white font-dogon leading-[0.95] mb-8">
          PARRAINEZ.<br />
          <span className="earth-gradient-text">GAGNEZ.</span><br />
          <span className="gold-gradient-text">FORMEZ-VOUS.</span>
        </h1>

        <p className="parr-hero-desc text-base sm:text-xl text-[#E8DCC4]/90 max-w-2xl mx-auto leading-relaxed mb-16">
          Recommandez GALF Formation à vos proches et collègues. À chaque tranche de 5 inscriptions validées, 
          recevez une formation certifiante complète — <span className="text-[#D4AF37] font-bold">100% offerte</span>.
        </p>

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link href="/parrainage/inscription" className="parr-cta-card group">
            <div className="glass-card-luxury p-8 rounded-[36px] border border-[#D4AF37]/30 hover:border-[#D4AF37] transition-all text-left flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 bg-gradient-to-br from-[#D4AF37]/20 to-[#A66037]/20 rounded-2xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
                  <UserPlus className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white font-dogon mb-2">Devenir Ambassadeur</h3>
                <p className="text-xs sm:text-sm text-[#B89E7E] leading-relaxed">
                  Inscrivez-vous en 2 minutes et obtenez instantanément votre code et votre lien WhatsApp unique.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[#D4AF37] text-xs font-bold uppercase tracking-wider mt-6 group-hover:gap-3 transition-all">
                S&apos;inscrire <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/parrainage/check" className="parr-cta-card group">
            <div className="glass-card-luxury p-8 rounded-[36px] border border-white/10 hover:border-[#A66037] transition-all text-left flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 bg-[#A66037]/20 rounded-2xl flex items-center justify-center text-[#A66037] mb-6 group-hover:scale-110 transition-transform">
                  <Search className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white font-dogon mb-2">Suivi Direct</h3>
                <p className="text-xs sm:text-sm text-[#B89E7E] leading-relaxed">
                  Consultez votre jauge de 5 filleuls, vos points commissions et l&apos;état des règlements en direct.
                </p>
              </div>
              <div className="flex items-center gap-2 text-[#A66037] text-xs font-bold uppercase tracking-wider mt-6 group-hover:gap-3 transition-all">
                Vérifier mes gains <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/parrainage/portal" className="parr-cta-card group">
            <div className="glass-card-luxury p-8 rounded-[36px] border border-white/10 hover:border-emerald-500 transition-all text-left flex flex-col justify-between h-full">
              <div>
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                  <LogIn className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-white font-dogon mb-2">Espace Personnel</h3>
                <p className="text-xs sm:text-sm text-[#B89E7E] leading-relaxed">
                  Accédez à votre espace sécurisé, visualisez vos bons officiels et téléchargez vos QR codes.
                </p>
              </div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mt-6 group-hover:gap-3 transition-all">
                Accéder au portail <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#A66037]/15 border border-[#A66037]/30 text-[#A66037] text-xs font-bold uppercase tracking-[0.25em] mb-4">
            Fonctionnement Transparent
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-dogon text-white">3 étapes vers votre formation offerte</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          <div className="hidden md:block absolute top-20 left-[33%] w-[34%] h-px bg-gradient-to-r from-[#D4AF37]/40 to-[#A66037]/40" />
          <div className="hidden md:block absolute top-20 right-[33%] w-[34%] h-px bg-gradient-to-r from-[#A66037]/40 to-emerald-500/40" />

          {STEPS.map((step, i) => (
            <div key={i} className="glass-card-luxury p-8 rounded-[36px] text-center group flex flex-col justify-between">
              <div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#A66037]/20 border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                  <span className="text-2xl font-bold font-dogon text-[#D4AF37]">{step.num}</span>
                </div>
                <h3 className="text-xl font-bold text-white font-dogon mb-3">{step.title}</h3>
                <p className="text-xs sm:text-sm text-[#B89E7E] leading-relaxed max-w-xs mx-auto">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Formations Catalogue */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-10 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-[0.25em] mb-4">
            <Gift className="w-3.5 h-3.5" /> Formations Éligibles
          </div>
          <h2 className="text-3xl sm:text-5xl font-bold font-dogon text-white mb-4">Choisissez votre récompense</h2>
          <p className="text-xs sm:text-sm text-[#B89E7E] max-w-lg mx-auto">Toutes nos formations standards sont disponibles. Voici les plus demandées par les entreprises :</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FORMATIONS.map((f, i) => (
            <div key={i} className="glass-card-luxury p-6 rounded-[32px] border border-white/10 hover:border-emerald-500/40 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                    <f.icon className="w-6 h-6" />
                  </div>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-emerald-400">
                    {f.tag}
                  </span>
                </div>
                <h4 className="text-lg font-bold text-white font-dogon mb-2">{f.name}</h4>
                <p className="text-xs text-[#B89E7E] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Counter */}
      <section className="relative z-10 py-20 border-y border-white/10 bg-[#2D1A12]/30 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "240+", label: "Ambassadeurs Actifs" },
            { value: "1 450+", label: "Filleuls Inscrits" },
            { value: "115+", label: "Formations Débloquées" },
            { value: "99%", label: "Satisfaction Diplômés" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl md:text-5xl font-bold font-dogon text-[#D4AF37] mb-2">{s.value}</div>
              <div className="text-xs text-[#B89E7E] font-bold uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 md:px-10 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold font-dogon text-white mb-3">Questions Fréquentes</h2>
          <p className="text-sm text-[#B89E7E]">Tout ce que vous devez savoir sur le programme ambassadeurs.</p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.03] transition-all">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer hover:bg-white/5 transition-colors"
              >
                <span className="text-sm font-bold text-white pr-4">{item.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-5 h-5 text-[#D4AF37] shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#B89E7E] shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-[#E8DCC4]/80 leading-relaxed border-t border-white/5 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-10 py-20 text-center">
        <div className="p-10 md:p-16 rounded-[44px] bg-gradient-to-br from-[#5C3D2E]/50 via-[#A66037]/25 to-[#1A0F0A] border border-[#D4AF37]/30 backdrop-blur-xl shadow-2xl">
          <div className="w-16 h-16 bg-[#D4AF37]/15 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#D4AF37]/30">
            <Gift className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold font-dogon text-white mb-4">Prêt à Récolter Vos Formations ?</h2>
          <p className="text-sm md:text-base text-[#E8DCC4]/80 mb-8 max-w-lg mx-auto">
            Rejoignez dès maintenant le réseau officiel des ambassadeurs GALF et valorisez votre carnet d&apos;adresses.
          </p>
          <Link href="/parrainage/inscription" className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-[#D4AF37] to-[#A66037] text-[#1A0F0A] rounded-2xl text-sm md:text-base font-bold uppercase tracking-wider shadow-xl shadow-[#D4AF37]/20 hover:scale-105 active:scale-95 transition-all">
            Devenir Ambassadeur Maintenant <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 py-10 px-6 md:px-10 bg-[#150C07]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#1A0F0A]" />
            </div>
            <span className="text-xs font-bold text-white/70 uppercase tracking-wider">GALF Formation • Programme de Parrainage</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#B89E7E] font-bold uppercase tracking-wider">
            <Link href="/parrainage/inscription" className="hover:text-[#D4AF37] transition-colors">Inscription</Link>
            <Link href="/parrainage/check" className="hover:text-[#D4AF37] transition-colors">Suivi</Link>
            <Link href="/parrainage/portal" className="hover:text-[#D4AF37] transition-colors">Espace Pro</Link>
            <Link href="/" className="hover:text-[#D4AF37] transition-colors">NYA BLO</Link>
          </div>
          <p className="text-[#B89E7E] text-xs">© {new Date().getFullYear()} GALF Formation. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
