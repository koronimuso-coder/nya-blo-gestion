"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Search, 
  Award, 
  Copy, 
  Sparkles, 
  CheckCircle, 
  Loader2, 
  Phone, 
  User, 
  Calendar, 
  Gift, 
  ChevronRight, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  Share2, 
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  Check,
  CheckCircle2,
  Clock,
  Star
} from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

interface ReferralMember {
  id: string;
  nom: string;
  prenom: string;
  telephoneNormalise: string;
  email: string;
  formationSouhaitee: string;
  campagneId: string;
  codeId: string;
  status: string;
  createdAt: string;
  stats: {
    totalReferred: number;
    pendingCount: number;
    validatedCount: number;
    rewardCount: number;
  };
}

function ProgressCheckerContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [inputVal, setInputVal] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState<ReferralMember | null>(null);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqItems = [
    {
      q: "Comment suivre mes filleuls ?",
      a: "Saisissez votre code parrain unique (ex: MAMADOU26) ou le numéro de téléphone renseigné lors de votre inscription. Vos statistiques et la liste de vos filleuls s'afficheront en temps réel."
    },
    {
      q: "Combien de points rapporte un filleul ?",
      a: "Chaque inscription d'un filleul validée par le secrétariat GALF vous rapporte 100 points de commission. À 500 points (5 filleuls validés), vous débloquez immédiatement votre bon de formation gratuite !"
    },
    {
      q: "Combien de temps faut-il pour valider ma récompense ?",
      a: "Dès le 5ème filleul validé, notre équipe administrative valide votre bon officiel sous 24 à 48 heures ouvrées et prend contact avec vous pour fixer la date de session."
    },
    {
      q: "Puis-je changer de formation cadeau ?",
      a: "Oui ! Votre choix initial est indicatif. Vous pouvez choisir librement parmi toutes nos formations certifiantes (HSE, CACES, SST, Informatique, etc.) au moment de l'attribution."
    }
  ];

  const executeSearch = async (queryVal: string) => {
    if (!queryVal.trim()) return;

    setLoading(true);
    setSearched(true);
    setMember(null);
    setAttributions([]);

    try {
      const cleanVal = queryVal.trim();
      const response = await fetch(`/api/referral/check?q=${encodeURIComponent(cleanVal)}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Aucun compte ambassadeur trouvé.");
        return;
      }

      if (data.success && data.member) {
        setMember(data.member);
        setAttributions(data.attributions || []);
        toast.success(`Bienvenue, ${data.member.prenom} !`);
      } else {
        toast.error("Aucun compte ambassadeur trouvé.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      executeSearch(initialQuery);
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      toast.error("Veuillez renseigner un code parrain ou un numéro de téléphone.");
      return;
    }
    executeSearch(inputVal);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Lien de parrainage copié !");
    setTimeout(() => setCopied(false), 2500);
  };

  const shareViaWhatsApp = (code: string) => {
    const message = `Rejoins-moi chez GALF Formation ! Inscris-toi avec mon code parrain officiel : *${code}* ou directement sur https://galf.ci/inscription?ref=${code}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
  };

  const valCount = member?.stats?.validatedCount || 0;
  const progressPct = Math.min((valCount / 5) * 100, 100);
  const isRewardUnlocked = valCount >= 5;

  return (
    <div className="min-h-screen bg-[#1A0F0A] text-[#F7EAE3] selection:bg-[#D4AF37]/30 font-outfit flex flex-col justify-between relative overflow-x-hidden">
      <Toaster position="top-center" />

      {/* Atmospheric Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#A66037]/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#5C3D2E]/20 rounded-full blur-[140px]" />
        <div className="dogon-pattern absolute inset-0 opacity-[0.05]" />
      </div>

      {/* Header bar */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#1A0F0A]/85 border-b border-white/10 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link 
              href="/parrainage" 
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#E8DCC4] hover:text-[#D4AF37] hover:bg-white/10 transition-colors"
              title="Retour au parrainage"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-dogon tracking-widest text-white uppercase leading-none">GALF FORMATION</span>
                <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[9px] font-bold text-[#D4AF37] uppercase">Suivi Direct</span>
              </div>
              <p className="text-[10px] text-[#B89E7E] tracking-wider mt-0.5">Vérifiez vos points et vos filleuls en temps réel</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
            <Link href="/parrainage/inscription" className="text-[#B89E7E] hover:text-[#D4AF37] transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5">
              Nouvelle Inscription
            </Link>
            <Link href="/parrainage/portal" className="text-[#D4AF37] hover:underline transition-colors py-1.5 px-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              Espace Porté
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col justify-center">
        
        {!member ? (
          <div className="space-y-8">
            <div className="text-center space-y-3">
              <div className="w-16 h-16 bg-[#D4AF37]/15 border border-[#D4AF37]/30 rounded-3xl flex items-center justify-center mx-auto text-[#D4AF37] shadow-lg shadow-[#D4AF37]/10">
                <Award className="w-8 h-8 animate-pulse" />
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold font-dogon text-white tracking-tight">
                Suivez Votre Progression
              </h1>
              <p className="text-xs sm:text-sm text-[#B89E7E] max-w-md mx-auto leading-relaxed">
                Renseignez votre Code Parrain (ex: MAMADOU26) ou votre numéro de téléphone pour afficher vos récompenses.
              </p>
            </div>

            {/* Search Box Card */}
            <div className="glass-card-luxury p-6 sm:p-10 rounded-[36px] border border-[#D4AF37]/25 shadow-2xl space-y-6">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B89E7E]" />
                  <input 
                    type="text" 
                    placeholder="Ex: MAMADOU26 ou 0707070707..."
                    value={inputVal}
                    onChange={(e) => setInputVal(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/[0.04] border border-white/15 focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 text-sm font-semibold text-white placeholder:text-white/30 outline-none transition-all font-mono"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#A66037] text-[#1A0F0A] hover:brightness-110 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all shadow-xl shadow-[#D4AF37]/20 cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Recherche de votre dossier...
                    </>
                  ) : (
                    <>
                      Consulter Mes Points Ambassadeur <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl flex gap-3 text-xs text-[#E8DCC4]/90 items-start">
                <Info className="w-4 h-4 shrink-0 text-[#D4AF37] mt-0.5" />
                <p>
                  Pas encore inscrit ? <Link href="/parrainage/inscription" className="text-[#D4AF37] font-bold underline">Créez votre code en 2 minutes</Link> et commencez à parrainer dès aujourd&apos;hui.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* ============================================================
             MEMBER DETAILS & PROGRESSION STATE
             ============================================================ */
          <div className="space-y-6 animate-fadeIn">
            
            {/* Ambassador Header Card */}
            <div className="p-6 sm:p-8 rounded-[36px] bg-gradient-to-br from-[#2D1A12] via-[#5C3D2E] to-[#1A0F0A] border-2 border-[#D4AF37] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/15 rounded-full blur-[60px] pointer-events-none" />
              <div className="dogon-pattern absolute inset-0 opacity-15 pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#D4AF37] to-[#A66037] text-[#1A0F0A] font-bold flex items-center justify-center text-base shadow-md font-dogon">
                    {member.prenom.charAt(0)}{member.nom ? member.nom.charAt(0) : ""}
                  </div>
                  <div>
                    <span className="text-[10px] tracking-widest text-[#D4AF37] font-bold uppercase block">Ambassadeur Officiel</span>
                    <h2 className="text-xl sm:text-2xl font-bold font-dogon text-white mt-0.5">{member.prenom} {member.nom}</h2>
                    <p className="text-xs text-[#E8DCC4]/80 mt-0.5">Formation souhaitée : <span className="text-[#D4AF37] font-semibold">{member.formationSouhaitee}</span></p>
                  </div>
                </div>

                <button 
                  onClick={() => { setMember(null); setSearched(false); setInputVal(""); }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#E8DCC4] transition-colors cursor-pointer text-xs flex items-center gap-1"
                  title="Nouvelle recherche"
                >
                  <Search className="w-3.5 h-3.5" /> Autre code
                </button>
              </div>

              {/* Code Banner */}
              <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-[9px] text-[#B89E7E] font-bold uppercase tracking-[0.25em] block">
                    Votre Code Unique
                  </span>
                  <div className="text-3xl font-mono font-bold tracking-widest text-[#D4AF37] mt-0.5">
                    {member.codeId}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => copyToClipboard(`https://galf.ci/inscription?ref=${member.codeId}`)}
                    className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all border border-white/15"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-[#D4AF37]" />}
                    Copier
                  </button>
                  <button 
                    onClick={() => shareViaWhatsApp(member.codeId)}
                    className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Share2 className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Progression & Milestone Gauge */}
            <div className="glass-card-luxury p-6 sm:p-8 rounded-[36px] border border-white/10 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest block">Objectif Récompense</span>
                  <h3 className="text-xl font-bold font-dogon text-white">Jauge des 5 Filleuls Validés</h3>
                </div>
                {isRewardUnlocked ? (
                  <span className="px-3.5 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto animate-pulse">
                    <Sparkles className="w-3.5 h-3.5" /> Formation Débloquée !
                  </span>
                ) : (
                  <span className="px-3.5 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5 self-start sm:self-auto">
                    <Clock className="w-3.5 h-3.5" /> Plus que {5 - valCount} filleul(s) restant(s)
                  </span>
                )}
              </div>

              {/* Stats KPI Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-[#B89E7E] tracking-wider block mb-0.5">Total Filleuls</span>
                  <span className="text-xl font-bold font-dogon text-white">{member.stats?.totalReferred || 0}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-[#B89E7E] tracking-wider block mb-0.5">Validés (Payés)</span>
                  <span className="text-xl font-bold font-dogon text-emerald-400">{valCount}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-[#B89E7E] tracking-wider block mb-0.5">En Cours</span>
                  <span className="text-xl font-bold font-dogon text-amber-300">{member.stats?.pendingCount || 0}</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-[#B89E7E] tracking-wider block mb-0.5">Points Commission</span>
                  <span className="text-xl font-bold font-dogon text-[#D4AF37]">{valCount * 100} pts</span>
                </div>
              </div>

              {/* 5 Milestone Step Indicators */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-[#E8DCC4]">Avancement vers la formation gratuite</span>
                  <span className="text-[#D4AF37]">{valCount} / 5 ({Math.round(progressPct)}%)</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-3.5 bg-white/10 rounded-full overflow-hidden border border-white/10 p-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-[#D4AF37] via-[#A66037] to-emerald-400 rounded-full transition-all duration-700 shadow-lg"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* 5 Circles */}
                <div className="grid grid-cols-5 gap-2 pt-2">
                  {[1, 2, 3, 4, 5].map((step) => {
                    const isReached = valCount >= step;
                    return (
                      <div 
                        key={step}
                        className={`p-2.5 rounded-2xl border text-center transition-all ${
                          isReached
                            ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-950/20"
                            : "bg-white/[0.02] border-white/10 text-white/30"
                        }`}
                      >
                        <div className="flex items-center justify-center mb-1">
                          {isReached ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Star className="w-4 h-4 text-white/20" />
                          )}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider block">
                          {step === 5 ? "CADEAU !" : `Filleul ${step}`}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {isRewardUnlocked && (
                <div className="p-5 rounded-3xl bg-gradient-to-r from-emerald-900/40 to-[#2A1810] border-2 border-emerald-500/40 space-y-2 text-center">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto text-emerald-400">
                    <Gift className="w-6 h-6" />
                  </div>
                  <h4 className="text-lg font-bold font-dogon text-white">Félicitations ! Vous avez 5 filleuls validés</h4>
                  <p className="text-xs text-[#E8DCC4]/90 max-w-sm mx-auto">
                    Votre bon de formation gratuite est validé. Présentez votre code <span className="text-[#D4AF37] font-bold">{member.codeId}</span> à notre secrétariat GALF pour commencer vos cours.
                  </p>
                </div>
              )}
            </div>

            {/* List of Referred Candidates */}
            <div className="glass-card-luxury p-6 sm:p-8 rounded-[36px] border border-white/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-base font-dogon text-white">Détail de vos Filleuls</h4>
                  <p className="text-xs text-[#B89E7E]">Liste des candidats enregistrés avec votre code.</p>
                </div>
                <span className="text-xs font-bold text-[#D4AF37] px-3 py-1 rounded-full bg-white/5 border border-white/10">
                  {attributions.length} enregistrement(s)
                </span>
              </div>

              {attributions.length === 0 ? (
                <div className="py-10 text-center text-[#B89E7E] text-xs italic space-y-2">
                  <User className="w-8 h-8 mx-auto opacity-30" />
                  <p>Aucun filleul n&apos;a encore utilisé votre code de parrainage.</p>
                  <p className="text-[11px] text-white/50">Partagez votre code sur WhatsApp pour enregistrer vos premiers contacts !</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {attributions.map((att, idx) => {
                    const isValidated = att.status === "validated";
                    return (
                      <div 
                        key={idx}
                        className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                            isValidated ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-300"
                          }`}>
                            {idx + 1}
                          </div>
                          <div>
                            <span className="font-bold text-white block">{att.studentName || "Candidat Anonyme"}</span>
                            <span className="text-[10px] text-[#B89E7E] flex items-center gap-1.5">
                              <Calendar className="w-3 h-3" /> {att.createdAt ? new Date(att.createdAt).toLocaleDateString("fr-FR") : "Récemment"}
                            </span>
                          </div>
                        </div>

                        <div>
                          {isValidated ? (
                            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                              Validé (+100 pts)
                            </span>
                          ) : (
                            <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[10px] font-bold">
                              En attente de paiement
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FAQ Accordion */}
        <div className="mt-12 glass-card-luxury p-6 sm:p-8 rounded-[32px] border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 text-[#D4AF37]">
            <Info className="w-5 h-5" />
            <h3 className="font-bold text-sm font-dogon uppercase tracking-wider text-white">Questions Fréquentes sur le Suivi</h3>
          </div>

          <div className="space-y-3 pt-2">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="border-b border-white/5 pb-2.5 last:border-b-0">
                  <button 
                    onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                    className="w-full flex justify-between items-center text-left text-xs font-bold text-white hover:text-[#D4AF37] py-2 outline-none cursor-pointer transition-colors"
                  >
                    <span>{item.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#D4AF37] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#B89E7E] shrink-0" />}
                  </button>
                  {isOpen && (
                    <p className="text-[11px] text-[#B89E7E] mt-1 pl-1 leading-relaxed animate-fadeIn">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 border-t border-white/10 text-[11px] text-[#B89E7E]">
        © {new Date().getFullYear()} GALF Formation • Système de Traçabilité des Ambassadeurs.
      </footer>
    </div>
  );
}

export default function PublicProgressChecker() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#1A0F0A] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
      </div>
    }>
      <ProgressCheckerContent />
    </Suspense>
  );
}
