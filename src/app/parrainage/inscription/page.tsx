"use client";

import React, { useState } from "react";
import { 
  User, 
  Phone, 
  Mail, 
  BookOpen, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  Loader2, 
  Copy, 
  Share2, 
  ArrowRight,
  Info,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ShieldCheck,
  Star,
  Check,
  Zap
} from "lucide-react";
import Link from "next/link";
import toast, { Toaster } from "react-hot-toast";

const AVAILABLE_FORMATIONS = [
  { 
    id: "Sécurité & HSE", 
    label: "Sécurité & HSE", 
    desc: "Hygiène, Sécurité et Environnement en milieu industriel",
    badge: "Le plus populaire",
    icon: ShieldCheck
  },
  { 
    id: "Conduite d'engins (CACES)", 
    label: "Conduite d'Engins (CACES)", 
    desc: "Permis cariste, pelleteuse et manutention professionnelle",
    badge: "Forte demande",
    icon: Star
  },
  { 
    id: "Secourisme & Premiers Secours", 
    label: "Secourisme (SST)", 
    desc: "Sauveteur Secouriste du Travail certifié d'État",
    badge: "Certifiant",
    icon: Award
  },
  { 
    id: "Bureautique & Informatique", 
    label: "Informatique & Excel Pro", 
    desc: "Outils de gestion modernes, tableurs et tableaux de bord",
    badge: "Essentiel",
    icon: BookOpen
  },
  { 
    id: "Management & Leadership", 
    label: "Management & Vente", 
    desc: "Supervision d'équipes et pilotage commercial moderne",
    badge: "Cadres",
    icon: Zap
  }
];

