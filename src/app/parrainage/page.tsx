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
  Star
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const FORMATIONS = [
  { name: "Sécurité & HSE", desc: "Hygiène, Sécurité et Environnement en milieu professionnel", icon: ShieldCheck },
  { name: "Conduite d'Engins", desc: "Permis CACES, conduite d'engins de chantier et manutention", icon: Star },
  { name: "Secourisme (SST)", desc: "Sauveteur Secouriste du Travail — Certification officielle", icon: Award },
  { name: "Informatique Pro", desc: "Bureautique, Excel avancé et outils de gestion modernes", icon: BookOpen },
];

const STEPS = [
  { num: "01", title: "Inscrivez-vous", desc: "Devenez ambassadeur GALF en remplissant le formulaire. Recevez votre code unique en 2 minutes." },
  { num: "02", title: "Parrainez", desc: "Partagez votre code avec vos contacts. Chaque personne qui s'inscrit avec votre code est comptabilisée." },
  { num: "03", title: "Gagnez", desc: "Dès 5 inscriptions validées, vous obtenez une formation GALF offerte de votre choix. Sans limite !" },
];

const FAQ_ITEMS = [
  { q: "Comment fonctionne le programme ?", a: "Inscrivez-vous comme ambassadeur, recevez un code unique, partagez-le. Pour chaque inscription validée via votre code, vous progressez vers votre formation gratuite." },
  { q: "Qu'est-ce qu'une inscription validée ?", a: "Une inscription est validée lorsque votre filleul a complété son dossier administratif et réglé ses frais de scolarité (paiement complet ou premier versement validé)." },
  { q: "Puis-je choisir ma formation ?", a: "Oui ! Toutes les formations standards GALF sont éligibles. Vous indiquez votre préférence lors de votre inscription, modifiable jusqu'à la validation." },
  { q: "Y a-t-il une limite de parrainages ?", a: "Non ! Chaque tranche de 5 filleuls validés vous donne droit à une formation supplémentaire. Plus vous parrainez, plus vous gagnez." },
  { q: "Comment suivre ma progression ?", a: "Utilisez notre outil de suivi en ligne avec votre numéro de téléphone, ou accédez à votre espace personnel dédié." },
];

