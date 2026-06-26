"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, increment, updateDoc, deleteDoc, onSnapshot, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { logAction } from "@/lib/audit";

import { verifyReferralCode, createReferralAttribution, updateReferralMemberStats, normalizePhone } from "@/lib/referral";

interface EntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editEntry?: EditableEntry | null;
}

export interface EditableEntry {
  id: string;
  date: string;
  companyId: string;
  session: string;
  localisation: string;
  status: string;
  prochaineAction: string;
  observation: string;
  clientName: string;
  clientContact: string;
  engin: string;
  motif: string;
  totalAmount: number;
  paidAmount: number;
  resteAVerser: number;
  canal: string;
  modePaiement: string;
  hasReferral?: string;
  referralCode?: string;
  referralMemberId?: string;
  referralNote?: string;
  referralMethod?: string;
}

interface Company {
  id: string;
  name: string;
}

interface EntryItem {
  id: string;
  clientName: string;
  clientContact: string;
  engin: string;
  motif: string;
  totalAmount: string;
  paidAmount: string;
  canal: string;
  modePaiement: string;
  hasReferral: string;
  referralCode: string;
  referralMemberId: string;
  referralNote: string;
  referralMethod?: string;
}

const ENGINS_PRICES: Record<string, number> = {
  "Carte Opérateur": 15000,
  "Chariot élévateur": 130000,
  "HSE": 130000,
  "Anglais Minier": 150000,
  "Bobcat": 150000,
  "Pelle hydraulique": 195000,
  "Chargeuse": 195000,
  "Échafaudage": 200000,
  "Sino-Truk": 230000,
  "Challenger": 245000,
  "Grue Mobile": 245000,
  "Grue Auxiliaire": 250000,
  "Malaxeur": 250000,
  "Tombereau Articulé": 295000,
  "Tombereau Rigide": 295000,
};

const createEmptyItem = (): EntryItem => ({
  id: Math.random().toString(),
  clientName: "",
  clientContact: "",
  engin: "",
  motif: "",
  totalAmount: "",
  paidAmount: "",
  canal: "Direct",
  modePaiement: "Espèces",
  hasReferral: "Non",
  referralCode: "",
  referralMemberId: "",
  referralNote: "",
  referralMethod: "manual"
});

