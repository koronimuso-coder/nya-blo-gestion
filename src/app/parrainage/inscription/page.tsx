"use client";

import React, { useState, useEffect } from "react";
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
  ChevronUp
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

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

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqItems = [
    {
      q: "Comment fonctionne le programme de parrainage GALF ?",
      a: "C'est simple : vous vous inscrivez comme parrain, vous obtenez un code unique, et vous le partagez avec vos connaissances. Pour chaque inscription validée de vos filleuls avec votre code, vous progressez. À 5 filleuls validés, vous obtenez une formation offerte !"
    },
    {
      q: "Quelles formations puis-je choisir en cadeau ?",
      a: "Toutes nos formations standards sont éligibles (HSE, Conduite d'engins, Secourisme, Informatique, etc.). Vous spécifiez votre préférence lors de votre inscription, mais vous pourrez la changer auprès de notre secrétariat lors de la validation."
    },
    {
      q: "Qu'est-ce qu'une 'inscription validée' ?",
      a: "Une inscription est validée dès lors que votre filleul a complété son inscription administrative et a réglé ses frais de scolarité (paiement complet ou premier versement validé par notre service comptable)."
    },
    {
      q: "Combien de temps mon code de parrainage est-il valide ?",
      a: "Votre code est valide sans limite de temps pour toutes nos campagnes actives. Vous pouvez parrainer autant de filleuls que vous le souhaitez !"
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
    toast.success("Lien de parrainage copié !");
  };

  const shareViaWhatsApp = (code: string) => {
    const message = `Salut ! Rejoins-moi chez GALF Formation et bénéficie d'un suivi personnalisé. Inscris-toi en utilisant mon code parrain: ${code} ou via ce lien: https://galf.ci/inscription?ref=${code}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`, "_blank");
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#FAF3E0] text-[#2D1A12] font-sans flex flex-col items-center justify-between pb-8">
      <Toaster position="top-center" />

      {/* Header bar */}
      <header className="w-full bg-[#5C3D2E] p-6 text-center text-[#FAF3E0] shadow-md relative overflow-hidden">
        <div className="absolute inset-0 dogon-pattern opacity-10 pointer-events-none" />
        <h1 className="text-2xl font-bold font-dogon tracking-wider uppercase">GALF FORMATION</h1>
        <p className="text-xs text-[#D4AF37] font-bold tracking-widest mt-1">Devenez Ambassadeur & Gagnez des Formations</p>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-lg px-4 py-8 flex-1 flex flex-col justify-center gap-6">
        {!registeredMember ? (
          <div className="bg-white p-8 rounded-[36px] shadow-xl border border-[#E8DCC4] space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mx-auto text-[#D4AF37]">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-[#5C3D2E] font-dogon">Formulaire d&apos;Affiliation</h2>
              <p className="text-xs text-gray-500">Inscrivez-vous gratuitement pour obtenir votre code parrain et commencer à parrainer vos proches.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Prénom <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text" 
                      name="prenom"
                      placeholder="Ex: Mamadou"
                      required
                      value={formData.prenom}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-3 rounded-xl bg-[#FAF3E0]/20 border border-[#E8DCC4] text-xs font-bold outline-none focus:border-[#D4AF37] transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Nom <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    name="nom"
                    placeholder="Ex: Koné"
                    required
                    value={formData.nom}
                    onChange={handleChange}
                    className="w-full px-3 py-3 rounded-xl bg-[#FAF3E0]/20 border border-[#E8DCC4] text-xs font-bold outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Téléphone Mobile (WhatsApp) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="tel" 
                    name="telephone"
                    placeholder="Ex: 07 07 07 07 07"
                    required
                    value={formData.telephone}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-[#FAF3E0]/20 border border-[#E8DCC4] text-xs font-bold outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Adresse E-mail (Optionnelle)</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email" 
                    name="email"
                    placeholder="Ex: mamadou@gmail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-[#FAF3E0]/20 border border-[#E8DCC4] text-xs font-bold outline-none focus:border-[#D4AF37] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Formation Cadeau Souhaitée</label>
                <div className="relative">
                  <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select 
                    name="formationSouhaitee"
                    value={formData.formationSouhaitee}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-3 rounded-xl bg-[#FAF3E0]/20 border border-[#E8DCC4] text-xs font-bold outline-none focus:border-[#D4AF37] transition-all appearance-none"
                  >
                    <option value="Sécurité & HSE">Sécurité & HSE</option>
                    <option value="Conduite d'engins (CACES)">Conduite d&apos;engins (CACES)</option>
                    <option value="Secourisme & Premiers Secours">Secourisme & Premiers Secours</option>
                    <option value="Bureautique & Informatique">Bureautique & Informatique</option>
                    <option value="Management & Leadership">Management & Leadership</option>
                  </select>
                </div>
              </div>

              <div className="p-3 bg-[#FAF3E0]/30 border border-[#E8DCC4]/50 rounded-2xl flex gap-2.5 text-[10px] text-gray-600">
                <Info className="w-4 h-4 shrink-0 text-amber-600" />
                <p>En vous inscrivant, vous acceptez les règles du programme (5 inscriptions validées = 1 formation offerte).</p>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-[#5C3D2E] text-white hover:bg-[#A66037] rounded-xl font-bold text-sm tracking-wider transition-all shadow-lg cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Inscription en cours...
                  </>
                ) : (
                  <>
                    Devenir Ambassadeur <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6 animate-fadeIn">
            {/* Success card */}
            <div className="bg-white p-6 rounded-[36px] border border-emerald-100 shadow-xl space-y-6 text-center">
              <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500 border border-emerald-100">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#5C3D2E] font-dogon">Compte Créé avec Succès !</h3>
                <p className="text-xs text-gray-500">Voici vos informations ambassadeur uniques. Conservez-les précieusement.</p>
              </div>

              {/* Digital Card */}
              <div className="w-full rounded-[30px] bg-gradient-to-br from-[#5C3D2E] to-[#8B5E3C] p-6 text-[#FAF3E0] text-left shadow-lg relative overflow-hidden">
                <div className="absolute right-0 bottom-0 w-24 h-24 opacity-10 bg-amber-400 rounded-full" />
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[9px] tracking-widest text-[#D4AF37] font-black uppercase">Ambassadeur GALF</span>
                    <h4 className="text-lg font-bold font-dogon mt-0.5">{registeredMember.prenom} {registeredMember.nom}</h4>
                  </div>
                  <Award className="w-6 h-6 text-[#D4AF37]" />
                </div>
                <div className="mt-8 flex justify-between items-end">
                  <div>
                    <p className="text-[8px] text-[#FAF3E0]/60 tracking-widest font-bold">VOTRE CODE PARRAIN</p>
                    <p className="text-2xl font-mono font-black tracking-widest text-[#D4AF37] mt-0.5">{registeredMember.codeId}</p>
                  </div>
                </div>
              </div>

              {/* Sharing options */}
              <div className="space-y-3 pt-2">
                <p className="text-xs font-bold text-[#5C3D2E] text-left">Partagez votre code :</p>
                <div className="flex gap-3">
                  <button 
                    onClick={() => copyToClipboard(`https://galf.ci/inscription?ref=${registeredMember.codeId}`)}
                    className="flex-1 py-3 bg-[#FAF3E0] hover:bg-[#E8DCC4] text-[#5C3D2E] text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all border border-[#E8DCC4]"
                  >
                    <Copy className="w-4 h-4" /> Copier le lien
                  </button>
                  <button 
                    onClick={() => shareViaWhatsApp(registeredMember.codeId)}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-md"
                  >
                    <Share2 className="w-4 h-4" /> WhatsApp
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-[#FAF3E0]">
                <button 
                  onClick={() => setRegisteredMember(null)}
                  className="text-xs text-[#A66037] hover:text-[#5C3D2E] font-bold"
                >
                  Créer un autre compte parrain
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-white p-6 rounded-[36px] border border-[#E8DCC4] shadow-md space-y-4">
          <div className="flex items-center gap-2 text-[#5C3D2E]">
            <HelpCircle className="w-5 h-5 text-[#D4AF37]" />
            <h3 className="font-bold text-sm font-dogon uppercase tracking-wider">Foire Aux Questions (FAQ)</h3>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={idx} className="border-b border-[#FAF3E0] pb-2 last:border-b-0">
                  <button 
                    onClick={() => toggleFaq(idx)}
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
      <footer className="text-center text-[10px] text-gray-400 font-medium mt-4">
        © {new Date().getFullYear()} GALF Formation. Tous droits réservés.
      </footer>
    </div>
  );
}
