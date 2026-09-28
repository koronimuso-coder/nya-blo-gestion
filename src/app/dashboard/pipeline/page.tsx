"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase/config";
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from "firebase/firestore";
import { 
  Loader2, 
  Search, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  DollarSign, 
  X, 
  Edit3,
  Layers,
  Calendar,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import EntryModal, { type EditableEntry } from "@/components/dashboard/EntryModal";
import { logAction } from "@/lib/audit";
import toast from "react-hot-toast";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface PipelineEntry {
  id: string;
  date: string;
  createdAt?: string;
  clientName: string;
  clientContact: string;
  companyId: string;
  totalAmount: number;
  paidAmount: number;
  resteAVerser: number;
  status: string;
  modePaiement: string;
  canal: string;
  session: string;
  localisation: string;
  prochaineAction: string;
  observation: string;
  engin: string;
  motif: string;
  createdBy?: string;
  createdByName?: string;
  createdByEmail?: string;
}

interface Column {
  id: string;
  title: string;
  statuses: string[];
  color: string;
  borderColor: string;
  bgColor: string;
  icon: React.ElementType;
}

const COLUMNS: Column[] = [
  {
    id: "prospect",
    title: "Prospects Enregistrés",
    statuses: ["prospect enregistré", "en attente", "inscription en attente", "prospect", "nouveau"],
    color: "text-[#A66037]",
    borderColor: "border-[#A66037]/20",
    bgColor: "bg-[#FAF3E0]/40",
    icon: User,
  },
  {
    id: "verif",
    title: "Paiements à Vérifier",
    statuses: ["paiement à vérifier", "incomplet", "à vérifier", "a verifier"],
    color: "text-amber-600",
    borderColor: "border-amber-200",
    bgColor: "bg-amber-50/30",
    icon: AlertCircle,
  },
  {
    id: "partiel",
    title: "Paiements Partiels",
    statuses: ["paiement partiel", "partiel"],
    color: "text-orange-600",
    borderColor: "border-orange-200",
    bgColor: "bg-orange-50/20",
    icon: DollarSign,
  },
  {
    id: "valide",
    title: "Soldés & Validés",
    statuses: ["paiement complet", "inscription validée", "confirmé", "confirme", "validé", "valide", "soldé", "solde"],
    color: "text-emerald-700",
    borderColor: "border-emerald-200",
    bgColor: "bg-emerald-50/20",
    icon: CheckCircle2,
  }
];

const MONTHS_LIST = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

function getEntryYearMonth(entry: { date?: string; createdAt?: string }): { year: number; month: number } | null {
  if (entry.date && typeof entry.date === "string") {
    const parts = entry.date.split("-");
    if (parts.length >= 2) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      if (!isNaN(y) && !isNaN(m)) return { year: y, month: m };
    }
  }
  const dateStr = entry.date || entry.createdAt;
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return { year: d.getFullYear(), month: d.getMonth() };
}

