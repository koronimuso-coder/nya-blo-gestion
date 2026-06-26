"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs, onSnapshot, doc, getDoc, orderBy } from "firebase/firestore";
import { normalizePhone } from "@/lib/referral";
import { 
  Gift, 
  UserCheck, 
  Sparkles, 
  Smartphone, 
  ArrowRight, 
  CheckCircle2, 
  Hourglass, 
  AlertTriangle,
  LogOut, 
  Copy, 
  Check, 
  QrCode,
  Award,
  BookOpen,
  MapPin,
  Calendar,
  ChevronRight,
  TrendingUp,
  X,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";
import gsap from "gsap";

interface ReferralMember {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephoneNormalise: string;
  formationSouhaitee: string;
  codeId: string;
  status: string;
  stats?: {
    totalReferred?: number;
    validatedCount?: number;
    pendingCount?: number;
    rewardCount?: number;
  };
}

interface ReferralReward {
  id: string;
  reference: string;
  qualifyingCount: number;
  status: string;
  trainingId: string | null;
  centerId: string | null;
  approvedAt: string | null;
  expiresAt: string;
  createdAt: string;
}

interface ReferralAttribution {
  id: string;
  studentName: string;
  studentPhone: string;
  status: string;
  createdAt: string;
}

export default function ParrainagePortal() {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Auth states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [simulatedOtp, setSimulatedOtp] = useState("");
  
  // Session states
  const [member, setMember] = useState<ReferralMember | null>(null);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [attributions, setAttributions] = useState<ReferralAttribution[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  // Auto-restore session from sessionStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("nya_blo_parrain_session");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMember(parsed);
        } catch (e) {
          sessionStorage.removeItem("nya_blo_parrain_session");
        }
      }
    }
  }, []);

  // GSAP animations for entering
  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(
        containerRef.current.querySelectorAll(".animate-fade"),
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.1, duration: 0.6, ease: "power2.out" }
      );
    }
  }, [member, isOtpSent]);

  // Real-time updates once logged in
  useEffect(() => {
    if (!member?.id) return;

    // 1. Sync member info
    const unsubMember = onSnapshot(doc(db, "referral_members", member.id), (docSnap) => {
      if (docSnap.exists()) {
        const updated = { id: docSnap.id, ...docSnap.data() } as ReferralMember;
        setMember(updated);
        sessionStorage.setItem("nya_blo_parrain_session", JSON.stringify(updated));
      }
    });

    // 2. Sync rewards
    const qRewards = query(
      collection(db, "referral_rewards"), 
      where("memberId", "==", member.id),
      orderBy("createdAt", "desc")
    );
    const unsubRewards = onSnapshot(qRewards, (snap) => {
      setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ReferralReward));
    });

    // 3. Sync attributions
    const qAttributions = query(
      collection(db, "referral_attributions"),
      where("referralMemberId", "==", member.id),
      orderBy("createdAt", "desc")
    );
    const unsubAttributions = onSnapshot(qAttributions, (snap) => {
      setAttributions(snap.docs.map(d => ({ id: d.id, ...d.data() }) as ReferralAttribution));
    });

    return () => {
      unsubMember();
      unsubRewards();
      unsubAttributions();
    };
  }, [member?.id]);

  // Login handler step 1: check phone number
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;

    setLoading(true);
    const normalizedInput = normalizePhone(phoneNumber);

    try {
      const q = query(
        collection(db, "referral_members"),
        where("status", "==", "active")
      );
      
      const snap = await getDocs(q);
      const matchedDoc = snap.docs.find(d => {
        const phone = normalizePhone(d.data().telephoneNormalise || "");
        // Check suffix match to handle country code variants
        return phone.endsWith(normalizedInput) || normalizedInput.endsWith(phone);
      });

      if (!matchedDoc) {
        toast.error("Numéro non reconnu ou parrain suspendu. Veuillez vérifier la saisie.");
        setLoading(false);
        return;
      }

      // Found parrain! Simulate sending OTP
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setSimulatedOtp(code);
      setIsOtpSent(true);
      toast.success("Code de vérification simulé généré !");
      
      // Focus OTP field
      setTimeout(() => {
        document.getElementById("otp-input")?.focus();
      }, 300);

    } catch (err) {
      console.error(err);
      toast.error("Erreur technique lors de la recherche du parrain.");
    } finally {
      setLoading(false);
    }
  };

  // Login handler step 2: verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode) return;

    setLoading(true);
    // Standard bypass for convenience / fallback
    if (otpCode === simulatedOtp || otpCode === "123456") {
      try {
        const normalizedInput = normalizePhone(phoneNumber);
        const q = query(collection(db, "referral_members"));
        const snap = await getDocs(q);
        const matchedDoc = snap.docs.find(d => {
          const phone = normalizePhone(d.data().telephoneNormalise || "");
          return phone.endsWith(normalizedInput) || normalizedInput.endsWith(phone);
        });

        if (matchedDoc) {
          const memberData = { id: matchedDoc.id, ...matchedDoc.data() } as ReferralMember;
          setMember(memberData);
          sessionStorage.setItem("nya_blo_parrain_session", JSON.stringify(memberData));
          toast.success(`Bienvenue, ${memberData.prenom} !`);
        }
      } catch (err) {
        console.error(err);
        toast.error("Erreur de session.");
      }
    } else {
      toast.error("Code erroné. Veuillez saisir le code affiché dans la simulation.");
    }
    setLoading(false);
  };

  // Logout handler
  const handleLogout = () => {
    setMember(null);
    setPhoneNumber("");
    setOtpCode("");
    setIsOtpSent(false);
    sessionStorage.removeItem("nya_blo_parrain_session");
    toast.success("Déconnexion réussie");
  };

  // Referral link helper
  const referralLink = member ? `${window.location.origin}/parrainage/inscription?code=${member.codeId}` : "";

  const handleCopyLink = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    toast.success("Lien de parrainage copié !");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Status mapping for rewards
  const getRewardStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      eligible: { label: "Éligible (Vérification)", cls: "bg-amber-50 text-amber-700 border-amber-200" },
      verification_en_cours: { label: "Anti-Fraude en cours", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      informations_requises: { label: "Besoin d'informations", cls: "bg-blue-50 text-blue-700 border-blue-200" },
      approuvee: { label: "Approuvée (Prête)", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      programmee: { label: "Session Programmée", cls: "bg-teal-50 text-teal-700 border-teal-200" },
      attribuee: { label: "Attribuée (Lettre remise)", cls: "bg-purple-50 text-purple-700 border-purple-200" },
      utilisee: { label: "Clôturée / Utilisée", cls: "bg-gray-100 text-gray-600 border-gray-200" },
      refusee: { label: "Refusée / Non-conforme", cls: "bg-red-50 text-red-700 border-red-200" },
      expiree: { label: "Expirée", cls: "bg-rose-50 text-rose-700 border-rose-200" }
    };

    const item = map[status] || { label: status, cls: "bg-slate-50 text-slate-700 border-slate-200" };
    return (
      <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${item.cls}`}>
        {item.label}
      </span>
    );
  };

  // Status mapping for referred candidates (filleuls)
  const getFilleulStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      "Confirmé": { label: "Validé (Payé)", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      "inscription validée": { label: "Validé (Payé)", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
      "paiement complet": { label: "Validé (Payé)", cls: "bg-teal-50 text-teal-700 border-teal-200" },
      "prospect enregistré": { label: "Enregistré", cls: "bg-slate-50 text-slate-600 border-slate-200" },
      "inscription en attente": { label: "Attente documents", cls: "bg-amber-50 text-amber-600 border-amber-200" },
      "paiement à vérifier": { label: "Vérification paiement", cls: "bg-yellow-50 text-yellow-700 border-yellow-200" },
      "paiement partiel": { label: "Acompte payé", cls: "bg-orange-50 text-orange-600 border-orange-200" },
      "Incomplet": { label: "Incomplet", cls: "bg-orange-50 text-orange-600 border-orange-200" },
      "inscription refusée": { label: "Refusé", cls: "bg-red-50 text-red-700 border-red-200" },
      "inscription annulée": { label: "Annulé", cls: "bg-rose-50 text-rose-600 border-rose-200" }
    };

    const item = map[status] || { label: status || "En attente", cls: "bg-blue-50 text-blue-700 border-blue-200" };
    return (
      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-tight border ${item.cls}`}>
        {item.label}
      </span>
    );
  };

  // Calculate progression out of 5
  const validatedCount = member?.stats?.validatedCount || 0;
  const progressRatio = validatedCount % 5;
  const progressPercent = Math.min(Math.round((progressRatio / 5) * 100), 100);

  return (
    <div className="min-h-screen bg-[#1A0F0A] text-[#FAF3E0] selection:bg-[#D4AF37]/30 overflow-x-hidden font-outfit relative py-12 px-6">
      
      {/* Background shapes */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#A66037]/15 rounded-full blur-[130px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#5C3D2E]/15 rounded-full blur-[130px]" />
        <div className="dogon-pattern absolute inset-0 opacity-5" />
      </div>

      <div ref={containerRef} className="max-w-4xl mx-auto relative z-10">
        
        {/* LOGGED OUT PORTAL VIEW */}
        {!member ? (
          <div className="max-w-md mx-auto bg-[#2D1A12] border border-[#5C3D2E] p-8 md:p-10 rounded-[40px] shadow-2xl relative overflow-hidden animate-fade">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-full" />
            
            {/* Logo area */}
            <div className="flex items-center gap-3 mb-8 justify-center">
              <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center shadow-lg shadow-[#D4AF37]/20">
                <Gift className="w-6 h-6 text-[#2D1A12]" />
              </div>
              <span className="text-xl font-bold font-dogon tracking-widest text-white uppercase">GALF REWARDS</span>
            </div>

            <div className="text-center space-y-2 mb-8">
              <h2 className="text-2xl font-bold font-dogon text-white">Espace Personnel Parrain</h2>
              <p className="text-xs text-[#B89E7E] leading-relaxed">
                Entrez votre numéro de téléphone pour vérifier votre progression, récupérer votre code unique, et consulter vos formations gratuites.
              </p>
            </div>

            {/* Step 1: Telephone entry */}
            {!isOtpSent ? (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-wider pl-1">
                    Numéro de Téléphone
                  </label>
                  <div className="relative group">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B89E7E]" />
                    <input 
                      type="tel"
                      placeholder="Ex: 07 07 07 07 07"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      required
                      className="w-full pl-12 pr-4 py-4 rounded-2xl bg-black/20 border border-[#5C3D2E] text-white outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37] text-sm font-semibold transition-all"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  variant="gold" 
                  className="w-full h-14 rounded-2xl shadow-gold font-bold group cursor-pointer"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                  ) : (
                    <span className="flex items-center justify-center">
                      Accéder à l'espace <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </span>
                  )}
                </Button>
              </form>
            ) : (
              // Step 2: OTP Verification simulation
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                <div className="bg-[#FAF3E0]/5 border border-[#D4AF37]/20 p-4 rounded-2xl text-center space-y-2 mb-4">
                  <span className="text-[9px] uppercase font-bold text-[#D4AF37] tracking-widest">Simulation de Sécurité SMS</span>
                  <p className="text-[11px] text-[#B89E7E]">
                    Pour des raisons de commodité de test, le code de sécurité envoyé par SMS au <span className="text-white font-bold">{phoneNumber}</span> est :
                  </p>
                  <span className="inline-block text-xl font-bold tracking-widest text-[#D4AF37] bg-black/30 px-5 py-1.5 rounded-xl border border-white/5 font-mono">
                    {simulatedOtp}
                  </span>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-wider pl-1">
                    Code de Validation (6 chiffres)
                  </label>
                  <input 
                    type="text"
                    id="otp-input"
                    maxLength={6}
                    placeholder="Saisir les 6 chiffres"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    required
                    className="w-full tracking-widest text-center py-4 rounded-2xl bg-black/20 border border-[#5C3D2E] text-white outline-none focus:border-[#D4AF37] text-xl font-bold"
                  />
                </div>

                <div className="flex gap-3">
                  <Button 
                    type="submit" 
                    variant="gold" 
                    className="flex-1 h-14 rounded-2xl shadow-gold font-bold cursor-pointer"
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Valider"}
                  </Button>
                  <button 
                    type="button"
                    onClick={() => setIsOtpSent(false)}
                    className="px-5 h-14 rounded-2xl border border-[#5C3D2E] text-[#B89E7E] hover:text-white transition-all text-xs font-bold cursor-pointer"
                  >
                    Retour
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          
          // LOGGED IN MEMBER DASHBOARD VIEW
          <div className="space-y-8 animate-fade">
            
            {/* Header / Top Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#2D1A12] border border-[#5C3D2E] p-6 rounded-3xl shadow-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] text-[#2D1A12] flex items-center justify-center shadow-lg">
                  <UserCheck className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-[0.2em] block">
                    Partenaire Officiel GALF
                  </span>
                  <h1 className="text-xl font-bold font-dogon text-white uppercase">
                    {member.prenom} {member.nom}
                  </h1>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="self-end md:self-center px-4 py-2.5 bg-white/5 border border-white/10 hover:bg-red-500/10 hover:text-red-400 text-[#FAF3E0] hover:border-red-500/20 text-xs font-bold uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" /> Se déconnecter
              </button>
            </div>

            {/* Quick stats and action cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Code card */}
              <div className="bg-[#2D1A12] border border-[#5C3D2E] p-6 rounded-[36px] flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute inset-0 bg-radial from-[#D4AF37]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] font-bold text-[#B89E7E] uppercase tracking-wider">Votre Code Parrain</span>
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold font-dogon text-white tracking-wider uppercase mb-1">
                    {member.codeId}
                  </h3>
                  <p className="text-[10px] text-[#B89E7E]">Diffusez ce code pour enregistrer des filleuls.</p>
                </div>
                <div className="flex gap-2 mt-5">
                  <button 
                    onClick={handleCopyLink}
                    className="flex-1 py-3 px-4 bg-white/5 border border-white/10 hover:bg-[#FAF3E0] hover:text-[#2D1A12] text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copiedLink ? "Copié !" : "Copier le Lien"}
                  </button>
                  <button 
                    onClick={() => setShowQrModal(true)}
                    className="p-3 bg-[#D4AF37] hover:bg-[#A66037] text-[#2D1A12] hover:text-white rounded-xl transition-all cursor-pointer"
                    title="Afficher QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Progress counter card */}
              <div className="bg-[#2D1A12] border border-[#5C3D2E] p-6 rounded-[36px] flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] font-bold text-[#B89E7E] uppercase tracking-wider">Filleuls Validés</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-dogon text-white">{validatedCount}</span>
                    <span className="text-xs text-[#B89E7E]">validés</span>
                  </div>
                  <p className="text-[10px] text-[#B89E7E] mt-1">
                    {member.stats?.totalReferred || 0} filleul(s) total enregistré(s)
                  </p>
                </div>
                <div className="border-t border-[#5C3D2E] pt-4 mt-5 flex justify-between items-center text-[10px] text-[#B89E7E]">
                  <span>En attente : {member.stats?.pendingCount || 0}</span>
                  <span className="text-[#D4AF37] font-bold">Objectif: multiple de 5</span>
                </div>
              </div>

              {/* Rewards counter card */}
              <div className="bg-[#2D1A12] border border-[#5C3D2E] p-6 rounded-[36px] flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[9px] font-bold text-[#B89E7E] uppercase tracking-wider">Formations Offertes</span>
                  <Award className="w-4 h-4 text-[#D4AF37] animate-pulse" />
                </div>
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold font-dogon text-white">
                      {rewards.filter(r => r.status === "approuvee" || r.status === "programmee" || r.status === "attribuee" || r.status === "utilisee").length}
                    </span>
                    <span className="text-xs text-[#B89E7E]">obtenues</span>
                  </div>
                  <p className="text-[10px] text-[#B89E7E] mt-1">
                    Formation visée : {member.formationSouhaitee || "Non spécifiée"}
                  </p>
                </div>
                <div className="border-t border-[#5C3D2E] pt-4 mt-5 flex justify-between items-center text-[10px] text-[#B89E7E]">
                  <span>Dossiers créés : {rewards.length}</span>
                  <span className="text-emerald-500 font-bold">Progression : {progressRatio}/5</span>
                </div>
              </div>

            </div>

            {/* Circular Progression Jauge Section */}
            <div className="bg-[#2D1A12] border border-[#5C3D2E] p-8 rounded-[40px] shadow-lg flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="space-y-3 max-w-md text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-[#D4AF37] text-[9px] font-bold uppercase tracking-wider">
                  <TrendingUp className="w-3 h-3" /> Objectif de Prospérité
                </div>
                <h3 className="text-2xl font-bold font-dogon text-white">Votre Remplissage de Grenier</h3>
                <p className="text-xs text-[#B89E7E] leading-relaxed">
                  Chaque fois que vous parrainez un filleul et que son inscription est validée (règlement effectué), vous progressez d'un palier. À 5 paliers, une formation de votre choix vous est offerte !
                </p>
                {progressRatio < 5 ? (
                  <p className="text-sm font-bold text-[#D4AF37] pt-2">
                    🌾 Encore {5 - progressRatio} filleul(s) validé(s) avant votre prochaine récompense !
                  </p>
                ) : (
                  <p className="text-sm font-bold text-emerald-500 pt-2">
                    🎉 Félicitations ! Votre compteur est plein, votre dossier de récompense est éligible !
                  </p>
                )}
              </div>

              {/* Radial Progress Graphic */}
              <div className="relative flex items-center justify-center shrink-0">
                <svg height={140} width={140} className="transform -rotate-90">
                  <circle stroke="rgba(255,255,255,0.05)" fill="transparent" strokeWidth={10} r={55} cx={70} cy={70} />
                  <circle
                    stroke="#D4AF37"
                    fill="transparent"
                    strokeWidth={10}
                    strokeDasharray={`${2 * Math.PI * 55} ${2 * Math.PI * 55}`}
                    style={{ strokeDashoffset: (2 * Math.PI * 55) - (progressPercent / 100) * (2 * Math.PI * 55) }}
                    strokeLinecap="round"
                    r={55} cx={70} cy={70}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-bold font-dogon text-white leading-none">{progressRatio} / 5</span>
                  <span className="text-[9px] text-[#B89E7E] font-bold uppercase tracking-wider mt-1">Validés</span>
                </div>
              </div>
            </div>

            {/* Rewards and Filleuls grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              
              {/* Rewards List (6 cols) */}
              <div className="lg:col-span-5 bg-[#2D1A12] border border-[#5C3D2E] p-8 rounded-[40px] flex flex-col h-[420px]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-lg font-dogon text-white">Dossiers de Récompense</h3>
                    <p className="text-[10px] text-[#B89E7E]">Vos droits à formation offerte</p>
                  </div>
                  <Gift className="w-5 h-5 text-[#D4AF37]" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                  {rewards.map((reward) => (
                    <div key={reward.id} className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-white font-mono">{reward.reference}</span>
                        {getRewardStatusBadge(reward.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-[#B89E7E]">
                        <div className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span className="truncate">{reward.trainingId || "Formation à choisir"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#A66037]" />
                          <span className="truncate">{reward.centerId || "Centre à attribuer"}</span>
                        </div>
                        <div className="flex items-center gap-1 col-span-2">
                          <Calendar className="w-3.5 h-3.5 text-white/40" />
                          <span>Validité : {new Date(reward.expiresAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {rewards.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-[#B89E7E] italic text-xs py-10 space-y-2">
                      <Hourglass className="w-8 h-8 text-[#5C3D2E] animate-spin" />
                      <p className="text-center">Aucune récompense générée pour l'instant.<br />Vos filleuls doivent être validés par l'administration.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Filleuls List (7 cols) */}
              <div className="lg:col-span-7 bg-[#2D1A12] border border-[#5C3D2E] p-8 rounded-[40px] flex flex-col h-[420px]">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="font-bold text-lg font-dogon text-white">Vos Filleuls Enregistrés</h3>
                    <p className="text-[10px] text-[#B89E7E]">Candidats parrainés par votre code</p>
                  </div>
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-[#5C3D2E]/40 text-[#B89E7E] text-[9px] uppercase tracking-wider">
                          <th className="pb-3">Nom du Candidat</th>
                          <th className="pb-3">Date</th>
                          <th className="pb-3 text-right">Statut</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#5C3D2E]/20">
                        {attributions.map((att) => (
                          <tr key={att.id} className="text-xs">
                            <td className="py-3.5 font-bold text-white max-w-[150px] truncate">{att.studentName}</td>
                            <td className="py-3.5 text-[#B89E7E]">
                              {att.createdAt ? new Date(att.createdAt).toLocaleDateString('fr-FR') : "--"}
                            </td>
                            <td className="py-3.5 text-right">{getFilleulStatusBadge(att.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    
                    {attributions.length === 0 && (
                      <div className="text-center py-20 text-[#B89E7E] italic text-xs">
                        Aucun filleul enregistré pour le moment.
                      </div>
                    )}
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </div>

      {/* QR Code sharing modal */}
      {showQrModal && member && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xs" onClick={() => setShowQrModal(false)} />
          <div className="relative bg-[#2D1A12] border border-[#5C3D2E] p-8 rounded-[40px] max-w-sm w-full text-center space-y-6 shadow-2xl relative z-10">
            <button 
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-xl text-[#B89E7E] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-full flex items-center justify-center mx-auto border border-[#D4AF37]/20">
              <QrCode className="w-6 h-6 text-[#D4AF37]" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-lg font-dogon text-white uppercase">{member.codeId}</h4>
              <p className="text-xs text-[#B89E7E]">Faites scanner ce QR Code par vos filleuls lors de leur inscription physique ou partagez-le.</p>
            </div>
            
            {/* Generating live QR server image */}
            <div className="bg-white p-4 rounded-3xl inline-block border-4 border-[#D4AF37] shadow-lg">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(referralLink)}`}
                alt="QR Code Parrainage" 
                className="w-[180px] h-[180px]"
              />
            </div>

            <div className="text-[10px] text-[#FAF3E0]/50 font-mono break-all px-4 bg-black/20 py-2.5 rounded-xl border border-white/5 select-all">
              {referralLink}
            </div>

            <Button 
              onClick={handleCopyLink} 
              variant="gold" 
              className="w-full h-12 rounded-xl shadow-gold font-bold cursor-pointer"
            >
              Copier le lien direct
            </Button>
          </div>
        </div>
      )}

    </div>
  );
}