const EntryModal = ({ isOpen, onClose, editEntry }: EntryModalProps) => {
  const { profile } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currency, setCurrency] = useState("FCFA");

  // Referral Module States
  const [verificationStates, setVerificationStates] = useState<Record<string, {
    status: "valid" | "not_found" | "suspended" | "campaign_ended" | "self_referral" | "duplicate";
    message: string;
    member?: any;
    codeDoc?: any;
  }>>({});
  const [existingAttribution, setExistingAttribution] = useState<any>(null);
  const [modificationReason, setModificationReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearchingReferral, setIsSearchingReferral] = useState<Record<string, boolean>>({});
  const [showQRScannerSim, setShowQRScannerSim] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "enterprise"), (docSnap) => {
      if (docSnap.exists()) {
        setCurrency(docSnap.data().currency || "FCFA");
      }
    });
    return () => unsub();
  }, []);

  // Common Info
  const [commonData, setCommonData] = useState({
    date: new Date().toISOString().split('T')[0],
    companyId: "",
    session: "Matin",
    localisation: "Abidjan",
    status: "Confirmé",
    prochaineAction: "",
    observation: ""
  });

  // Individual Entries
  const [items, setItems] = useState<EntryItem[]>([createEmptyItem()]);

  // If editing, populate form
  useEffect(() => {
    const loadData = async () => {
      if (editEntry && isOpen) {
        setCommonData({
          date: editEntry.date || new Date().toISOString().split('T')[0],
          companyId: editEntry.companyId || "",
          session: editEntry.session || "Matin",
          localisation: editEntry.localisation || "Abidjan",
          status: editEntry.status || "Confirmé",
          prochaineAction: editEntry.prochaineAction || "",
          observation: editEntry.observation || ""
        });

        let hasRef = "Non";
        let code = "";
        let memberId = "";
        let note = "";
        let method = "manual";

        try {
          const q = query(
            collection(db, "referral_attributions"),
            where("entryId", "==", editEntry.id)
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const attrDoc = snap.docs[0];
            const attrData = attrDoc.data();
            setExistingAttribution({ id: attrDoc.id, ...attrData });
            hasRef = "Oui";
            code = attrData.referralCodeId || "";
            memberId = attrData.referralMemberId || "";
            note = attrData.note || "";
            method = attrData.attributionMethod || "manual";

            // Vérifier et charger les infos du parrain
            const verifyRes = await verifyReferralCode(code, editEntry.clientContact);
            setVerificationStates({
              [editEntry.id]: {
                status: verifyRes.status,
                message: verifyRes.message,
                member: verifyRes.member,
                codeDoc: verifyRes.codeDoc
              }
            });
          } else {
            setExistingAttribution(null);
            setVerificationStates({});
          }
        } catch (e) {
          console.error("Error loading existing referral attribution:", e);
        }

        setItems([{
          id: editEntry.id,
          clientName: editEntry.clientName || "",
          clientContact: editEntry.clientContact || "",
          engin: editEntry.engin || "",
          motif: editEntry.motif || "",
          totalAmount: String(editEntry.totalAmount || ""),
          paidAmount: String(editEntry.paidAmount || ""),
          canal: editEntry.canal || "Direct",
          modePaiement: editEntry.modePaiement || "Espèces",
          hasReferral: hasRef,
          referralCode: code,
          referralMemberId: memberId,
          referralNote: note,
          referralMethod: method
        }]);
      } else if (!editEntry && isOpen) {
        // Reset for new entry
        setCommonData({
          date: new Date().toISOString().split('T')[0],
          companyId: companies.length > 0 ? companies[0].name : "",
          session: "Matin",
          localisation: "Abidjan",
          status: "Confirmé",
          prochaineAction: "",
          observation: ""
        });
        setItems([createEmptyItem()]);
        setExistingAttribution(null);
        setVerificationStates({});
        setModificationReason("");
      }
    };
    loadData();
  }, [editEntry, isOpen, companies.length]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const q = query(collection(db, "companies"), orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setCompanies(list);

        if (!editEntry) {
          // Pré-sélection intelligente :
          // 1. Si la commerciale a des entreprises assignées → prendre la première
          // 2. Sinon → prendre la première de la liste alphabétique
          const userCompanyNames = (profile?.companies || []) as string[];

          let defaultCompany = "";
          if (userCompanyNames.length > 0) {
            // Chercher le nom de l'entreprise correspondant à l'ID ou nom stocké
            const matched = list.find(c =>
              userCompanyNames.includes(c.id) || userCompanyNames.includes(c.name)
            );
            defaultCompany = matched ? matched.name : (list[0]?.name || "");
          } else {
            defaultCompany = list[0]?.name || "";
          }

          if (defaultCompany) {
            setCommonData(prev => ({ ...prev, companyId: prev.companyId || defaultCompany }));
          }
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    if (isOpen) fetchCompanies();
  }, [isOpen, profile?.companies]);


  const handleCheckCode = async (item: EntryItem) => {
    if (!item.referralCode.trim()) {
      toast.error("Veuillez saisir un code.");
      return;
    }
    const result = await verifyReferralCode(item.referralCode, item.clientContact);
    setVerificationStates(prev => ({
      ...prev,
      [item.id]: {
        status: result.status,
        message: result.message,
        member: result.member,
        codeDoc: result.codeDoc
      }
    }));
    if (result.status === "valid") {
      updateItem(item.id, 'referralMemberId', result.member.id);
      toast.success("Code valide ! Parrain identifié.");
    } else {
      updateItem(item.id, 'referralMemberId', "");
      toast.error(result.message);
    }
  };

  const handleSearchReferrals = async (itemId: string, queryText: string) => {
    if (!queryText.trim()) {
      setSearchResults([]);
      return;
    }
    try {
      const q = query(collection(db, "referral_members"));
      const snap = await getDocs(q);
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filtered = list.filter((m: any) => {
        const nom = (m.nom || "").toLowerCase();
        const prenom = (m.prenom || "").toLowerCase();
        const tel = (m.telephoneNormalise || "").toLowerCase();
        const code = (m.codeId || "").toLowerCase();
        const text = queryText.toLowerCase();
        return nom.includes(text) || prenom.includes(text) || tel.includes(text) || code.includes(text);
      });
      setSearchResults(filtered);
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de la recherche des parrains.");
    }
  };

  useGSAP(() => {
    if (isOpen) {
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3 });
      gsap.fromTo(contentRef.current, 
        { scale: 0.9, opacity: 0, y: 30 },
        { scale: 1, opacity: 1, y: 0, duration: 0.6, ease: "power4.out" }
      );
    }
  }, { dependencies: [isOpen] });

  const addItem = () => {
    setItems([...items, createEmptyItem()]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof EntryItem, value: string) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleDelete = async () => {
    if (!editEntry) return;
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette saisie ?")) return;
    
    setLoading(true);
    try {
      await deleteDoc(doc(db, "daily_entries", editEntry.id));
      
      // Nettoyer le parrainage associé
      if (existingAttribution) {
        await deleteDoc(doc(db, "referral_attributions", existingAttribution.id));
        await updateReferralMemberStats(existingAttribution.referralMemberId);
      }

      // Decrement user's entriesCount
      const creatorUid = (editEntry as any).createdBy;
      if (creatorUid) {
        await updateDoc(doc(db, "users", creatorUid), {
          entriesCount: increment(-1)
        }).catch(() => {});
      }

      await logAction(
        profile?.uid,
        profile?.email,
        "sale_delete",
        `Suppression de la saisie pour ${editEntry.clientName} (${Number(editEntry.totalAmount).toLocaleString()} ${currency}, filiale: ${editEntry.companyId})`,
        editEntry.companyId
      );
      toast.success("Saisie supprimée avec succès !");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Validation de sécurité côté client
    for (const item of items) {
      if (item.hasReferral === "Oui") {
        if (!item.referralMemberId) {
          toast.error(`Veuillez vérifier et rattacher le code parrain pour ${item.clientName || 'l\'apprenant'}.`);
          setLoading(false);
          return;
        }
      }
    }

    // 2. Motif obligatoire si modification du parrainage existant
    if (editEntry && existingAttribution) {
      const item = items[0];
      const hasChangedReferral = (item.hasReferral === "Oui" && item.referralCode !== existingAttribution.referralCodeId) || 
                                 (item.hasReferral !== "Oui");
      if (hasChangedReferral && !modificationReason.trim()) {
        toast.error("Veuillez renseigner le motif de modification du parrainage.");
        setLoading(false);
        return;
      }
    }

    try {
      if (editEntry) {
        // Update existing entry
        const item = items[0];
        const total = Number(item.totalAmount) || 0;
        const paid = Number(item.paidAmount) || 0;
        
        await updateDoc(doc(db, "daily_entries", editEntry.id), {
          ...commonData,
          clientName: item.clientName,
          clientContact: item.clientContact,
          engin: item.engin,
          motif: item.motif,
          totalAmount: total,
          paidAmount: paid,
          resteAVerser: total - paid,
          canal: item.canal,
          modePaiement: item.modePaiement,
          updatedAt: new Date().toISOString()
        });

        // Gestion du parrainage lors de l'édition
        const hasChangedReferral = (item.hasReferral === "Oui" && item.referralCode !== existingAttribution?.referralCodeId) || 
                                   (item.hasReferral !== "Oui" && existingAttribution);

        if (existingAttribution && hasChangedReferral) {
          await logAction(
            profile?.uid,
            profile?.email,
            "referral_update",
            `Modification parrainage pour l'inscrit ${item.clientName}. Ancien code: ${existingAttribution.referralCodeId}, Nouveau: ${item.referralCode || 'Aucun'}. Motif: ${modificationReason}`,
            commonData.companyId
          );

          if (item.hasReferral === "Oui" && item.referralMemberId) {
            const vState = verificationStates[item.id];
            const campaignId = vState?.codeDoc?.campaignId || "campagne_2026";
            const codeId = vState?.codeDoc?.code || item.referralCode.trim().toUpperCase();

            await updateDoc(doc(db, "referral_attributions", existingAttribution.id), {
              referralMemberId: item.referralMemberId,
              referralCodeId: codeId,
              campaignId: campaignId,
              note: item.referralNote || "",
              status: commonData.status,
              updatedAt: new Date().toISOString()
            });

            await addDoc(collection(db, "referral_status_history"), {
              attributionId: existingAttribution.id,
              previousStatus: existingAttribution.status,
              newStatus: commonData.status,
              changedBy: profile?.uid || "anonymous",
              reason: `Modification parrainage: ${modificationReason}`,
              createdAt: new Date().toISOString()
            });

            await updateReferralMemberStats(existingAttribution.referralMemberId);
            await updateReferralMemberStats(item.referralMemberId);
          } else {
            // Suppression du parrainage
            await deleteDoc(doc(db, "referral_attributions", existingAttribution.id));
            await updateReferralMemberStats(existingAttribution.referralMemberId);
          }
        } else if (!existingAttribution && item.hasReferral === "Oui" && item.referralMemberId) {
          // Nouveau parrainage rajouté en édition
          const vState = verificationStates[item.id];
          const campaignId = vState?.codeDoc?.campaignId || "campagne_2026";
          const codeId = vState?.codeDoc?.code || item.referralCode.trim().toUpperCase();

          await createReferralAttribution({
            entryId: editEntry.id,
            studentName: item.clientName,
            studentPhone: item.clientContact,
            referralMemberId: item.referralMemberId,
            referralCodeId: codeId,
            campaignId: campaignId,
            attributionMethod: (item.referralMethod as any) || "manual",
            recordedBy: profile?.uid || "anonymous",
            recordedByName: profile?.displayName || "Agent Commercial",
            status: commonData.status,
            note: item.referralNote || ""
          });
        } else if (existingAttribution && existingAttribution.status !== commonData.status) {
          // Statut modifié, on répercute sur l'attribution et recalcule
          await updateDoc(doc(db, "referral_attributions", existingAttribution.id), {
            status: commonData.status,
            updatedAt: new Date().toISOString()
          });

          await addDoc(collection(db, "referral_status_history"), {
            attributionId: existingAttribution.id,
            previousStatus: existingAttribution.status,
            newStatus: commonData.status,
            changedBy: profile?.uid || "anonymous",
            reason: "Mise à jour suite au changement de statut de la fiche",
            createdAt: new Date().toISOString()
          });

          await updateReferralMemberStats(existingAttribution.referralMemberId);
        }
        
        await logAction(
          profile?.uid,
          profile?.email,
          "sale_update",
          `Mise à jour de la saisie pour ${item.clientName} (${total.toLocaleString()} ${currency}, versé: ${paid.toLocaleString()} ${currency})`,
          commonData.companyId
        );

        toast.success("Saisie mise à jour !");
      } else {
        // Create new entries
        const promises = items.map(item => {
          const total = Number(item.totalAmount) || 0;
          const paid = Number(item.paidAmount) || 0;
          return addDoc(collection(db, "daily_entries"), {
            ...commonData,
            clientName: item.clientName,
            clientContact: item.clientContact,
            engin: item.engin,
            motif: item.motif,
            totalAmount: total,
            paidAmount: paid,
            resteAVerser: total - paid,
            canal: item.canal,
            modePaiement: item.modePaiement,
            createdAt: new Date().toISOString(),
            serverTimestamp: serverTimestamp(),
            createdBy: profile?.uid || "",
            createdByEmail: profile?.email || "",
            createdByName: profile?.displayName || "Inconnu"
          }).then(async (docRef) => {
            await logAction(
              profile?.uid,
              profile?.email,
              "sale_create",
              `Création de la saisie pour ${item.clientName} (${total.toLocaleString()} ${currency}, versé: ${paid.toLocaleString()} ${currency})`,
              commonData.companyId
            );

            // Rattachement si code parrain fourni
            if (item.hasReferral === "Oui" && item.referralMemberId) {
              const vState = verificationStates[item.id];
              const campaignId = vState?.codeDoc?.campaignId || "campagne_2026";
              const codeId = vState?.codeDoc?.code || item.referralCode.trim().toUpperCase();

              await createReferralAttribution({
                entryId: docRef.id,
                studentName: item.clientName,
                studentPhone: item.clientContact,
                referralMemberId: item.referralMemberId,
                referralCodeId: codeId,
                campaignId: campaignId,
                attributionMethod: (item.referralMethod as any) || "manual",
                recordedBy: profile?.uid || "anonymous",
                recordedByName: profile?.displayName || "Agent Commercial",
                status: commonData.status,
                note: item.referralNote || ""
              });
            }

            return docRef;
          });
        });

        await Promise.all(promises);
        
        // Update user's entriesCount
        if (profile?.uid) {
          const userRef = doc(db, "users", profile.uid);
          await updateDoc(userRef, {
            entriesCount: increment(items.length)
          }).catch(() => {});
        }
        
        toast.success(`${items.length} saisie(s) enregistrée(s) !`);
      }
      
      onClose();
      setItems([createEmptyItem()]);
    } catch (error: unknown) {
      console.error(error);
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const isEditing = !!editEntry;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-[#1A0F0A]/60 backdrop-blur-md opacity-0"
        onClick={onClose}
      />
      
      <div 
        ref={contentRef}
        className="relative bg-[#FAF3E0] w-full max-w-6xl max-h-[95vh] rounded-[48px] shadow-2xl border border-white/20 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-[#5C3D2E] p-6 text-[#FAF3E0] flex justify-between items-center relative shrink-0">
          <div className="absolute inset-0 dogon-pattern opacity-10" />
          <div className="relative z-10 flex items-center gap-4">
             <div className="w-12 h-12 bg-[#D4AF37] rounded-2xl flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-[#5C3D2E]" />
             </div>
             <div>
                <h2 className="text-2xl font-bold font-dogon tracking-tight">
                  {isEditing ? "Modifier la Saisie" : "Nouvelle Saisie Groupée"}
                </h2>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#D4AF37]">
                  {isEditing ? "Mise à jour des données" : "Enregistrez plusieurs personnes en une fois"}
                </p>
             </div>
          </div>
          <button type="button" onClick={onClose} className="relative z-10 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-all">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
           <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Common Fields Row */}
              <div className="bg-white/50 p-6 rounded-[32px] border border-[#E8DCC4] grid grid-cols-1 md:grid-cols-5 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Date</label>
                    <input 
                      type="date" 
                      value={commonData.date}
                      onChange={(e) => setCommonData({...commonData, date: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm outline-none transition-all" 
                    />
                 </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Filiale</label>
                     {profile?.role === "commerciale" && companies.length > 0 ? (
                       // Commerciale : affichage fixe de son entreprise, non modifiable
                       <div className="w-full px-4 py-3 rounded-xl bg-[#FAF3E0] border border-[#E8DCC4] font-bold text-sm text-[#5C3D2E] flex items-center gap-2">
                         <span className="w-2 h-2 bg-[#D4AF37] rounded-full" />
                         {commonData.companyId || (profile.company ? profile.company : companies[0]?.name) || "GALF FORMATION"}
                       </div>
                     ) : (
                       <select 
                         value={commonData.companyId}
                         onChange={(e) => setCommonData({...commonData, companyId: e.target.value})}
                         className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm appearance-none outline-none transition-all"
                       >
                          {companies.length === 0 && <option value="">Aucune entreprise</option>}
                          {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                       </select>
                     )}
                  </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Session</label>
                    <select 
                      value={commonData.session}
                      onChange={(e) => setCommonData({...commonData, session: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm outline-none transition-all"
                    >
                       <option>Matin</option>
                       <option>Après-midi</option>
                       <option>Soir</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Localisation</label>
                    <input 
                      value={commonData.localisation}
                      onChange={(e) => setCommonData({...commonData, localisation: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm outline-none transition-all" 
                      placeholder="Abidjan" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Statut</label>
                    <select 
                      value={commonData.status}
                      disabled={profile?.role === "commerciale" && !!editEntry && commonData.status === "inscription validée"}
                      onChange={(e) => setCommonData({...commonData, status: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm outline-none transition-all"
                    >
                       {/* Anciens statuts supportés */}
                       <option value="Confirmé">Confirmé (Ancien)</option>
                       <option value="En attente">En attente (Ancien)</option>
                       <option value="Incomplet">Incomplet (Ancien)</option>
                       {/* Nouveaux statuts requis */}
                       <option value="prospect enregistré">prospect enregistré</option>
                       <option value="inscription en attente">inscription en attente</option>
                       <option value="paiement à vérifier">paiement à vérifier</option>
                       <option value="paiement partiel">paiement partiel</option>
                       <option value="paiement complet">paiement complet</option>
                       <option value="inscription validée">inscription validée</option>
                       <option value="inscription refusée">inscription refusée</option>
                       <option value="inscription annulée">inscription annulée</option>
                       <option value="remboursement effectué">remboursement effectué</option>
                       <option value="fraude suspectée">fraude suspectée</option>
                       <option value="archivée">archivée</option>
                    </select>
                 </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                 <div className="flex justify-between items-center px-2">
                    <h3 className="text-xs font-bold text-[#5C3D2E] uppercase tracking-widest">
                      {isEditing ? "Détails de la Saisie" : "Liste des Personnes"}
                    </h3>
                    {!isEditing && (
                      <button 
                        type="button" 
                        onClick={addItem}
                        className="flex items-center gap-2 px-4 py-2 bg-[#A66037] text-white rounded-xl text-xs font-bold hover:scale-105 transition-all shadow-lg"
                      >
                         <Plus className="w-4 h-4" /> Ajouter une ligne
                      </button>
                    )}
                 </div>

                  <div className="space-y-6">
                     {items.map((item, index) => (
                        <div key={item.id} className="relative bg-white p-6 rounded-[32px] border border-[#E8DCC4] shadow-sm hover:shadow-md transition-shadow space-y-4">
                           {/* Row 1: Nom, Numéro, Engin, Motif */}
                           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest ml-1">Nom *</label>
                                 <input 
                                   required
                                   value={item.clientName}
                                   onChange={(e) => updateItem(item.id, 'clientName', e.target.value)}
                                   className="w-full px-4 py-3 rounded-xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm outline-none transition-all" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest ml-1">Numéro *</label>
                                 <input 
                                   required
                                   type="tel"
                                   value={item.clientContact}
                                   onChange={(e) => updateItem(item.id, 'clientContact', e.target.value)}
                                   placeholder="Ex: +225..."
                                   className="w-full px-4 py-3 rounded-xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm outline-none transition-all" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest ml-1">Engin *</label>
                                 <select 
                                   value={item.engin}
                                   onChange={(e) => {
                                     const enginVal = e.target.value;
                                     updateItem(item.id, 'engin', enginVal);
                                     const price = ENGINS_PRICES[enginVal];
                                     if (price !== undefined) {
                                       updateItem(item.id, 'totalAmount', String(price));
                                     }
                                   }}
                                   className="w-full px-4 py-3 rounded-xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm outline-none transition-all cursor-pointer"
                                 >
                                   <option value="">Sélectionner</option>
                                   {Object.keys(ENGINS_PRICES).map(name => (
                                     <option key={name} value={name}>{name}</option>
                                   ))}
                                   <option value="Autre">Autre / Personnalisé</option>
                                 </select>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest ml-1">Motif</label>
                                 <input 
                                   value={item.motif}
                                   onChange={(e) => updateItem(item.id, 'motif', e.target.value)}
                                   className="w-full px-4 py-3 rounded-xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm outline-none transition-all" 
                                 />
                              </div>
                           </div>

                           {/* Row 2: Total, Versé, Reste, Canal, Paiement */}
                           <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest ml-1">Total *</label>
                                 <input 
                                   type="number"
                                   required
                                   value={item.totalAmount}
                                   onChange={(e) => updateItem(item.id, 'totalAmount', e.target.value)}
                                   className="w-full px-4 py-3 rounded-xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm text-primary outline-none transition-all" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest ml-1">Versé *</label>
                                 <input 
                                   type="number"
                                   required
                                   value={item.paidAmount}
                                   onChange={(e) => updateItem(item.id, 'paidAmount', e.target.value)}
                                   className="w-full px-4 py-3 rounded-xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm text-emerald-600 outline-none transition-all" 
                                 />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest ml-1">Reste à payer</label>
                                 <div className="w-full px-4 py-2.5 rounded-xl bg-red-50 border border-red-100 font-black text-sm text-red-500 h-[46px] flex items-center">
                                    {(Number(item.totalAmount || 0) - Number(item.paidAmount || 0)).toLocaleString()} F
                                 </div>
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest ml-1">Canal</label>
                                 <select 
                                   value={item.canal}
                                   onChange={(e) => updateItem(item.id, 'canal', e.target.value)}
                                   className="w-full px-4 py-3 rounded-xl bg-[#FAF3E0]/30 border border-[#E8DCC4] text-sm font-bold appearance-none outline-none transition-all cursor-pointer"
                                 >
                                    <option>Social</option>
                                    <option>Direct</option>
                                    <option>Referral</option>
                                 </select>
                              </div>
                              <div className="flex gap-2">
                                 <div className="flex-1 space-y-2">
                                    <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest ml-1">Paiement</label>
                                    <select 
                                      value={item.modePaiement}
                                      onChange={(e) => updateItem(item.id, 'modePaiement', e.target.value)}
                                      className="w-full px-3 py-3 rounded-xl bg-[#FAF3E0]/30 border border-[#E8DCC4] text-sm font-bold appearance-none outline-none transition-all cursor-pointer"
                                    >
                                       <option>Espèces</option>
                                       <option>Wave</option>
                                       <option>OM</option>
                                       <option>Momo</option>
                                       <option>Virement</option>
                                       <option>Chèque</option>
                                    </select>
                                 </div>
                                 {items.length > 1 && (
                                    <button 
                                      type="button" 
                                      onClick={() => removeItem(item.id)}
                                      className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center self-end animate-pulse"
                                    >
                                       <Trash2 className="w-4 h-4" />
                                    </button>
                                 )}
                              </div>
                           </div>

                           {/* Section Parrainage */}
                           <div className="mt-6 p-6 rounded-[28px] border border-[#E8DCC4] bg-[#FAF3E0]/30 space-y-4">
                              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                 <div>
                                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1 block mb-1">
                                       L’apprenant possède-t-il un code parrain ? *
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                       {["Non", "Oui", "Ne sait pas", "À vérifier"].map((opt) => (
                                          <button
                                             key={opt}
                                             type="button"
                                             disabled={profile?.role === "commerciale" && isEditing && existingAttribution}
                                             onClick={() => {
                                                updateItem(item.id, 'hasReferral', opt);
                                                if (opt === "Oui" && item.canal !== "Referral") {
                                                   updateItem(item.id, 'canal', "Referral");
                                                }
                                             }}
                                             className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                                                item.hasReferral === opt
                                                   ? "bg-[#5C3D2E] text-white border-[#5C3D2E] shadow-sm"
                                                   : "bg-white text-[#5C3D2E] border-[#E8DCC4] hover:bg-[#FAF3E0]"
                                             }`}
                                          >
                                             {opt}
                                          </button>
                                       ))}
                                    </div>
                                 </div>
                                 
                                 {item.hasReferral === "Oui" && (
                                    <div className="flex gap-2">
                                       <button
                                          type="button"
                                          disabled={profile?.role === "commerciale" && isEditing && existingAttribution}
                                          onClick={() => setIsSearchingReferral(prev => ({ ...prev, [item.id]: !prev[item.id] }))}
                                          className="px-4 py-2 bg-[#FAF3E0] hover:bg-[#E8DCC4]/30 border border-[#E8DCC4] text-[#5C3D2E] rounded-xl text-xs font-bold transition-all shadow-sm"
                                       >
                                          🔍 Rechercher un parrain
                                       </button>
                                       <button
                                          type="button"
                                          disabled={profile?.role === "commerciale" && isEditing && existingAttribution}
                                          onClick={() => setShowQRScannerSim(item.id)}
                                          className="px-4 py-2 bg-white hover:bg-[#FAF3E0] border border-[#E8DCC4] text-[#A66037] rounded-xl text-xs font-bold transition-all shadow-sm"
                                       >
                                          📷 Scanner QR
                                       </button>
                                    </div>
                                 )}
                              </div>

                              {/* Search Drawer Inline */}
                              {isSearchingReferral[item.id] && (
                                 <div className="p-4 bg-white rounded-2xl border border-[#E8DCC4] space-y-3 shadow-inner">
                                    <div className="flex gap-2">
                                       <input
                                          type="text"
                                          placeholder="Rechercher par nom, prénom, code ou téléphone..."
                                          value={searchQuery}
                                          onChange={(e) => {
                                             setSearchQuery(e.target.value);
                                             handleSearchReferrals(item.id, e.target.value);
                                          }}
                                          className="flex-1 px-4 py-2.5 rounded-xl bg-[#FAF3E0]/20 border border-[#E8DCC4] text-xs font-semibold outline-none"
                                       />
                                       <button
                                          type="button"
                                          onClick={() => {
                                             setIsSearchingReferral(prev => ({ ...prev, [item.id]: false }));
                                             setSearchResults([]);
                                             setSearchQuery("");
                                          }}
                                          className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition-all"
                                       >
                                          Annuler
                                       </button>
                                    </div>
                                    <div className="max-h-40 overflow-y-auto space-y-1 custom-scrollbar">
                                       {searchResults.length > 0 ? (
                                          searchResults.map((res: any) => (
                                             <button
                                                key={res.id}
                                                type="button"
                                                onClick={() => {
                                                   updateItem(item.id, 'referralCode', res.codeId);
                                                   updateItem(item.id, 'referralMemberId', res.id);
                                                   updateItem(item.id, 'referralMethod', "search");
                                                   setIsSearchingReferral(prev => ({ ...prev, [item.id]: false }));
                                                   setSearchResults([]);
                                                   setSearchQuery("");
                                                   verifyReferralCode(res.codeId, item.clientContact).then(verifyRes => {
                                                      setVerificationStates(prev => ({
                                                         ...prev,
                                                         [item.id]: {
                                                            status: verifyRes.status,
                                                            message: verifyRes.message,
                                                            member: verifyRes.member,
                                                            codeDoc: verifyRes.codeDoc
                                                         }
                                                      }));
                                                   });
                                                }}
                                                className="w-full text-left px-3 py-2 hover:bg-[#FAF3E0]/50 rounded-lg text-xs font-semibold text-[#5C3D2E] border border-transparent hover:border-[#E8DCC4] transition-all flex justify-between items-center"
                                             >
                                                <span>{res.prenom} {res.nom} ({res.codeId})</span>
                                                <span className="text-[10px] text-[#A66037]">{res.telephoneNormalise}</span>
                                             </button>
                                          ))
                                       ) : searchQuery ? (
                                          <p className="text-center py-4 text-xs text-[#B89E7E] italic">Aucun parrain trouvé.</p>
                                       ) : (
                                          <p className="text-[10px] text-[#B89E7E] italic">Saisissez les premières lettres pour rechercher...</p>
                                       )}
                                    </div>
                                 </div>
                              )}

                              {item.hasReferral === "Oui" && (
                                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                       <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest ml-1">Saisir le Code Parrain</label>
                                       <div className="flex gap-2">
                                          <input
                                             value={item.referralCode}
                                             disabled={profile?.role === "commerciale" && isEditing && existingAttribution}
                                             onChange={(e) => updateItem(item.id, 'referralCode', e.target.value.toUpperCase())}
                                             placeholder="Ex: MAMADOU26"
                                             className="flex-1 px-4 py-3 rounded-xl bg-white border border-[#E8DCC4] font-bold text-sm outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                                          />
                                          <button
                                             type="button"
                                             onClick={() => handleCheckCode(item)}
                                             className="px-4 py-3 bg-[#5C3D2E] text-white font-bold text-xs rounded-xl hover:bg-[#A66037] transition-all shadow-md"
                                          >
                                             Vérifier
                                          </button>
                                       </div>
                                    </div>

                                    <div className="md:col-span-2 bg-white/70 p-4 rounded-xl border border-[#E8DCC4] flex flex-col justify-center text-xs space-y-1.5 min-h-[72px] relative overflow-hidden">
                                       {verificationStates[item.id] ? (
                                          <div className="space-y-1">
                                             <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${verificationStates[item.id].status === "valid" ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
                                                <p className={`font-bold ${verificationStates[item.id].status === "valid" ? "text-emerald-700" : "text-red-500"}`}>
                                                   {verificationStates[item.id].message}
                                                </p>
                                             </div>
                                             {verificationStates[item.id].status === "valid" && verificationStates[item.id].member && (
                                                <div className="text-[10px] text-[#A66037] grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mt-1 pt-1.5 border-t border-[#E8DCC4]/30">
                                                   <p><strong>Parrain</strong> : {verificationStates[item.id].member.prenom} {verificationStates[item.id].member.nom}</p>
                                                   <p><strong>Téléphone</strong> : {verificationStates[item.id].member.telephoneNormalise.replace(/(.{3})(.{3})(.{4})/, "$1 $2 ***")}</p>
                                                   <p><strong>Campagne</strong> : {verificationStates[item.id].codeDoc?.campaignId || "Campagne de test"}</p>
                                                   <p><strong>Progression</strong> : <span className="font-bold text-[#5C3D2E]">{verificationStates[item.id].member.progression} / 5 validés</span></p>
                                                </div>
                                             )}
                                          </div>
                                       ) : (
                                          <p className="text-[#B89E7E] italic">En attente de saisie du code et de vérification...</p>
                                       )}
                                    </div>
                                 </div>
                              )}

                              {item.hasReferral === "Oui" && (
                                 <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest ml-1">Note de Parrainage (facultative)</label>
                                    <input
                                       value={item.referralNote}
                                       disabled={profile?.role === "commerciale" && isEditing && existingAttribution}
                                       onChange={(e) => updateItem(item.id, 'referralNote', e.target.value)}
                                       placeholder="Notes additionnelles (ex: justificatif de contact, relation parrain-filleul...)"
                                       className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                                    />
                                 </div>
                              )}

                              {/* Warning and Reason input for modification of validated referrals */}
                              {isEditing && existingAttribution && (item.referralCode !== existingAttribution.referralCodeId || item.hasReferral === "Non") && (
                                 <div className="p-4 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-800 space-y-2 mt-2">
                                    <p className="font-bold">⚠️ Modification d&apos;attribution détectée</p>
                                    <p className="text-[10px]">Cette action réaffectera l&apos;inscription et recalculera immédiatement la progression du parrain. La trace sera inscrite dans le journal d&apos;audit.</p>
                                    <div className="space-y-1">
                                       <label className="text-[9px] font-bold text-red-600 uppercase tracking-widest">Motif de modification obligatoire *</label>
                                       <input
                                          required
                                          value={modificationReason}
                                          onChange={(e) => setModificationReason(e.target.value)}
                                          placeholder="Ex: Correction erreur de saisie commerciale, ré-attribution suite appel..."
                                          className="w-full px-4 py-2.5 rounded-xl bg-white border border-red-200 text-xs font-semibold outline-none text-[#5C3D2E] focus:ring-2 focus:ring-red-400/20"
                                       />
                                    </div>
                                 </div>
                              )}
                           </div>

                           {/* QR Code Scanner Simulator Overlay */}
                           {showQRScannerSim === item.id && (
                             <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                                <div className="bg-[#FAF3E0] p-6 rounded-[32px] border border-[#E8DCC4] w-full max-w-md space-y-4 shadow-2xl relative text-center">
                                   <h4 className="text-lg font-dogon font-bold text-[#5C3D2E]">Simulateur de Scan QR Code</h4>
                                   <p className="text-xs text-[#B89E7E]">Présentez la preuve de parrainage ou sélectionnez un code détecté :</p>
                                   
                                   <div className="flex flex-col gap-2 pt-2">
                                      {["MAMADOU26", "KADI26", "ADAMA26"].map((seedCode) => (
                                         <button
                                            key={seedCode}
                                            type="button"
                                            onClick={() => {
                                               updateItem(item.id, 'referralCode', seedCode);
                                               updateItem(item.id, 'referralMethod', "qr_code");
                                               setShowQRScannerSim(null);
                                               verifyReferralCode(seedCode, item.clientContact).then(verifyRes => {
                                                  setVerificationStates(prev => ({
                                                     ...prev,
                                                     [item.id]: {
                                                        status: verifyRes.status,
                                                        message: verifyRes.message,
                                                        member: verifyRes.member,
                                                        codeDoc: verifyRes.codeDoc
                                                     }
                                                  }));
                                               });
                                               toast.success(`Code QR ${seedCode} scanné avec succès !`);
                                            }}
                                            className="w-full py-3 bg-white hover:bg-[#FAF3E0] border border-[#E8DCC4] text-xs font-bold text-[#5C3D2E] rounded-xl hover:scale-[1.02] transition-all flex justify-between px-6 cursor-pointer"
                                         >
                                            <span>Code Parrain: <strong>{seedCode}</strong></span>
                                            <span className="text-[10px] text-[#A66037]">{seedCode === "ADAMA26" ? "🔴 Suspendu" : "🟢 Actif"}</span>
                                         </button>
                                      ))}
                                   </div>
                                   
                                   <div className="border-t border-[#E8DCC4] pt-4 flex gap-2">
                                      <button
                                         type="button"
                                         onClick={() => setShowQRScannerSim(null)}
                                         className="flex-1 py-3 bg-[#5C3D2E] text-white text-xs font-bold rounded-xl hover:bg-[#A66037] transition-colors cursor-pointer"
                                      >
                                         Fermer
                                      </button>
                                   </div>
                                </div>
                             </div>
                           )}
                        </div>
                     ))}
                  </div>
              </div>

              {/* Action Fields (shared) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Prochaine Action Globale</label>
                    <input 
                      value={commonData.prochaineAction}
                      onChange={(e) => setCommonData({...commonData, prochaineAction: e.target.value})}
                      className="w-full px-4 py-4 rounded-2xl bg-white border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm outline-none transition-all" 
                      placeholder="Ex: Confirmer les livraisons demain" 
                    />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Observations Générales</label>
                    <input 
                      value={commonData.observation}
                      onChange={(e) => setCommonData({...commonData, observation: e.target.value})}
                      className="w-full px-4 py-4 rounded-2xl bg-white border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm outline-none transition-all" 
                      placeholder="Note particulière..." 
                    />
                 </div>
              </div>

              {/* Submit Footer - NO LONGER position:fixed! */}
              <div className="sticky bottom-0 p-6 bg-[#FAF3E0]/95 backdrop-blur-md border-t border-[#E8DCC4] -mx-8 -mb-8 flex justify-between items-center gap-4">
                 <div>
                   {isEditing && (
                     <button 
                       type="button" 
                       onClick={handleDelete}
                       disabled={loading}
                       className="px-6 h-14 rounded-2xl bg-red-50 text-red-600 font-bold hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                     >
                       <Trash2 className="w-5 h-5" /> Supprimer
                     </button>
                   )}
                 </div>
                 <div className="flex gap-4">
                   <button 
                     type="button" 
                     onClick={onClose}
                     className="px-8 h-14 rounded-2xl border-2 border-[#E8DCC4] text-[#A66037] font-bold hover:bg-[#E8DCC4]/30 transition-all"
                   >
                     Annuler
                   </button>
                   <button 
                     type="submit" 
                     disabled={loading}
                     className="px-12 h-14 rounded-2xl dogon-gradient text-white font-bold text-lg shadow-xl disabled:opacity-50 flex items-center gap-3 hover:shadow-2xl transition-all"
                   >
                     {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Save className="w-6 h-6" /> {isEditing ? "Mettre à jour" : `Enregistrer ${items.length} Saisie(s)`}</>}
                   </button>
                 </div>
              </div>
           </form>
        </div>
      </div>
    </div>
  );
};

export default EntryModal;
