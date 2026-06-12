"use client";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { X, TrendingUp, Target, AlertCircle, Calendar, Sparkles, Loader2, CreditCard } from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { collection, query, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface UserActivityDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: {
    id: string;
    displayName: string;
    email: string;
    role: string;
  } | null;
}

interface ActivityEntry {
  id: string;
  date: string;
  clientName: string;
  companyId: string;
  totalAmount: number;
  paidAmount: number;
  resteAVerser: number;
  status: string;
  modePaiement: string;
  createdAt: string;
  createdBy?: string;
}

export default function UserActivityDrawer({ isOpen, onClose, user }: UserActivityDrawerProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState("FCFA");

  // Load enterprise settings for currency
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "enterprise"), (docSnap) => {
      if (docSnap.exists()) {
        setCurrency(docSnap.data().currency || "FCFA");
      }
    });
    return () => unsub();
  }, []);

  // Fetch entries created by this user
  useEffect(() => {
    if (!isOpen || !user) return;
    setLoading(true);
    const q = query(collection(db, "daily_entries"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => {
        const data = doc.data();
        const total = Number(data.totalAmount || 0);
        const paid = Number(data.paidAmount || 0);
        return {
          id: doc.id,
          ...data,
          totalAmount: total,
          paidAmount: paid,
          resteAVerser: total - paid,
        } as ActivityEntry;
      });

      // Filter in-memory for creator
      const filtered = allDocs.filter(e => e.createdBy === user.id);
      
      // Sort in-memory descending by date/createdAt
      filtered.sort((a, b) => {
        const timeA = new Date(a.date || a.createdAt || 0).getTime();
        const timeB = new Date(b.date || b.createdAt || 0).getTime();
        return timeB - timeA;
      });

      setEntries(filtered);
      setLoading(false);
    }, (error) => {
      console.error("Error loading user activity:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen, user]);

  // Animate drawer entrance
  useGSAP(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      gsap.to(overlayRef.current, { opacity: 1, duration: 0.3, ease: "power2.out" });
      gsap.to(drawerRef.current, { x: 0, duration: 0.5, ease: "power3.out" });
    } else {
      document.body.style.overflow = "";
      gsap.to(overlayRef.current, { opacity: 0, duration: 0.3, ease: "power2.in" });
      gsap.to(drawerRef.current, { x: "100%", duration: 0.4, ease: "power3.in" });
    }
  }, { dependencies: [isOpen] });

  // Compute Statistics
  const stats = useMemo(() => {
    let sales = 0;
    let collections = 0;
    entries.forEach(e => {
      sales += e.totalAmount;
      collections += e.paidAmount;
    });
    return {
      sales,
      collections,
      pending: sales - collections,
      rate: sales > 0 ? Math.round((collections / sales) * 100) : 0
    };
  }, [entries]);

  if (!isOpen && !user) return null;

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-all ${isOpen ? "pointer-events-auto" : "pointer-events-none"}`}>
      {/* Overlay backdrop */}
      <div 
        ref={overlayRef}
        onClick={onClose}
        className="absolute inset-0 bg-[#1A0F0A]/60 backdrop-blur-sm opacity-0 cursor-pointer"
      />

      {/* Drawer Panel */}
      <div 
        ref={drawerRef}
        className="relative bg-[#FAF3E0] w-full max-w-2xl h-full shadow-2xl border-l border-[#E8DCC4] flex flex-col translate-x-full z-10"
      >
        <div className="absolute inset-0 dogon-pattern opacity-5 pointer-events-none" />

        {/* Header */}
        <div className="bg-[#5C3D2E] p-6 text-[#FAF3E0] flex justify-between items-center shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 dogon-pattern opacity-10" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[#D4AF37] flex items-center justify-center font-bold text-[#5C3D2E] text-xl shadow-md">
              {user?.displayName?.charAt(0) || "U"}
            </div>
            <div>
              <h3 className="text-lg font-bold font-dogon tracking-wide">{user?.displayName}</h3>
              <p className="text-xs text-[#FAF3E0]/70">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="relative z-10 p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar relative z-10">
          
          {/* Performance Overview title */}
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#A66037]" />
            <h4 className="font-bold text-[#5C3D2E] font-dogon text-sm uppercase tracking-wider">Performance Globale</h4>
          </div>

          {/* Performance KPIs Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-[#E8DCC4] flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FAF3E0] rounded-xl flex items-center justify-center text-[#5C3D2E] border border-[#E8DCC4]">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest">Total Ventes</p>
                <p className="text-base font-bold font-dogon text-[#5C3D2E]">{stats.sales.toLocaleString()} {currency}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E8DCC4] flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Target className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest">Encaissé</p>
                <p className="text-base font-bold font-dogon text-emerald-600">{stats.collections.toLocaleString()} {currency}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E8DCC4] flex items-center gap-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600 border border-red-100">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest">Reste à Recouvrer</p>
                <p className="text-base font-bold font-dogon text-red-600">{stats.pending.toLocaleString()} {currency}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-[#E8DCC4] flex items-center gap-4">
              <div className="w-10 h-10 bg-[#FAF3E0] rounded-xl flex items-center justify-center text-[#D4AF37] border border-[#E8DCC4]">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest">Taux de Recouvrement</p>
                <p className="text-base font-bold font-dogon text-[#D4AF37]">{stats.rate}%</p>
              </div>
            </div>
          </div>

          {/* Activity Logs title */}
          <div className="flex items-center justify-between border-t border-[#E8DCC4]/60 pt-6">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#5C3D2E]" />
              <h4 className="font-bold text-[#5C3D2E] font-dogon text-sm uppercase tracking-wider">Historique des Saisies ({entries.length})</h4>
            </div>
          </div>

          {/* Activity List */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-20 flex flex-col justify-center items-center gap-3">
                <Loader2 className="w-8 h-8 text-[#A66037] animate-spin" />
                <p className="text-xs text-[#B89E7E] font-bold uppercase tracking-widest">Chargement des opérations...</p>
              </div>
            ) : entries.length === 0 ? (
              <div className="py-20 bg-white border border-[#E8DCC4] rounded-3xl text-center italic text-[#B89E7E] text-sm">
                Aucune vente enregistrée pour ce collaborateur.
              </div>
            ) : (
              entries.map(entry => (
                <div 
                  key={entry.id}
                  className="bg-white p-5 rounded-3xl border border-[#E8DCC4] hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-[#5C3D2E]">{entry.clientName}</span>
                      <span className="text-[10px] text-[#B89E7E] font-bold uppercase">• {entry.companyId}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#B89E7E]">
                      <span>{entry.date ? new Date(entry.date).toLocaleDateString("fr-FR") : "Date N/A"}</span>
                      <span>•</span>
                      <span>Mode: {entry.modePaiement || "Espèces"}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-3 md:pt-0 border-[#FAF3E0]">
                    <div className="text-left md:text-right">
                      <p className="text-sm font-bold text-[#5C3D2E]">{entry.totalAmount.toLocaleString()} {currency}</p>
                      {entry.resteAVerser > 0 && (
                        <p className="text-[10px] text-red-500 font-bold">Reste: {entry.resteAVerser.toLocaleString()} {currency}</p>
                      )}
                    </div>
                    
                    <span className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider shrink-0 ${
                      entry.status === "Confirmé" 
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                        : entry.status === "Incomplet" 
                          ? "bg-amber-50 text-amber-700 border border-amber-100"
                          : "bg-red-50 text-red-700 border border-red-100"
                    }`}>
                      {entry.status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
