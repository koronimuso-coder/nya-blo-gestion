"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, Save, Plus, Trash2, Sparkles, Loader2 } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, doc, increment, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { logAction } from "@/lib/audit";

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
  modePaiement: "Espèces"
});

const EntryModal = ({ isOpen, onClose, editEntry }: EntryModalProps) => {
  const { profile } = useAuth();
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [currency, setCurrency] = useState("FCFA");

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
      setItems([{
        id: editEntry.id,
        clientName: editEntry.clientName || "",
        clientContact: editEntry.clientContact || "",
        engin: editEntry.engin || "",
        motif: editEntry.motif || "",
        totalAmount: String(editEntry.totalAmount || ""),
        paidAmount: String(editEntry.paidAmount || ""),
        canal: editEntry.canal || "Direct",
        modePaiement: editEntry.modePaiement || "Espèces"
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
    }
  }, [editEntry, isOpen]);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const q = query(collection(db, "companies"), orderBy("name", "asc"));
        const snapshot = await getDocs(q);
        const list = snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
        setCompanies(list);
        if (list.length > 0 && !commonData.companyId && !editEntry) {
           setCommonData(prev => ({ ...prev, companyId: list[0].name }));
        }
      } catch (error) {
        console.error("Error fetching companies:", error);
      }
    };
    if (isOpen) fetchCompanies();
  }, [isOpen]);

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
            return docRef;
          });
        });

        await Promise.all(promises);
        
        // Update user's entriesCount
        if (profile?.uid) {
          const userRef = doc(db, "users", profile.uid);
          await updateDoc(userRef, {
            entriesCount: increment(items.length)
          }).catch(() => {}); // silently fail if user doc doesn't have field
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
              <div className="bg-white/50 p-6 rounded-[32px] border border-[#E8DCC4] grid grid-cols-1 md:grid-cols-4 gap-6">
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
                    <select 
                      value={commonData.companyId}
                      onChange={(e) => setCommonData({...commonData, companyId: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-bold text-sm appearance-none outline-none transition-all"
                    >
                       {companies.length === 0 && <option value="">Aucune entreprise</option>}
                       {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
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
