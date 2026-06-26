"use client";

import React, { useState } from "react";
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
  Share2
} from "lucide-react";
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

export default function PublicProgressChecker() {
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const [member, setMember] = useState<ReferralMember | null>(null);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqItems = [
    {
      q: "Comment suivre mes filleuls ?",
      a: "Saisissez votre code parrain ou votre numéro de téléphone dans la barre de recherche ci-dessus. La liste de vos filleuls avec leur statut s'affichera automatiquement."
    },
    {
      q: "Combien de points rapporte un filleul ?",
      a: "Chaque filleul validé vous rapporte 100 points commission. À partir de 500 points cumulés (soit 5 filleuls validés), vous devenez éligible à une formation 100% offerte !"
    },
    {
      q: "Combien de temps faut-il pour valider ma récompense ?",
      a: "Dès que vous atteignez les 500 points (5/5), notre équipe administrative vérifie le dossier sous 48h ouvrées. Un bon officiel de formation vous sera alors délivré."
    },
    {
      q: "Puis-je changer de formation cadeau ?",
      a: "Oui, la formation choisie lors de l'inscription est indicative. Vous pouvez la modifier au moment de l'attribution officielle de votre bon cadeau."
    }
  ];

  const shareViaWhatsApp = (code: string) => {
    const message = `Rejoins-moi chez GALF Formation ! Inscris-toi avec mon code parrain: ${code} ou via ce lien: https://galf.ci/inscription?ref=${code}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) {
      toast.error("Veuillez renseigner un code parrain ou un numéro de téléphone.");
      return;
    }

    setLoading(true);
    setSearched(true);
    setMember(null);
    setAttributions([]);

    try {
      const cleanVal = inputVal.trim();
      const response = await fetch(`/api/referral/check?q=${encodeURIComponent(cleanVal)}`);
      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Aucun compte parrain trouvé avec ces informations.");
        return;
      }

      if (data.success && data.member) {
        setMember(data.member);
        setAttributions(data.attributions || []);
      } else {
        toast.error("Aucun compte parrain trouvé avec ces informations.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur de connexion avec le serveur.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Lien de parrainage copié !");
  };

  const valCount = member?.stats?.validatedCount || 0;
  const progressPct = Math.min((valCount / 5) * 100, 100);

  return (
    <div className="min-h-screen bg-[#FAF3E0] text-[#2D1A12] font-sans flex flex-col items-center justify-between pb-8">
      <Toaster position="top-center" />

      {/* Header bar */}
      <header className="w-full bg-[#5C3D2E] p-6 text-center text-[#FAF3E0] shadow-md relative overflow-hidden">
        <div className="absolute inset-0 dogon-pattern opacity-10 pointer-events-none" />
        <h1 className="text-2xl font-bold font-dogon tracking-wider uppercase">GALF FORMATION</h1>
        <p className="text-xs text-[#D4AF37] font-bold tracking-widest mt-1">Espace Suivi Parrainage Ambassadeur</p>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-lg px-4 py-8 flex-1 flex flex-col justify-center">
        {!member ? (
          <div className="bg-white p-8 rounded-[36px] shadow-xl border border-[#E8DCC4] space-y-6">
            <div className="text-center space-y-2">
              <Award className="w-12 h-12 text-[#D4AF37] mx-auto animate-bounce" />
              <h2 className="text-xl font-bold text-[#5C3D2E] font-dogon">Suivez votre progression</h2>
              <p className="text-xs text-gray-500">Renseignez votre Code Parrain ou le numéro de téléphone associé à votre compte parrain.</p>
            </div>

            <form onSubmit={handleSearch} className="space-y-4">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B89E7E]" />
                <input 
                  type="text" 
                  placeholder="Ex: MAMADOU26 ou 07070707..."
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37] text-sm font-bold outline-none transition-all"
                />
              </div>
              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#5C3D2E] text-white hover:bg-[#A66037] rounded-2xl font-bold text-sm tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Recherche...
                  </>
                ) : (
                  "Vérifier mes gains"
                )}
              </button>
            </form>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-xs text-amber-800">
              <Info className="w-5 h-5 shrink-0 text-amber-600" />
              <p>Rappel : Chaque parrainage validé (5 filleuls inscrits et confirmés) vous donne droit à 1 formation entièrement gratuite chez GALF Formation.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {/* Dynamic Card */}
            <div className="w-full rounded-[36px] bg-gradient-to-r from-[#5C3D2E] to-[#8B5E3C] p-6 text-[#FAF3E0] shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 w-32 h-32 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-200 via-amber-400 to-amber-900 rounded-full" />
              
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-amber-400 to-[#FAF3E0] text-[#5C3D2E] font-black flex items-center justify-center text-sm shadow-md">
                    {member.prenom.charAt(0).toUpperCase()}{member.nom ? member.nom.charAt(0).toUpperCase() : ""}
                  </div>
                  <div>
                    <span className="text-[10px] tracking-widest text-[#D4AF37] font-black uppercase">Ambassadeur GALF</span>
                    <h3 className="text-xl font-bold font-dogon mt-0.5">{member.prenom} {member.nom}</h3>
                  </div>
                </div>
                <button 
                  onClick={() => { setMember(null); setSearched(false); setInputVal(""); }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                  title="Nouvelle recherche"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <div>
                  <p className="text-[8px] text-[#FAF3E0]/60 tracking-widest font-bold">VOTRE LIEN DE PARRAINAGE</p>
                  <p className="text-2xl font-mono font-black tracking-widest text-[#D4AF37] mt-0.5">{member.codeId}</p>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => copyToClipboard(`https://galf.ci/inscription?ref=${member.codeId}`)}
                    className="flex-1 py-2.5 bg-[#FAF3E0] hover:bg-white text-[#5C3D2E] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copier lien
                  </button>
                  <button 
                    onClick={() => shareViaWhatsApp(member.codeId)}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <Share2 className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                </div>
              </div>
            </div>

            {/* Progression details */}
            <div className="bg-white p-6 rounded-[36px] border border-[#E8DCC4] shadow-md space-y-4">
              <div>
                <h4 className="font-bold text-sm text-[#5C3D2E] font-dogon uppercase tracking-wider">État de votre Progression</h4>
                <p className="text-xs text-gray-500 mt-0.5">Votre progression actuelle pour obtenir votre formation offerte.</p>
              </div>

              {/* Commission Points & Status Cards */}
              <div className="grid grid-cols-2 gap-4 border-b border-[#FAF3E0] pb-4">
                <div className="bg-[#FAF3E0]/30 p-3 rounded-2xl border border-[#E8DCC4]/30 text-center">
                  <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider block">Filleuls Validés</span>
                  <span className="text-xl font-bold text-[#5C3D2E]">{valCount} / 5</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-2xl border border-amber-100 text-center">
                  <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider block">Points Commission</span>
                  <span className="text-xl font-bold text-amber-800">{valCount * 100} / 500 pts</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-xs font-bold text-[#A66037]">
                  <span>Progression globale</span>
                  <span>{Math.round(progressPct)}%</span>
                </div>
                <div className="w-full h-3 bg-[#FAF3E0] rounded-full overflow-hidden border border-[#E8DCC4]/50">
                  <div 
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#A66037] transition-all duration-700" 
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="text-xs text-gray-600 pt-1">
                  {valCount >= 5 
                    ? "🎉 Félicitations ! Votre bon de formation gratuite est éligible et en cours de validation par notre administration."
                    : `Encore ${5 - valCount} filleul(s) validé(s) (ou ${500 - (valCount * 100)} points) pour débloquer votre formation gratuite en ${member.formationSouhaitee || "HSE / Engins"}.`}
                </p>
              </div>
            </div>

            {/* Filleuls list */}
            <div className="bg-white p-6 rounded-[36px] border border-[#E8DCC4] shadow-md space-y-4">
              <h4 className="font-bold text-sm text-[#5C3D2E] font-dogon uppercase tracking-wider">Vos filleuls enregistrés</h4>
              
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {attributions.map((attr, index) => {
                  const isCounted = ["Confirmé", "inscription validée"].includes(attr.status);
                  return (
                    <div key={index} className="p-3 bg-[#FAF3E0]/20 border border-[#E8DCC4]/30 rounded-xl flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold">{attr.studentName}</p>
                        <p className="text-[10px] text-gray-400 mt-0.5">Inscrit le {new Date(attr.createdAt).toLocaleDateString("fr-FR")}</p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg font-black text-[9px] uppercase tracking-wider ${
                        isCounted 
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-100" 
                          : "bg-amber-50 text-amber-700 border border-amber-100"
                      }`}>
                        {isCounted ? "validé (compté)" : "en attente"}
                      </span>
                    </div>
                  );
                })}

                {attributions.length === 0 && (
                  <p className="text-xs text-gray-400 italic text-center py-6">Aucun filleul rattaché pour le moment.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* FAQ Accordion Section */}
        <div className="bg-white p-6 rounded-[36px] border border-[#E8DCC4] shadow-md space-y-4 mt-6">
          <div className="flex items-center gap-2 text-[#5C3D2E]">
            <Award className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-bold text-sm font-dogon uppercase tracking-wider">Foire Aux Questions</h3>
          </div>
          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="border-b border-[#FAF3E0] pb-2 last:border-b-0">
                  <button 
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full flex justify-between items-center text-left text-xs font-bold text-[#5C3D2E] hover:text-[#A66037] py-2 outline-none"
                  >
                    <span>{item.q}</span>
                    {isOpen ? <ChevronUp className="w-4 h-4 text-[#A66037] shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#A66037] shrink-0" />}
                  </button>
                  {isOpen && (
                    <p className="text-[11px] text-gray-500 mt-1 pl-1 leading-relaxed animate-fadeIn">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="text-center text-[10px] text-gray-400 font-medium">
        © {new Date().getFullYear()} GALF Formation. Tous droits réservés.
      </footer>
    </div>
  );
}