export default function ParrainSelfRegistration() {
  const [formData, setFormData] = useState({
    prenom: "",
    nom: "",
    email: "",
    telephone: "",
    formationSouhaitee: "Sécurité & HSE",
    campagneId: ""
  });

  const [loading, setLoading] = useState(false);
  const [registeredMember, setRegisteredMember] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqItems = [
    {
      q: "Comment fonctionne le programme de parrainage GALF ?",
      a: "C'est simple : vous vous inscrivez comme parrain, vous obtenez un code unique, et vous le partagez avec vos connaissances. Pour chaque inscription validée de vos filleuls avec votre code, vous progressez. À 5 filleuls validés, vous obtenez une formation certifiante 100% offerte !"
    },
    {
      q: "Quelles formations puis-je choisir en cadeau ?",
      a: "Toutes nos formations standards sont éligibles (HSE, Conduite d'engins CACES, Secourisme SST, Informatique, Management). Vous spécifiez votre préférence lors de votre inscription, et vous pourrez la réajuster auprès de notre secrétariat au moment du déblocage de votre bon."
    },
    {
      q: "Qu'est-ce qu'une 'inscription validée' ?",
      a: "Une inscription est validée dès lors que votre filleul a complété son inscription administrative et a réglé ses frais de scolarité (paiement comptant ou premier versement validé par le service comptable)."
    },
    {
      q: "Combien de temps mon code de parrainage est-il valide ?",
      a: "Votre code est valide sans limite de temps. Chaque tranche de 5 filleuls validés vous fait gagner une nouvelle formation gratuite, sans aucun plafond !"
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelectFormation = (formationId: string) => {
    setFormData(prev => ({ ...prev, formationSouhaitee: formationId }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.prenom.trim() || !formData.nom.trim() || !formData.telephone.trim()) {
      toast.error("Veuillez remplir les champs obligatoires (Prénom, Nom, Téléphone).");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/referral/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Une erreur est survenue lors de l'inscription.");
        return;
      }

      toast.success("Félicitations ! Votre compte parrain a été créé.");
      setRegisteredMember(data.member);
    } catch (error) {
      console.error(error);
      toast.error("Impossible de joindre le serveur. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Lien de parrainage copié dans le presse-papier !");
    setTimeout(() => setCopied(false), 2500);
  };

  const shareViaWhatsApp = (code: string) => {
    const message = `Salut ! Rejoins-moi chez GALF Formation et bénéficie d'une formation professionnelle d'excellence. Inscris-toi en utilisant mon code parrain officiel : *${code}* ou directement via ce lien : https://galf.ci/inscription?ref=${code}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#1A0F0A] text-[#F7EAE3] selection:bg-[#D4AF37]/30 font-outfit flex flex-col justify-between relative overflow-x-hidden">
      <Toaster position="top-center" />

      {/* Atmospheric Background Glow */}
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
              title="Retour à l'accueil"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold font-dogon tracking-widest text-white uppercase leading-none">GALF FORMATION</span>
                <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[9px] font-bold text-[#D4AF37] uppercase">Ambassadeur</span>
              </div>
              <p className="text-[10px] text-[#B89E7E] tracking-wider mt-0.5">5 inscriptions validées = 1 formation offerte</p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wider">
            <Link href="/parrainage/check" className="hidden sm:inline-block text-[#B89E7E] hover:text-[#D4AF37] transition-colors py-1.5 px-3 rounded-lg hover:bg-white/5">
              Suivi des Points
            </Link>
            <Link href="/parrainage/portal" className="text-[#D4AF37] hover:underline transition-colors py-1.5 px-3 rounded-lg bg-[#D4AF37]/10 border border-[#D4AF37]/20">
              Espace Porté
            </Link>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="relative z-10 w-full max-w-2xl mx-auto px-4 sm:px-6 py-10 flex-1 flex flex-col justify-center">
        
        {!registeredMember ? (
          <div className="space-y-8">
            {/* Page Title & Intro */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#D4AF37] text-[11px] font-bold uppercase tracking-[0.25em]">
                <Sparkles className="w-3.5 h-3.5" /> Adhésion Ambassadeur 100% Gratuite
              </div>
              <h1 className="text-3xl sm:text-5xl font-bold font-dogon text-white tracking-tight">
                Devenez Ambassadeur GALF
              </h1>
              <p className="text-xs sm:text-sm text-[#B89E7E] max-w-lg mx-auto leading-relaxed">
                Remplissez ce formulaire pour recevoir instantanément votre code parrain exclusif et commencer à cumuler vos filleuls.
              </p>
            </div>

            {/* Stepper Progress Bar */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-white/[0.03] border border-white/10 rounded-2xl text-center text-[10px] sm:text-xs font-bold uppercase tracking-wider">
              <div className="py-2 rounded-xl bg-[#D4AF37] text-[#1A0F0A]">1. Coordonnées</div>
              <div className="py-2 rounded-xl bg-white/5 text-[#E8DCC4]">2. Récompense</div>
              <div className="py-2 rounded-xl bg-white/5 text-[#B89E7E]/60">3. Code VIP</div>
            </div>

            {/* Registration Card */}
            <div className="glass-card-luxury p-6 sm:p-10 rounded-[36px] border border-[#D4AF37]/25 shadow-2xl relative">
              <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* Personal Information */}
                <div className="space-y-4">
                  <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] block">
                    1. Vos Informations Personnelles
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#B89E7E]">
                        Prénom <span className="text-amber-400">*</span>
                      </label>
                      <div className="relative">
                        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B89E7E]" />
                        <input 
                          type="text" 
                          name="prenom"
                          placeholder="Ex: Mamadou"
                          required
                          value={formData.prenom}
                          onChange={handleChange}
                          className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/15 text-sm font-semibold text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-[#B89E7E]">
                        Nom de Famille <span className="text-amber-400">*</span>
                      </label>
                      <input 
                        type="text" 
                        name="nom"
                        placeholder="Ex: Koné"
                        required
                        value={formData.nom}
                        onChange={handleChange}
                        className="w-full px-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/15 text-sm font-semibold text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#B89E7E]">
                      Numéro WhatsApp / Téléphone Mobile <span className="text-amber-400">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B89E7E]" />
                      <input 
                        type="tel" 
                        name="telephone"
                        placeholder="Ex: 07 08 09 10 11 ou +225 05..."
                        required
                        value={formData.telephone}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/15 text-sm font-semibold text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                      />
                    </div>
                    <p className="text-[10px] text-[#B89E7E]/80">Ce numéro vous servira d&apos;identifiant de suivi et pour recevoir vos notifications de validation.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase tracking-wider text-[#B89E7E]">
                      Adresse E-mail <span className="text-white/40 text-[9px] lowercase font-normal">(optionnelle)</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B89E7E]" />
                      <input 
                        type="email" 
                        name="email"
                        placeholder="Ex: mamadou@exemple.com"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-white/[0.04] border border-white/15 text-sm font-semibold text-white placeholder:text-white/30 outline-none focus:border-[#D4AF37] focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Training Gift Preference Selection */}
                <div className="space-y-3 pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-[#D4AF37] uppercase tracking-[0.2em]">
                      2. Votre Formation Cadeau Préférée
                    </span>
                    <span className="text-[10px] text-[#B89E7E]">Modifiable à tout moment</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {AVAILABLE_FORMATIONS.map(item => {
                      const isSelected = formData.formationSouhaitee === item.id;
                      const IconComp = item.icon;
                      return (
                        <div
                          key={item.id}
                          onClick={() => handleSelectFormation(item.id)}
                          className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? "bg-[#D4AF37]/15 border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10"
                              : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                              isSelected ? "bg-[#D4AF37] text-[#1A0F0A]" : "bg-white/5 text-[#B89E7E]"
                            }`}>
                              <IconComp className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold text-white">{item.label}</span>
                                <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 text-[#D4AF37] border border-white/10">
                                  {item.badge}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#B89E7E] leading-tight mt-0.5">{item.desc}</p>
                            </div>
                          </div>

                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                            isSelected ? "border-[#D4AF37] bg-[#D4AF37]" : "border-white/20"
                          }`}>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#1A0F0A] stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Terms notice */}
                <div className="p-3.5 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl flex gap-3 text-xs text-[#E8DCC4]/90 items-start">
                  <Info className="w-4 h-4 shrink-0 text-[#D4AF37] mt-0.5" />
                  <p>
                    L&apos;adhésion est immédiate et sans frais. Votre bon de formation officielle est délivré après confirmation de 5 inscriptions validées par le secrétariat GALF.
                  </p>
                </div>

                {/* Submit button */}
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#A66037] text-[#1A0F0A] hover:brightness-110 rounded-2xl font-bold text-sm tracking-wider uppercase transition-all shadow-xl shadow-[#D4AF37]/20 cursor-pointer flex items-center justify-center gap-2.5 active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> Création de votre compte ambassadeur...
                    </>
                  ) : (
                    <>
                      Générer Mon Code Ambassadeur <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* ============================================================
             SUCCESS STATE: LUXURY DIGITAL AMBASSADOR CARD
             ============================================================ */
          <div className="space-y-8 animate-fadeIn">
            
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 rounded-3xl flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-bold font-dogon text-white">Compte Ambassadeur Activé !</h2>
              <p className="text-xs sm:text-sm text-[#B89E7E] max-w-md mx-auto">
                Félicitations <span className="text-white font-bold">{registeredMember.prenom} {registeredMember.nom}</span>, votre identifiant officiel est prêt à être diffusé.
              </p>
            </div>

            {/* Virtual Gold Member Credential */}
            <div className="p-8 rounded-[36px] bg-gradient-to-br from-[#2D1A12] via-[#5C3D2E] to-[#1A0F0A] border-2 border-[#D4AF37] shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#D4AF37]/15 rounded-full blur-[60px] pointer-events-none" />
              <div className="dogon-pattern absolute inset-0 opacity-15 pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[10px] font-bold uppercase tracking-[0.2em]">
                    <ShieldCheck className="w-3.5 h-3.5" /> Ambassadeur Officiel GALF
                  </div>
                  <h3 className="text-2xl font-bold font-dogon text-white mt-2">
                    {registeredMember.prenom} {registeredMember.nom}
                  </h3>
                  <p className="text-xs text-[#E8DCC4]/80 mt-0.5">
                    Formation visée : <span className="text-[#D4AF37] font-semibold">{registeredMember.formationSouhaitee}</span>
                  </p>
                </div>
                <div className="w-14 h-14 bg-[#D4AF37]/15 rounded-2xl border border-[#D4AF37]/30 flex items-center justify-center text-[#D4AF37]">
                  <Award className="w-8 h-8" />
                </div>
              </div>

              {/* Monospace Code Display */}
              <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                  <span className="text-[10px] text-[#B89E7E] font-bold uppercase tracking-[0.3em] block">
                    Votre Code de Parrainage
                  </span>
                  <div className="text-4xl font-mono font-bold tracking-widest text-[#D4AF37] mt-1 select-all drop-shadow-[0_0_12px_rgba(212,175,55,0.4)]">
                    {registeredMember.codeId}
                  </div>
                </div>

                <div className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
                  0 / 5 Filleuls (En cours)
                </div>
              </div>
            </div>

            {/* Action Buttons: WhatsApp & Copy */}
            <div className="space-y-4">
              <span className="text-xs font-bold text-[#E8DCC4] uppercase tracking-wider block text-center">
                Partagez directement à vos contacts :
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button 
                  onClick={() => shareViaWhatsApp(registeredMember.codeId)}
                  className="py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-emerald-900/30 cursor-pointer active:scale-95"
                >
                  <Share2 className="w-4 h-4" /> Partager sur WhatsApp
                </button>

                <button 
                  onClick={() => copyToClipboard(`https://galf.ci/inscription?ref=${registeredMember.codeId}`)}
                  className="py-4 px-6 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer active:scale-95"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-400" /> Lien Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#D4AF37]" /> Copier le Lien Web
                    </>
                  )}
                </button>
              </div>

              {/* Direct Link to Track Progress */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4 text-xs font-bold">
                <Link 
                  href={`/parrainage/check?q=${encodeURIComponent(registeredMember.codeId)}`}
                  className="text-[#D4AF37] hover:underline flex items-center gap-1.5 py-2 px-4 rounded-xl bg-white/5 border border-white/10"
                >
                  Suivre mes points en direct <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <button 
                  onClick={() => setRegisteredMember(null)}
                  className="text-[#B89E7E] hover:text-white transition-colors"
                >
                  Inscrire un autre ambassadeur
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Accordion */}
        <div className="mt-12 glass-card-luxury p-6 sm:p-8 rounded-[32px] border border-white/10 space-y-4">
          <div className="flex items-center gap-2.5 text-[#D4AF37]">
            <HelpCircle className="w-5 h-5" />
            <h3 className="font-bold text-sm font-dogon uppercase tracking-wider text-white">Questions Fréquentes sur le Parrainage</h3>
          </div>

          <div className="space-y-3 pt-2">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="border-b border-white/5 pb-2.5 last:border-b-0">
                  <button 
                    onClick={() => toggleFaq(idx)}
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
        © {new Date().getFullYear()} GALF Formation • Programme Officiel Ambassadeurs. Tous droits réservés.
      </footer>
    </div>
  );
}
