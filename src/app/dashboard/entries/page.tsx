"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Search, 
  Target,
  LayoutGrid,
  TrendingUp,
  Plus,
  Loader2,
  AlertCircle,
  Edit3,
  Trash2,
  MoreVertical,
  Eye,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import EntryModal, { type EditableEntry } from "@/components/dashboard/EntryModal";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { collection, query, onSnapshot, orderBy, deleteDoc, doc, increment, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { logAction } from "@/lib/audit";

interface Entry {
  id: string;
  date: string;
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

export default function EntriesPage() {
  const { profile } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editEntry, setEditEntry] = useState<EditableEntry | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const container = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currency, setCurrency] = useState("FCFA");

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "enterprise"), (docSnap) => {
      if (docSnap.exists()) {
        setCurrency(docSnap.data().currency || "FCFA");
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "daily_entries"), orderBy("date", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => {
        const data = doc.data();
        const total = Number(data.totalAmount || 0);
        const paid = Number(data.paidAmount || 0);
        return {
          id: doc.id,
          ...data,
          totalAmount: total,
          paidAmount: paid,
          resteAVerser: data.resteAVerser != null ? Number(data.resteAVerser) : (total - paid),
        } as Entry;
      });
      setEntries(docs);
      setLoading(false);
    }, (error) => {
       console.error("Entries data fetch error:", error);
       setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    if (activeDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [activeDropdown]);

  const filteredEntries = entries
    .filter(e => {
      if (profile?.role === "commerciale") {
        return e.createdBy === profile?.uid;
      }
      return true;
    })
    .filter(e => 
      e.clientName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.companyId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.canal?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  useGSAP(() => {
    if (!loading) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".page-header", { y: -20, opacity: 0, duration: 0.8 });
      tl.from(".stats-bar", { y: 20, opacity: 0, duration: 0.8 }, "-=0.4");
      tl.from(".table-row", { opacity: 0, y: 10, stagger: 0.05, duration: 0.4 });
    }
  }, { scope: container, dependencies: [loading] });

  const handleEdit = (entry: Entry) => {
    setEditEntry(entry as EditableEntry);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (entryId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette saisie ?")) return;
    const entry = entries.find(e => e.id === entryId);
    const clientName = entry ? entry.clientName : "Inconnu";
    const amount = entry ? entry.totalAmount : 0;
    const company = entry ? entry.companyId : "global";
    try {
      await deleteDoc(doc(db, "daily_entries", entryId));
      
      // Decrement user's entriesCount
      const creatorUid = entry?.createdBy;
      if (creatorUid) {
        await updateDoc(doc(db, "users", creatorUid), {
          entriesCount: increment(-1)
        }).catch(() => {});
      }

      await logAction(
        profile?.uid,
        profile?.email,
        "sale_delete",
        `Suppression de la saisie pour ${clientName} (${amount.toLocaleString()} ${currency}, filiale: ${company})`,
        company
      );
      toast.success("Saisie supprimée !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    }
    setActiveDropdown(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditEntry(null);
  };

  const [generatingReceiptId, setGeneratingReceiptId] = useState<string | null>(null);

  const handleGenerateReceipt = async (entry: Entry) => {
    setGeneratingReceiptId(entry.id);
    try {
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;
      
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const currencyStr = currency || "FCFA";
      const receiptRef = `REC-${entry.id.substring(0, 8).toUpperCase()}`;

      // Border lines
      doc.setDrawColor(212, 175, 55); // Gold
      doc.setLineWidth(1.5);
      doc.rect(8, 8, 194, 281);
      
      doc.setDrawColor(92, 61, 46); // Deep Clay
      doc.setLineWidth(0.5);
      doc.rect(10, 10, 190, 277);

      // Header block
      doc.setFillColor(92, 61, 46);
      doc.rect(12, 12, 186, 36, "F");

      doc.setFillColor(212, 175, 55);
      doc.rect(12, 45, 186, 3, "F");

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.text("NYA BLO GESTION", 20, 28);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(212, 175, 55);
      doc.text("SAGE ET CONSOLIDÉ • SYSTÈME DE COMMERCE TENANT", 20, 36);

      // Receipt Title Block
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text("REÇU DE PAIEMENT", 130, 26);
      
      doc.setFontSize(9);
      doc.text(`Réf : ${receiptRef}`, 130, 34);
      doc.setFont("helvetica", "normal");
      doc.text(`Date : ${entry.date ? new Date(entry.date).toLocaleDateString("fr-FR") : "--"}`, 130, 40);

      doc.setTextColor(45, 26, 18);

      // Metadata cards
      doc.setFillColor(250, 243, 224);
      doc.rect(15, 56, 85, 34, "F");
      doc.setDrawColor(232, 220, 196);
      doc.rect(15, 56, 85, 34);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("ÉMETTEUR (FILIALE) :", 20, 63);
      doc.setFontSize(12);
      doc.setTextColor(92, 61, 46);
      doc.text(String(entry.companyId || "NYA BLO").toUpperCase(), 20, 71);
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("Enregistré par l'agent :", 20, 78);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(45, 26, 18);
      doc.text(entry.createdByName || entry.createdByEmail || "Agent Commercial", 20, 83);

      // Client Card
      doc.setFillColor(250, 243, 224);
      doc.rect(110, 56, 85, 34, "F");
      doc.rect(110, 56, 85, 34);
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(45, 26, 18);
      doc.text("CLIENT :", 115, 63);
      doc.setFontSize(12);
      doc.setTextColor(92, 61, 46);
      doc.text(String(entry.clientName || "Client inconnu").toUpperCase(), 115, 71);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(45, 26, 18);
      doc.text(`Contact : ${entry.clientContact || "Non renseigné"}`, 115, 79);
      doc.text(`Date de Saisie : ${new Date().toLocaleDateString("fr-FR")}`, 115, 84);

      // Transaction section
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(92, 61, 46);
      doc.text("DÉTAIL DE LA TRANSACTION", 15, 105);
      
      doc.setDrawColor(92, 61, 46);
      doc.setLineWidth(0.5);
      doc.line(15, 107, 195, 107);

      const details = [
        { label: "Motif de l'opération", val: entry.motif || "Règlement" },
        { label: "Engin / Matériel concerné", val: entry.engin || "N/A" },
        { label: "Session / Période", val: entry.session || "N/A" },
        { label: "Localisation", val: entry.localisation || "Abidjan" },
        { label: "Mode de Paiement", val: entry.modePaiement || "Espèces" },
        { label: "Canal de Vente", val: entry.canal || "Direct" }
      ];

      let currentY = 116;
      details.forEach((d) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(d.label, 20, currentY);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(45, 26, 18);
        doc.text(String(d.val), 100, currentY);

        doc.setDrawColor(232, 220, 196);
        doc.setLineWidth(0.2);
        doc.line(15, currentY + 3, 195, currentY + 3);
        currentY += 10;
      });

      // Financial calculations card
      currentY += 5;
      doc.setFillColor(250, 243, 224);
      doc.rect(110, currentY, 85, 40, "F");
      doc.setDrawColor(212, 175, 55);
      doc.rect(110, currentY, 85, 40);

      const totalAmount = entry.totalAmount || 0;
      const paidAmount = entry.paidAmount || 0;
      const remains = entry.resteAVerser || 0;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(45, 26, 18);
      
      doc.text("Montant Total :", 115, currentY + 10);
      doc.text(`${totalAmount.toLocaleString()} ${currencyStr}`, 155, currentY + 10);
      
      doc.setTextColor(5, 150, 105);
      doc.text("Montant Versé :", 115, currentY + 20);
      doc.text(`${paidAmount.toLocaleString()} ${currencyStr}`, 155, currentY + 20);

      doc.setDrawColor(212, 175, 55);
      doc.line(115, currentY + 26, 190, currentY + 26);

      if (remains > 0) {
        doc.setTextColor(220, 38, 38);
        doc.text("Reste à Verser :", 115, currentY + 33);
        doc.text(`${remains.toLocaleString()} ${currencyStr}`, 155, currentY + 33);
      } else {
        doc.setTextColor(5, 150, 105);
        doc.text("Statut Financier :", 115, currentY + 33);
        doc.text("SOLDÉ / RÉGLÉ", 155, currentY + 33);
      }

      // Stamps and status banner
      const isPaid = remains <= 0;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      if (isPaid) {
        doc.setDrawColor(5, 150, 105);
        doc.setFillColor(240, 253, 250);
        doc.rect(15, currentY + 5, 80, 20, "F");
        doc.rect(15, currentY + 5, 80, 20);
        doc.setTextColor(5, 150, 105);
        doc.text("PAYÉ / RÉGLÉ", 40, currentY + 18, { align: "center" });
      } else {
        doc.setDrawColor(217, 119, 6);
        doc.setFillColor(255, 251, 235);
        doc.rect(15, currentY + 5, 80, 20, "F");
        doc.rect(15, currentY + 5, 80, 20);
        doc.setTextColor(217, 119, 6);
        doc.text("SOLDE PARTIEL", 40, currentY + 18, { align: "center" });
      }

      // Prochaine Action / Observations
      if (entry.prochaineAction || entry.observation) {
        currentY += 46;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(92, 61, 46);
        doc.text("OBSERVATIONS / ACTION DE SUIVI :", 15, currentY);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        const notes = entry.prochaineAction 
          ? `Action attendue: ${entry.prochaineAction}${entry.observation ? ` | Note: ${entry.observation}` : ""}`
          : entry.observation;
        
        const splitNotes = doc.splitTextToSize(notes, 175);
        doc.text(splitNotes, 15, currentY + 5);
      }

      // Wisdom Dogon Footer
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(166, 96, 55);
      doc.text(
        '" La confiance est le ciment de nos greniers. Merci pour votre fidélité. "',
        100, 255, { align: "center" }
      );

      // Signatures
      doc.setDrawColor(232, 220, 196);
      doc.line(30, 235, 80, 235);
      doc.line(130, 235, 180, 235);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("Signature Client", 55, 240, { align: "center" });
      doc.text("Cachet / Signature Agent", 155, 240, { align: "center" });

      const cleanName = entry.clientName ? entry.clientName.replace(/\s+/g, "_") : "Client";
      doc.save(`RECU_${receiptRef}_${cleanName}.pdf`);
      toast.success("Reçu de paiement téléchargé !");

      await logAction(
        profile?.uid,
        profile?.email,
        "receipt_download",
        `Téléchargement du reçu de paiement pour ${entry.clientName} (Réf: ${receiptRef})`,
        entry.companyId
      ).catch(() => {});

    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la génération du reçu PDF");
    } finally {
      setGeneratingReceiptId(null);
    }
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
       <Loader2 className="w-12 h-12 text-[#A66037] animate-spin mb-4" />
       <p className="text-[#5C3D2E] font-bold">Ouverture des registres...</p>
    </div>
  );

  return (
    <div ref={container} className="space-y-8 pb-12 relative text-[#2D1A12]">
      <div className="absolute inset-0 dogon-pattern opacity-5 pointer-events-none" />
      
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-[#5C3D2E] font-dogon uppercase tracking-tight">Points Journaliers</h1>
          <p className="text-[#B89E7E] mt-1">Données réelles synchronisées en temps réel.</p>
        </div>
        <div className="flex items-center gap-3">
           <Button 
              variant="gold" 
              className="rounded-2xl shadow-gold h-14 relative z-20"
              onClick={() => { setEditEntry(null); setIsModalOpen(true); }}
           >
              <Plus className="w-5 h-5 mr-2" />
              Nouvelle Saisie Réelle
           </Button>
        </div>
      </div>

      <div className="stats-bar grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
         {[
            { label: "Saisies Totales", value: filteredEntries.length.toString(), icon: LayoutGrid, color: "text-[#5C3D2E]" },
            { label: "Total Ventes", value: filteredEntries.reduce((acc, curr) => acc + Number(curr.totalAmount || 0), 0).toLocaleString() + " " + currency, icon: TrendingUp, color: "text-[#A66037]" },
            { label: "Total Encaissé", value: filteredEntries.reduce((acc, curr) => acc + Number(curr.paidAmount || 0), 0).toLocaleString() + " " + currency, icon: Target, color: "text-[#D4AF37]" },
            { label: "Total Reste", value: filteredEntries.reduce((acc, curr) => acc + Number(curr.resteAVerser || 0), 0).toLocaleString() + " " + currency, icon: AlertCircle, color: "text-red-500" },
         ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl shadow-premium border border-[#E8DCC4] flex items-center gap-4 hover:shadow-dogon hover:-translate-y-1 transition-all duration-300">
               <div className="w-12 h-12 bg-[#FAF3E0] rounded-2xl flex items-center justify-center text-[#5C3D2E] border border-[#E8DCC4]">
                  <stat.icon className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest">{stat.label}</p>
                  <p className={`text-lg font-bold font-dogon ${stat.color}`}>{stat.value}</p>
               </div>
            </div>
         ))}
      </div>

      <div className="bg-white rounded-[40px] shadow-premium border border-[#E8DCC4] overflow-hidden relative z-10">
        <div className="p-8 border-b border-[#E8DCC4]/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B89E7E] group-focus-within:text-[#D4AF37] transition-colors" />
            <input 
              type="text" 
              placeholder="Rechercher par client, filiale ou statut..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] text-sm font-medium outline-none transition-all"
            />
          </div>
          <p className="text-sm font-bold text-[#B89E7E]">{filteredEntries.length} résultat(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#FAF3E0]/50 text-[#A66037]">
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Date</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Client</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Entreprise</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Total</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Versé</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Reste</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Paiement</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Canal</th>
                <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-[0.2em]">Statut</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC4]/20">
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="table-row hover:bg-[#FAF3E0]/30 transition-colors group">
                  <td className="px-8 py-6 font-bold text-[#5C3D2E] text-sm whitespace-nowrap">
                    {entry.date ? new Date(entry.date).toLocaleDateString('fr-FR') : "--"}
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-[#5C3D2E] text-[#FAF3E0] flex items-center justify-center text-[10px] font-bold">
                          {entry.clientName?.substring(0, 2).toUpperCase() || "C"}
                       </div>
                       <span className="font-semibold text-[#2D1A12] text-sm whitespace-nowrap">{entry.clientName || "Client inconnu"}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 bg-[#FAF3E0] rounded-lg text-[10px] font-bold text-[#A66037] uppercase tracking-tight">
                       {entry.companyId}
                    </span>
                  </td>
                  <td className="px-8 py-6 font-bold text-[#5C3D2E] text-sm whitespace-nowrap">{Number(entry.totalAmount).toLocaleString()} {currency}</td>
                  <td className="px-8 py-6 text-emerald-600 font-bold text-sm whitespace-nowrap">{Number(entry.paidAmount).toLocaleString()} {currency}</td>
                  <td className="px-8 py-6 text-red-500 font-bold text-sm whitespace-nowrap">{(entry.resteAVerser || 0).toLocaleString()} {currency}</td>
                  <td className="px-8 py-6">
                     <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                        {entry.modePaiement || "Espèces"}
                     </span>
                  </td>
                  <td className="px-8 py-6">
                     <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold uppercase tracking-tight">
                        {entry.canal || "Direct"}
                     </span>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                       entry.status === 'Confirmé' ? 'bg-emerald-50 text-emerald-700' : 
                       entry.status === 'En attente' ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                       {entry.status || 'Confirmé'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <button 
                      className="p-2 text-[#B89E7E] hover:text-[#D4AF37] transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === entry.id ? null : entry.id);
                      }}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {activeDropdown === entry.id && (
                      <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="dropdown-item" onClick={() => handleGenerateReceipt(entry)} disabled={generatingReceiptId === entry.id}>
                           {generatingReceiptId === entry.id ? (
                             <><Loader2 className="w-4 h-4 animate-spin text-[#A66037]" /> Génération...</>
                           ) : (
                             <><FileText className="w-4 h-4 text-[#A66037]" /> Télécharger Reçu</>
                           )}
                        </button>
                        <button className="dropdown-item" onClick={() => handleEdit(entry)}>
                          <Edit3 className="w-4 h-4" /> Modifier
                        </button>
                        <button className="dropdown-item danger" onClick={() => handleDelete(entry.id)}>
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredEntries.length === 0 && !loading && (
                 <tr>
                    <td colSpan={10} className="px-8 py-20 text-center text-[#B89E7E] italic text-sm">
                       {searchTerm ? `Aucun résultat trouvé pour "${searchTerm}".` : "Aucune saisie enregistrée. Cliquez sur 'Nouvelle Saisie Réelle' pour commencer."}
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <EntryModal isOpen={isModalOpen} onClose={handleCloseModal} editEntry={editEntry} />
    </div>
  );
}