export default function ParrainageLandingPage() {
  const container = useRef<HTMLDivElement>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    
    tl.from(".parr-hero-badge", { scale: 0.8, opacity: 0, duration: 1 });
    tl.from(".parr-hero-title", { y: 60, opacity: 0, duration: 1.2 }, "-=0.8");
    tl.from(".parr-hero-desc", { y: 30, opacity: 0, duration: 1 }, "-=0.9");
    tl.from(".parr-cta-card", { y: 40, opacity: 0, stagger: 0.15, duration: 0.8 }, "-=0.6");

    // Floating shapes
    gsap.to(".parr-float", {
      y: "random(-20, 20)",
      x: "random(-15, 15)",
      duration: "random(3, 5)",
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
  }, { scope: container });

  return (
    <div ref={container} className="min-h-screen bg-[#1A0F0A] text-[#F7EAE3] selection:bg-[#D4AF37]/30 overflow-x-hidden font-outfit">
      
      {/* Background */}
      <div className="fixed inset-0 z-0">
        <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-[#A66037]/15 rounded-full blur-[140px] parr-float" />
        <div className="absolute bottom-[-10%] right-[-15%] w-[45%] h-[45%] bg-[#5C3D2E]/15 rounded-full blur-[140px] parr-float" />
        <div className="dogon-pattern absolute inset-0 opacity-[0.04]" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 md:px-8 py-5 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/20 group-hover:rotate-12 transition-transform">
            <ShieldCheck className="w-6 h-6 text-[#1A0F0A]" />
          </div>
          <span className="text-lg font-bold font-dogon tracking-widest text-white uppercase">GALF</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/parrainage/check" className="hidden md:flex items-center gap-2 text-sm font-bold text-[#B89E7E] hover:text-[#D4AF37] transition-colors">
            <Search className="w-4 h-4" /> Suivi
          </Link>
          <Link href="/parrainage/portal" className="hidden md:flex items-center gap-2 text-sm font-bold text-[#B89E7E] hover:text-[#D4AF37] transition-colors">
            <LogIn className="w-4 h-4" /> Espace Pro
          </Link>
          <Link href="/parrainage/inscription" className="px-5 py-2.5 bg-[#D4AF37] text-[#1A0F0A] rounded-xl text-sm font-bold shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all hover:scale-105 active:scale-95">
            Devenir Ambassadeur
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 pt-16 pb-24 text-center">
        <div className="parr-hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.3em] mb-8">
          <Sparkles className="w-3 h-3" /> Programme de Parrainage GALF Formation
        </div>

        <h1 className="parr-hero-title text-5xl md:text-8xl font-bold text-white font-dogon leading-[0.95] mb-8">
          PARRAINEZ.<br />
          <span className="text-[#A66037]">GAGNEZ.</span><br />
          <span className="text-[#D4AF37]">FORMEZ-VOUS.</span>
        </h1>

        <p className="parr-hero-desc text-lg md:text-xl text-[#B89E7E] max-w-2xl mx-auto leading-relaxed mb-16">
          Recommandez GALF Formation à vos proches. À chaque 5 inscriptions validées, 
          recevez une formation professionnelle complète — <span className="text-[#D4AF37] font-bold">100% offerte</span>.
        </p>

        {/* 3 CTA Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Link href="/parrainage/inscription" className="parr-cta-card group">
            <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 transition-all hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.98]">
              <div className="w-14 h-14 bg-[#D4AF37]/15 rounded-2xl flex items-center justify-center text-[#D4AF37] mb-6 group-hover:scale-110 transition-transform">
                <UserPlus className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white font-dogon mb-2">Devenir Ambassadeur</h3>
              <p className="text-sm text-[#B89E7E] leading-relaxed">Inscrivez-vous et obtenez votre code de parrainage unique en 2 minutes.</p>
              <div className="flex items-center gap-2 text-[#D4AF37] text-sm font-bold mt-4 group-hover:gap-3 transition-all">
                S&apos;inscrire <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/parrainage/check" className="parr-cta-card group">
            <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-[#A66037]/40 transition-all hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.98]">
              <div className="w-14 h-14 bg-[#A66037]/15 rounded-2xl flex items-center justify-center text-[#A66037] mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white font-dogon mb-2">Suivi Rapide</h3>
              <p className="text-sm text-[#B89E7E] leading-relaxed">Consultez votre progression et le détail de vos filleuls en temps réel.</p>
              <div className="flex items-center gap-2 text-[#A66037] text-sm font-bold mt-4 group-hover:gap-3 transition-all">
                Vérifier <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>

          <Link href="/parrainage/portal" className="parr-cta-card group">
            <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 hover:border-emerald-500/40 transition-all hover:bg-white/[0.08] hover:scale-[1.02] active:scale-[0.98]">
              <div className="w-14 h-14 bg-emerald-500/15 rounded-2xl flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-110 transition-transform">
                <LogIn className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-white font-dogon mb-2">Espace Personnel</h3>
              <p className="text-sm text-[#B89E7E] leading-relaxed">Accédez à votre tableau de bord complet, vos récompenses et QR codes.</p>
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-bold mt-4 group-hover:gap-3 transition-all">
                Connexion <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#A66037]/10 border border-[#A66037]/20 text-[#A66037] text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
            Comment ça marche
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-dogon text-white">3 étapes vers votre formation gratuite</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection lines */}
          <div className="hidden md:block absolute top-20 left-[33%] w-[34%] h-px bg-gradient-to-r from-[#D4AF37]/40 to-[#A66037]/40" />
          <div className="hidden md:block absolute top-20 right-[33%] w-[34%] h-px bg-gradient-to-r from-[#A66037]/40 to-emerald-500/40" />

          {STEPS.map((step, i) => (
            <div key={i} className="text-center group">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#D4AF37]/20 to-[#A66037]/20 border border-[#D4AF37]/20 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                <span className="text-2xl font-bold font-dogon text-[#D4AF37]">{step.num}</span>
              </div>
              <h3 className="text-2xl font-bold text-white font-dogon mb-3">{step.title}</h3>
              <p className="text-[#B89E7E] leading-relaxed text-sm max-w-xs mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Formations Catalogue */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 md:px-8 py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-[0.3em] mb-6">
            <Gift className="w-3 h-3" /> Formations Éligibles
          </div>
          <h2 className="text-4xl md:text-5xl font-bold font-dogon text-white mb-4">Choisissez votre récompense</h2>
          <p className="text-[#B89E7E] max-w-lg mx-auto">Toutes nos formations standards sont disponibles. Voici les plus populaires :</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FORMATIONS.map((f, i) => (
            <div key={i} className="p-6 rounded-[28px] bg-white/5 border border-white/10 hover:border-emerald-500/30 transition-all group hover:bg-white/[0.07]">
              <div className="w-12 h-12 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-bold text-white font-dogon mb-2">{f.name}</h4>
              <p className="text-xs text-[#B89E7E] leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats / Social Proof */}
      <section className="relative z-10 py-20 border-y border-white/5 bg-[#2D1A12]/30 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "200+", label: "Ambassadeurs Actifs" },
            { value: "1 200+", label: "Filleuls Inscrits" },
            { value: "80+", label: "Formations Offertes" },
            { value: "98%", label: "Satisfaction" },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-3xl md:text-4xl font-bold font-dogon text-[#D4AF37] mb-2">{s.value}</div>
              <div className="text-xs text-[#B89E7E] font-bold uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 md:px-8 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold font-dogon text-white mb-4">Questions Fréquentes</h2>
          <p className="text-[#B89E7E]">Tout ce que vous devez savoir sur le programme.</p>
        </div>

        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="rounded-2xl border border-white/10 overflow-hidden transition-all bg-white/[0.03] hover:bg-white/[0.05]">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left cursor-pointer"
              >
                <span className="text-sm font-bold text-white pr-4">{item.q}</span>
                {openFaq === i ? (
                  <ChevronUp className="w-5 h-5 text-[#D4AF37] shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#B89E7E] shrink-0" />
                )}
              </button>
              {openFaq === i && (
                <div className="px-5 pb-5">
                  <p className="text-sm text-[#B89E7E] leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 md:px-8 py-20 text-center">
        <div className="p-12 md:p-16 rounded-[40px] bg-gradient-to-br from-[#5C3D2E]/40 to-[#A66037]/20 border border-white/10 backdrop-blur-sm">
          <div className="w-16 h-16 bg-[#D4AF37]/15 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-[#D4AF37]/20">
            <Gift className="w-8 h-8 text-[#D4AF37]" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold font-dogon text-white mb-4">Prêt à commencer ?</h2>
          <p className="text-[#B89E7E] mb-8 max-w-lg mx-auto">Rejoignez le programme de parrainage GALF et transformez votre réseau en opportunité de formation.</p>
          <Link href="/parrainage/inscription" className="inline-flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-[#1A0F0A] rounded-2xl text-lg font-bold shadow-lg shadow-[#D4AF37]/20 hover:shadow-[#D4AF37]/40 transition-all hover:scale-105 active:scale-95">
            Devenir Ambassadeur Maintenant <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/5 py-10 px-6 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#D4AF37] rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#1A0F0A]" />
            </div>
            <span className="text-sm font-bold text-white/60">GALF Formation — Programme de Parrainage</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-[#B89E7E]">
            <Link href="/parrainage/inscription" className="hover:text-[#D4AF37] transition-colors">Inscription</Link>
            <Link href="/parrainage/check" className="hover:text-[#D4AF37] transition-colors">Suivi</Link>
            <Link href="/parrainage/portal" className="hover:text-[#D4AF37] transition-colors">Espace Pro</Link>
            <Link href="/" className="hover:text-[#D4AF37] transition-colors">NYA BLO</Link>
          </div>
          <p className="text-[#B89E7E] text-xs italic">© {new Date().getFullYear()} GALF Formation. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