export default function PipelinePage() {
  const { profile } = useAuth();
  const container = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  
  const [entries, setEntries] = useState<PipelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("Toutes");
  const [companies, setCompanies] = useState<string[]>([]);
  const [currency, setCurrency] = useState("FCFA");

  // Period / Month filtering states
  const [selectedPeriod, setSelectedPeriod] = useState<string>("Mois en cours");
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Selection states
  const [selectedEntry, setSelectedEntry] = useState<PipelineEntry | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [draggedOverColumn, setDraggedOverColumn] = useState<string | null>(null);

  // Load currency settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "enterprise"), (docSnap) => {
      if (docSnap.exists()) setCurrency(docSnap.data().currency || "FCFA");
    });
    return () => unsub();
  }, []);

  // Fetch companies list
  useEffect(() => {
    const q = query(collection(db, "companies"), orderBy("name", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setCompanies(snap.docs.map(d => d.data().name as string));
    });
    return () => unsub();
  }, []);

  // Fetch entries in real time with client-side sorting for resilience
  useEffect(() => {
    const q = collection(db, "daily_entries");
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        const total = Number(data.totalAmount || 0);
        const paid = Number(data.paidAmount || 0);
        return {
          id: docSnap.id,
          ...data,
          totalAmount: total,
          paidAmount: paid,
          resteAVerser: data.resteAVerser != null ? Number(data.resteAVerser) : (total - paid),
        } as PipelineEntry;
      });

      // Sort client-side by date desc (fallback to createdAt desc)
      docs.sort((a, b) => {
        const dateA = a.date || a.createdAt || "";
        const dateB = b.date || b.createdAt || "";
        return String(dateB).localeCompare(String(dateA));
      });

      setEntries(docs);
      setLoading(false);
    }, (error) => {
      console.error("Firestore loading error:", error);
      toast.error("Erreur de chargement des fiches du pipeline.");
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Entrance animations using GSAP
  useGSAP(() => {
    if (!loading) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".pipeline-header", { y: -20, opacity: 0, duration: 0.8 });
      tl.from(".pipeline-filters", { y: 15, opacity: 0, duration: 0.7 }, "-=0.5");
      tl.from(".kanban-col", { y: 30, opacity: 0, stagger: 0.1, duration: 0.8 }, "-=0.4");
    }
  }, { scope: container, dependencies: [loading] });

  // Filtered entries
  const filteredEntries = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    const prevDate = new Date(currentYear, currentMonth - 1, 1);
    const prevYear = prevDate.getFullYear();
    const prevMonth = prevDate.getMonth();

    return entries.filter(e => {
      // Role permission check for commerciale
      if (profile?.role === "commerciale") {
        const isOwner = e.createdBy === profile?.uid || (profile?.email && e.createdByEmail === profile?.email);
        if (!isOwner) return false;
      }
      
      // Company check
      if (selectedCompany !== "Toutes" && e.companyId !== selectedCompany) return false;
      
      // Search check
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesSearch = (
          e.clientName?.toLowerCase().includes(q) ||
          e.companyId?.toLowerCase().includes(q) ||
          e.motif?.toLowerCase().includes(q) ||
          e.clientContact?.includes(q) ||
          e.status?.toLowerCase().includes(q)
        );
        if (!matchesSearch) return false;
      }

      // Period & Month check
      if (selectedPeriod !== "Tous les mois") {
        const ym = getEntryYearMonth(e);
        if (!ym) return false;

        if (selectedPeriod === "Mois en cours") {
          if (ym.year !== currentYear || ym.month !== currentMonth) return false;
        } else if (selectedPeriod === "Mois précédent") {
          if (ym.year !== prevYear || ym.month !== prevMonth) return false;
        } else if (selectedPeriod === "Par mois spécifique") {
          if (ym.year !== selectedYear || ym.month !== selectedMonth) return false;
        } else if (selectedPeriod === "Année " + currentYear) {
          if (ym.year !== currentYear) return false;
        }
      }
      
      return true;
    });
  }, [entries, searchTerm, selectedCompany, profile, selectedPeriod, selectedMonth, selectedYear]);

  // Group entries by Column ID (case-insensitive status matching)
  const columnData = useMemo(() => {
    const map: Record<string, PipelineEntry[]> = {
      prospect: [],
      verif: [],
      partiel: [],
      valide: []
    };

    filteredEntries.forEach(entry => {
      const rawStatus = (entry.status || "Confirmé").trim().toLowerCase();
      let matched = false;
      
      for (const col of COLUMNS) {
        if (col.statuses.some(s => s.toLowerCase() === rawStatus)) {
          map[col.id].push(entry);
          matched = true;
          break;
        }
      }
      
      // Fallback to prospect column if status doesn't match predefined list
      if (!matched) {
        map["prospect"].push(entry);
      }
    });

    return map;
  }, [filteredEntries]);

  // Aggregate stats per column
  const columnSums = useMemo(() => {
    const map: Record<string, { total: number; paid: number; count: number }> = {};
    COLUMNS.forEach(col => {
      const list = columnData[col.id] || [];
      const total = list.reduce((sum, item) => sum + item.totalAmount, 0);
      const paid = list.reduce((sum, item) => sum + item.paidAmount, 0);
      map[col.id] = { total, paid, count: list.length };
    });
    return map;
  }, [columnData]);

  // HTML5 Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, entryId: string) => {
    isDraggingRef.current = true;
    e.dataTransfer.setData("text/plain", entryId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragEnd = () => {
    setTimeout(() => {
      isDraggingRef.current = false;
    }, 100);
  };

  const handleCardClick = (entry: PipelineEntry) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    setSelectedEntry(entry);
  };

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault();
    if (draggedOverColumn !== colId) {
      setDraggedOverColumn(colId);
    }
  };

  const handleDragLeave = () => {
    setDraggedOverColumn(null);
  };

  const handleDrop = async (e: React.DragEvent, targetColId: string) => {
    e.preventDefault();
    setDraggedOverColumn(null);
    const entryId = e.dataTransfer.getData("text/plain");
    if (!entryId) return;

    const entry = entries.find(x => x.id === entryId);
    if (!entry) return;

    // Get primary default status for the target column
    const targetStatusMap: Record<string, string> = {
      prospect: "prospect enregistré",
      verif: "paiement à vérifier",
      partiel: "paiement partiel",
      valide: "inscription validée"
    };
    
    const nextStatus = targetStatusMap[targetColId];
    if (!nextStatus || entry.status === nextStatus) return;

    try {
      const entryRef = doc(db, "daily_entries", entryId);
      await updateDoc(entryRef, { 
        status: nextStatus,
        updatedAt: new Date().toISOString()
      });

      // Update local state if needed (handled by real-time listener anyway)
      toast.success(`Statut mis à jour : ${entry.clientName} déplacé vers "${COLUMNS.find(c => c.id === targetColId)?.title}"`);
      
      // Log Action
      await logAction(
        profile?.uid, 
        profile?.email, 
        "sale_status_drag", 
        `Changement de statut (Kanban) pour ${entry.clientName} vers: ${nextStatus}`, 
        entry.companyId
      );
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour du statut.");
    }
  };

  // Status Change Button or Dropdown Handler
  const handleStatusChangeClick = async (entry: PipelineEntry, newStatus: string) => {
    if (!newStatus || entry.status === newStatus) return;
    try {
      const entryRef = doc(db, "daily_entries", entry.id);
      await updateDoc(entryRef, { 
        status: newStatus,
        updatedAt: new Date().toISOString()
      });
      toast.success(`Statut mis à jour pour ${entry.clientName}`);
      if (selectedEntry?.id === entry.id) {
        setSelectedEntry(prev => prev ? { ...prev, status: newStatus } : null);
      }
      await logAction(
        profile?.uid, 
        profile?.email, 
        "sale_status_click", 
        `Changement de statut pour ${entry.clientName} vers: ${newStatus}`, 
        entry.companyId
      );
    } catch (err) {
      console.error(err);
      toast.error("Erreur de mise à jour");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
        <p className="text-[#A66037] font-bold animate-pulse">Ouverture du Pipeline Commercial...</p>
      </div>
    );
  }

  return (
    <div ref={container} className="space-y-8 pb-10 relative text-[#2D1A12]">
      <div className="absolute inset-0 dogon-pattern opacity-5 pointer-events-none" />

      {/* Header */}
      <div className="pipeline-header flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-sm text-[#A66037] font-bold uppercase tracking-[0.2em] mb-1">
            <Layers className="w-4 h-4" /> Forces de Vente / Pipeline
          </div>
          <h1 className="text-3xl font-bold text-primary font-dogon uppercase tracking-tight">
            Pipeline Visuel (Kanban)
          </h1>
          <p className="text-[#B89E7E] mt-1">Gérez le cycle de vie de vos prospects par simple glisser-déposer.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-premium border border-[#E8DCC4]">
          <span className="w-2 h-2 bg-[#D4AF37] rounded-full animate-pulse" />
          <span className="text-xs font-bold text-primary">Vue consolidée</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="pipeline-filters flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl shadow-premium border border-[#E8DCC4] relative z-10">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative min-w-[200px] flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B89E7E] group-focus-within:text-[#D4AF37] transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher un prospect ou client..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] text-xs font-bold outline-none transition-all placeholder-[#B89E7E]"
            />
          </div>

          {/* Company Selector */}
          <select
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            className="px-3.5 py-3 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-colors"
          >
            <option value="Toutes">Toutes les entreprises</option>
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Period Selector (Mois en cours, Mois précédent, Par mois spécifique, Tous les mois) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="pl-9 pr-6 py-3 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-colors"
              >
                <option value="Mois en cours">Mois en cours ({MONTHS_LIST[new Date().getMonth()]})</option>
                <option value="Mois précédent">Mois précédent ({MONTHS_LIST[(new Date().getMonth() + 11) % 12]})</option>
                <option value="Par mois spécifique">Par mois spécifique...</option>
                <option value={`Année ${new Date().getFullYear()}`}>Année {new Date().getFullYear()}</option>
                <option value="Tous les mois">Tous les mois (Historique complet)</option>
              </select>
              <Calendar className="w-4 h-4 text-[#A66037] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* If Specific Month is Selected */}
            {selectedPeriod === "Par mois spécifique" && (
              <div className="flex items-center gap-2 animate-fadeIn">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="px-3 py-3 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer"
                >
                  {MONTHS_LIST.map((m, idx) => (
                    <option key={idx} value={idx}>{m}</option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="px-3 py-3 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer"
                >
                  {[2024, 2025, 2026, 2027, 2028].map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-full bg-[#FAF3E0] border border-[#E8DCC4] text-xs font-bold text-[#A66037] flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#D4AF37]" />
            {filteredEntries.length} dossier(s) • {
              selectedPeriod === "Par mois spécifique" 
                ? `${MONTHS_LIST[selectedMonth]} ${selectedYear}`
                : selectedPeriod
            }
          </div>
        </div>
      </div>

      {/* Kanban Columns container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start relative z-10">
        {COLUMNS.map((col) => {
          const list = columnData[col.id] || [];
          const sums = columnSums[col.id];
          const isOver = draggedOverColumn === col.id;

          return (
            <div 
              key={col.id}
              className={`kanban-col flex flex-col h-[75vh] min-h-[500px] rounded-[36px] border p-5 transition-all duration-300 ${col.bgColor} ${col.borderColor} ${
                isOver ? "ring-4 ring-[#D4AF37]/30 scale-[1.01] bg-[#FAF3E0]" : ""
              }`}
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, col.id)}
            >
              {/* Column Header */}
              <div className="flex justify-between items-start mb-4 pb-3 border-b border-[#E8DCC4]/30">
                <div className="flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg ${col.color} bg-white flex items-center justify-center shadow-sm`}>
                    <col.icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-primary font-dogon tracking-tight">{col.title}</h3>
                    <p className="text-[10px] text-[#B89E7E] font-bold uppercase">{list.length} fiches</p>
                  </div>
                </div>
              </div>

              {/* Financial aggregates */}
              <div className="mb-4 bg-white/70 p-3 rounded-2xl border border-[#E8DCC4]/50 flex justify-between items-center text-[10px] font-bold text-[#A66037]">
                <div>
                  <span className="text-[#B89E7E] block text-[8px] uppercase tracking-wider">Total Ventes</span>
                  {sums.total.toLocaleString()} {currency}
                </div>
                <div className="text-right">
                  <span className="text-[#B89E7E] block text-[8px] uppercase tracking-wider">Encaissé</span>
                  <span className="text-emerald-600">{sums.paid.toLocaleString()} {currency}</span>
                </div>
              </div>

              {/* Cards List */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 custom-scrollbar">
                {list.map((entry) => {
                  const remains = entry.totalAmount - entry.paidAmount;
                  const isPaid = remains <= 0;

                  return (
                    <div
                      key={entry.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, entry.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleCardClick(entry)}
                      className="group/card bg-white p-5 rounded-3xl border border-[#E8DCC4] shadow-sm hover:shadow-premium hover:-translate-y-0.5 cursor-grab active:cursor-grabbing transition-all duration-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2 py-0.5 bg-[#FAF3E0] text-[9px] font-bold text-[#A66037] rounded-md uppercase">
                          {entry.companyId}
                        </span>
                        <span className="text-[9px] font-bold text-[#B89E7E]">
                          {entry.date ? new Date(entry.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : "--"}
                        </span>
                      </div>
                      
                      <h4 className="font-bold text-xs text-primary leading-tight line-clamp-1 mb-1 group-hover/card:text-[#5C3D2E] transition-colors">
                        {entry.clientName}
                      </h4>
                      
                      {entry.clientContact && (
                        <p className="text-[10px] text-[#B89E7E] mb-3">{entry.clientContact}</p>
                      )}

                      <div className="flex justify-between items-end pt-3 border-t border-[#E8DCC4]/20 text-[10px]">
                        <div>
                          <span className="text-[#B89E7E] block text-[8px]">Montant</span>
                          <span className="font-bold">{entry.totalAmount.toLocaleString()} {currency}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[#B89E7E] block text-[8px]">{isPaid ? "Statut" : "Reste"}</span>
                          <span className={`font-bold ${isPaid ? "text-emerald-600" : "text-red-500"}`}>
                            {isPaid ? "SOLDÉ" : `${remains.toLocaleString()} ${currency}`}
                          </span>
                        </div>
                      </div>

                      {entry.prochaineAction && (
                        <div className="mt-3 pt-2 border-t border-dashed border-[#E8DCC4]/30 flex items-center gap-1 text-[9px] text-[#A66037] font-medium truncate">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
                          Suivi : {entry.prochaineAction}
                        </div>
                      )}
                    </div>
                  );
                })}

                {list.length === 0 && (
                  <div className="h-40 border border-dashed border-[#E8DCC4] rounded-3xl flex items-center justify-center text-[#B89E7E] italic text-xs text-center p-6 bg-white/20">
                    Déposer des fiches ici pour changer de statut.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Details Slide-over Drawer */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end font-outfit">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-[#2D1A12]/40 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedEntry(null)}
          />

          {/* Drawer content */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-[#E8DCC4] animate-slide-in">
            {/* Header */}
            <div className="p-6 bg-[#2D1A12] text-[#FAF3E0] flex justify-between items-center">
              <div>
                <p className="text-[10px] text-[#D4AF37] font-bold uppercase tracking-widest">Détails du Prospect</p>
                <h3 className="text-lg font-bold font-dogon mt-1 truncate max-w-[280px]">
                  {selectedEntry.clientName}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="p-2 hover:bg-white/10 rounded-xl text-[#B89E7E] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 relative">
              <div className="absolute inset-0 dogon-pattern opacity-3 pointer-events-none" />

              {/* Status Indicator & Selector */}
              <div className="bg-[#FAF3E0]/50 p-4 rounded-3xl border border-[#E8DCC4]/50 space-y-3 relative z-10">
                <span className="text-[9px] font-bold text-[#B89E7E] uppercase block">Changer le Statut</span>
                <select
                  value={selectedEntry.status || "prospect enregistré"}
                  onChange={(e) => handleStatusChangeClick(selectedEntry, e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#E8DCC4] rounded-xl text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer"
                >
                  <option value="prospect enregistré">Prospect Enregistré</option>
                  <option value="paiement à vérifier">Paiement à Vérifier</option>
                  <option value="paiement partiel">Paiement Partiel</option>
                  <option value="inscription validée">Soldé & Validé</option>
                  <option value="Confirmé">Confirmé</option>
                  <option value="En attente">En attente</option>
                  <option value="Incomplet">Incomplet</option>
                </select>
              </div>

              {/* Financial section */}
              <div className="grid grid-cols-3 gap-4 relative z-10">
                <div className="bg-white border border-[#E8DCC4] p-4 rounded-2xl text-center">
                  <span className="text-[#B89E7E] block text-[9px] font-bold uppercase tracking-wide">Montant</span>
                  <span className="text-sm font-bold text-primary font-dogon mt-1 block">
                    {selectedEntry.totalAmount.toLocaleString()}
                  </span>
                  <span className="text-[8px] font-bold text-[#A66037]">{currency}</span>
                </div>
                <div className="bg-emerald-50/30 border border-emerald-100 p-4 rounded-2xl text-center">
                  <span className="text-emerald-700 block text-[9px] font-bold uppercase tracking-wide">Versé</span>
                  <span className="text-sm font-bold text-emerald-600 font-dogon mt-1 block">
                    {selectedEntry.paidAmount.toLocaleString()}
                  </span>
                  <span className="text-[8px] font-bold text-emerald-600">{currency}</span>
                </div>
                <div className="bg-red-50/30 border border-red-100 p-4 rounded-2xl text-center">
                  <span className="text-red-700 block text-[9px] font-bold uppercase tracking-wide">Reste</span>
                  <span className="text-sm font-bold text-red-500 font-dogon mt-1 block">
                    {(selectedEntry.totalAmount - selectedEntry.paidAmount).toLocaleString()}
                  </span>
                  <span className="text-[8px] font-bold text-red-500">{currency}</span>
                </div>
              </div>

              {/* Transaction details list */}
              <div className="space-y-4 relative z-10">
                <h4 className="font-bold text-xs uppercase tracking-wider text-[#A66037] border-b border-[#E8DCC4] pb-2">Informations Générales</h4>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-[#B89E7E] block text-[10px]">Filiale</span>
                    <span className="font-bold text-primary">{selectedEntry.companyId}</span>
                  </div>
                  <div>
                    <span className="text-[#B89E7E] block text-[10px]">Date d&apos;opération</span>
                    <span className="font-bold text-primary">
                      {selectedEntry.date ? new Date(selectedEntry.date).toLocaleDateString('fr-FR') : "--"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#B89E7E] block text-[10px]">Contact</span>
                    <span className="font-bold text-primary">{selectedEntry.clientContact || "Aucun"}</span>
                  </div>
                  <div>
                    <span className="text-[#B89E7E] block text-[10px]">Canal de vente</span>
                    <span className="font-bold text-primary uppercase">{selectedEntry.canal || "Direct"}</span>
                  </div>
                  <div>
                    <span className="text-[#B89E7E] block text-[10px]">Mode de paiement</span>
                    <span className="font-bold text-primary uppercase">{selectedEntry.modePaiement || "Espèces"}</span>
                  </div>
                  <div>
                    <span className="text-[#B89E7E] block text-[10px]">Session</span>
                    <span className="font-bold text-primary">{selectedEntry.session || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-[#B89E7E] block text-[10px]">Lieu de formation</span>
                    <span className="font-bold text-primary">{selectedEntry.localisation || "Abidjan"}</span>
                  </div>
                  {selectedEntry.engin && (
                    <div>
                      <span className="text-[#B89E7E] block text-[10px]">Engin/Matériel</span>
                      <span className="font-bold text-primary">{selectedEntry.engin}</span>
                    </div>
                  )}
                </div>

                {selectedEntry.motif && (
                  <div className="pt-2">
                    <span className="text-[#B89E7E] block text-[10px]">Motif/Formation</span>
                    <p className="font-bold text-primary text-xs">{selectedEntry.motif}</p>
                  </div>
                )}

                {selectedEntry.prochaineAction && (
                  <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-2xl">
                    <span className="text-[#A66037] font-bold text-[9px] uppercase tracking-wider block">Prochaine action de suivi</span>
                    <p className="text-primary text-xs font-semibold mt-1">{selectedEntry.prochaineAction}</p>
                  </div>
                )}

                {selectedEntry.observation && (
                  <div>
                    <span className="text-[#B89E7E] block text-[10px]">Notes & Observations</span>
                    <p className="text-primary text-xs italic bg-slate-50 p-3 rounded-xl mt-1 border border-slate-100">{selectedEntry.observation}</p>
                  </div>
                )}
              </div>

              {/* Creator details */}
              <div className="pt-4 border-t border-[#E8DCC4]/30 text-[10px] text-[#B89E7E] space-y-1 relative z-10">
                <p>Enregistré par : <span className="font-bold text-primary">{selectedEntry.createdByName || "Site Web GALF"}</span></p>
                <p>Email : {selectedEntry.createdByEmail || "api@galf.ci"}</p>
              </div>
            </div>

            {/* Footer action buttons */}
            <div className="p-6 border-t border-[#E8DCC4] flex gap-3 bg-white">
              <Button 
                variant="gold" 
                className="flex-1 rounded-2xl h-12 shadow-gold cursor-pointer"
                onClick={() => setIsEditModalOpen(true)}
              >
                <Edit3 className="w-4 h-4 mr-2" /> Modifier la Fiche
              </Button>
              <button 
                onClick={() => setSelectedEntry(null)}
                className="px-5 py-3 rounded-2xl border border-[#E8DCC4] text-[#5C3D2E] font-bold text-xs hover:bg-[#FAF3E0] transition-colors cursor-pointer"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reuse standard EditModal */}
      {isEditModalOpen && selectedEntry && (
        <EntryModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          editEntry={selectedEntry as EditableEntry}
        />
      )}
    </div>
  );
}
