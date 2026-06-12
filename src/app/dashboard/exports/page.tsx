"use client";

import React, { useState, useRef } from "react";
import { 
  FileText, 
  Mail, 
  Share2, 
  FileSpreadsheet,
  Clock,
  ArrowRight,
  Sparkles,
  Download,
  Loader2,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { collection, getDocs, query, orderBy, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { logAction } from "@/lib/audit";
import { useEffect } from "react";

export default function ExportsPage() {
  const { profile } = useAuth();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<{format: string, date: string} | null>(null);
  const container = useRef<HTMLDivElement>(null);

  // Filter states
  const [selectedPeriod, setSelectedPeriod] = useState("Mois en cours");
  const [selectedCompany, setSelectedCompany] = useState("Toutes les entreprises");
  const [companies, setCompanies] = useState<string[]>([]);
  const [checkedFields, setCheckedFields] = useState<Record<string, boolean>>({
    "Chiffre d'affaires": true,
    "Recouvrements": true,
    "Clients": true,
    "Modes de paiement": true
  });
  const [currency, setCurrency] = useState("FCFA");

  // Load custom enterprise settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "enterprise"), (docSnap) => {
      if (docSnap.exists()) {
        setCurrency(docSnap.data().currency || "FCFA");
      }
    });
    return () => unsub();
  }, []);

  // Load companies dynamically from Firestore
  useEffect(() => {
    const q = query(collection(db, "companies"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => doc.data().name as string);
      setCompanies(list);
    });
    return () => unsubscribe();
  }, []);

  const toggleField = (field: string) => {
    setCheckedFields(prev => ({ ...prev, [field]: !prev[field] }));
  };

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.from(".page-header", { y: -20, opacity: 0, duration: 0.8 });
    tl.from(".export-card", { 
      y: 30, 
      opacity: 0, 
      stagger: 0.15, 
      duration: 0.6 
    }, "-=0.4");
    tl.from(".config-section", { y: 20, opacity: 0, duration: 0.6 }, "-=0.2");
  }, { scope: container });

  const fetchEntries = async () => {
    const q = query(collection(db, "daily_entries"), orderBy("date", "desc"));
    const snapshot = await getDocs(q);
    const allEntries = snapshot.docs.map(doc => {
      const data = doc.data();
      const total = Number(data.totalAmount || 0);
      const paid = Number(data.paidAmount || 0);
      return { 
        id: doc.id, 
        ...data,
        totalAmount: total,
        paidAmount: paid,
        resteAVerser: total - paid
      } as any;
    });

    // 1. Filter by Company
    let filtered = allEntries;
    if (selectedCompany !== "Toutes les entreprises") {
      filtered = filtered.filter(e => e.companyId === selectedCompany);
    }

    // 2. Filter by Period
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf60Days = new Date();
    startOf60Days.setDate(now.getDate() - 60);
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const startOfQuarter = new Date(now.getFullYear(), currentQuarter * 3, 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);

    filtered = filtered.filter(e => {
      const dateVal = e.date ? new Date(e.date) : (e.createdAt ? new Date(e.createdAt) : null);
      if (!dateVal) return true;

      if (selectedPeriod === "Mois en cours") {
        return dateVal >= startOfMonth;
      } else if (selectedPeriod === "60 derniers jours") {
        return dateVal >= startOf60Days;
      } else if (selectedPeriod === "Trimestre en cours") {
        return dateVal >= startOfQuarter;
      } else if (selectedPeriod === "Année " + now.getFullYear()) {
        return dateVal >= startOfYear;
      }
      return true; // Toutes les données
    });

    return filtered;
  };

  const handleExportPDF = async () => {
    setIsGenerating("PDF");
    try {
      const data = await fetchEntries();
      
      // Dynamic import to avoid SSR issues
      const jsPDFModule = await import("jspdf");
      const jsPDF = jsPDFModule.default;
      await import("jspdf-autotable");
      
      const doc = new jsPDF();
      
      // Header
      doc.setFillColor(92, 61, 46);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.text(`NYA BLO — RAPPORT D'ACTIVITÉ`, 14, 18);
      doc.setFontSize(9);
      doc.text(`Filtres : Filiale = ${selectedCompany} | Période = ${selectedPeriod}`, 14, 26);
      doc.text(`Généré le : ${new Date().toLocaleString('fr-FR')}`, 14, 32);
      doc.setTextColor(0, 0, 0);

      // Build Headers & Data dynamically based on checked fields
      const headers = ['Date', 'Filiale'];
      if (checkedFields["Clients"]) headers.push('Client');
      if (checkedFields["Chiffre d'affaires"]) headers.push('Total');
      if (checkedFields["Recouvrements"]) {
        headers.push('Versé');
        headers.push('Reste');
      }
      if (checkedFields["Modes de paiement"]) {
        headers.push('Paiement');
        headers.push('Canal');
      }

      const tableData = data.map((e: any) => {
        const row = [];
        row.push(e.date ? new Date(e.date).toLocaleDateString('fr-FR') : "N/A");
        row.push(String(e.companyId || "N/A"));
        
        if (checkedFields["Clients"]) row.push(String(e.clientName || "N/A"));
        if (checkedFields["Chiffre d'affaires"]) row.push(`${Number(e.totalAmount).toLocaleString()} ${currency}`);
        if (checkedFields["Recouvrements"]) {
          row.push(`${Number(e.paidAmount).toLocaleString()} ${currency}`);
          row.push(`${Number(e.resteAVerser).toLocaleString()} ${currency}`);
        }
        if (checkedFields["Modes de paiement"]) {
          row.push(String(e.modePaiement || "Espèces"));
          row.push(String(e.canal || "Direct"));
        }
        return row;
      });

      // Use autoTable via the plugin
      (doc as unknown as Record<string, CallableFunction>).autoTable({
        startY: 50,
        head: [headers],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [92, 61, 46], fontSize: 8, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [250, 243, 224] },
        styles: { fontSize: 7, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });

      // Footer summary
      const totalVentes = data.reduce((sum, e) => sum + Number(e.totalAmount || 0), 0);
      const totalPaid = data.reduce((sum, e) => sum + Number(e.paidAmount || 0), 0);
      const finalY = ((doc as unknown as Record<string, Record<string, number>>).lastAutoTable?.finalY) || 200;
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      
      let summaryText = "";
      if (checkedFields["Chiffre d'affaires"]) summaryText += `Total Ventes: ${totalVentes.toLocaleString()} ${currency} | `;
      if (checkedFields["Recouvrements"]) summaryText += `Total Encaissé: ${totalPaid.toLocaleString()} ${currency} | Reste: ${(totalVentes - totalPaid).toLocaleString()} ${currency}`;
      
      doc.text(summaryText, 14, finalY + 15);

      doc.save(`NYA_BLO_Rapport_${new Date().toISOString().split('T')[0]}.pdf`);
      setLastExport({ format: "PDF", date: new Date().toLocaleString('fr-FR') });
      
      await logAction(
        profile?.uid,
        profile?.email,
        "export_pdf",
        `Génération du rapport PDF (Période: ${selectedPeriod}, Filiale: ${selectedCompany})`,
        selectedCompany
      );

      toast.success("✅ Rapport PDF téléchargé avec succès !");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Erreur lors de la génération du PDF.");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleExportExcel = async () => {
    setIsGenerating("XLSX");
    try {
      const data = await fetchEntries();
      
      // Dynamic import
      const XLSX = await import("xlsx");
      
      const worksheetData = data.map((e: any) => {
        const row: any = {
          Date: e.date ? new Date(e.date).toLocaleDateString('fr-FR') : "N/A",
          Entreprise: String(e.companyId || "")
        };
        
        if (checkedFields["Clients"]) {
          row["Client"] = String(e.clientName || "");
          row["Contact"] = String(e.clientContact || "");
          row["Engin"] = String(e.engin || "");
          row["Motif"] = String(e.motif || "");
        }
        if (checkedFields["Chiffre d'affaires"]) {
          row[`Total (${currency})`] = Number(e.totalAmount);
        }
        if (checkedFields["Recouvrements"]) {
          row[`Versé (${currency})`] = Number(e.paidAmount);
          row[`Reste (${currency})`] = Number(e.resteAVerser);
        }
        if (checkedFields["Modes de paiement"]) {
          row["Mode Paiement"] = String(e.modePaiement || "Espèces");
          row["Canal"] = String(e.canal || "Direct");
        }
        row["Statut"] = String(e.status || "Confirmé");
        
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Activités NYA BLO");
      
      XLSX.writeFile(workbook, `NYA_BLO_Archives_${new Date().toISOString().split('T')[0]}.xlsx`);
      setLastExport({ format: "XLSX", date: new Date().toLocaleString('fr-FR') });
      
      await logAction(
        profile?.uid,
        profile?.email,
        "export_xlsx",
        `Génération de l'archive Excel (Période: ${selectedPeriod}, Filiale: ${selectedCompany})`,
        selectedCompany
      );

      toast.success("✅ Archive Excel téléchargée avec succès !");
    } catch (error) {
      console.error("Excel Export Error:", error);
      toast.error("Erreur lors de la génération de l'Excel.");
    } finally {
      setIsGenerating(null);
    }
  };

  const handleExport = (format: string) => {
    if (format === "PDF") handleExportPDF();
    else if (format === "XLSX") handleExportExcel();
    else toast("Cette fonctionnalité sera bientôt disponible.", { icon: "🔜" });
  };

  const EXPORT_OPTIONS = [
    { title: "Rapport PDF", desc: "Document formaté prêt pour impression et présentation", icon: FileText, format: "PDF", gradient: "from-[#5C3D2E] to-[#8B5E3C]" },
    { title: "Archive Excel", desc: "Tableur complet pour analyse et calculs avancés", icon: FileSpreadsheet, format: "XLSX", gradient: "from-[#A66037] to-[#D4AF37]" },
    { title: "Envoi par Email", desc: "Transmission sécurisée par courrier électronique", icon: Mail, format: "EMAIL", gradient: "from-[#2D1A12] to-[#5C3D2E]" },
    { title: "Lien de Partage", desc: "Consultation web en lecture seule pour vos partenaires", icon: Share2, format: "LINK", gradient: "from-[#B89E7E] to-[#D4AF37]" },
  ];

  return (
    <div ref={container} className="space-y-8 pb-12 relative">
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-[#5C3D2E] font-dogon uppercase tracking-tight">Archives & Exports</h1>
          <p className="text-[#B89E7E] mt-1">Exportez la puissance de vos données commerciales.</p>
        </div>
        {lastExport && (
          <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2.5 rounded-2xl border border-emerald-200">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-700">Dernier export: {lastExport.format} — {lastExport.date}</span>
          </div>
        )}
      </div>

      {/* Export Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {EXPORT_OPTIONS.map((item, i) => (
          <div key={i} className="export-card bg-white rounded-[32px] shadow-premium border border-[#E8DCC4] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
             {/* Gradient header */}
             <div className={`bg-gradient-to-r ${item.gradient} p-6 flex items-center justify-center`}>
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                   <item.icon className="w-8 h-8 text-white" />
                </div>
             </div>
             {/* Content */}
             <div className="p-6 text-center">
                <h3 className="text-lg font-bold text-[#5C3D2E] font-dogon mb-2">{item.title}</h3>
                <p className="text-sm text-[#B89E7E] mb-6 leading-relaxed">{item.desc}</p>
                <button 
                   className="w-full py-4 rounded-2xl bg-[#FAF3E0] text-[#5C3D2E] font-bold hover:bg-[#5C3D2E] hover:text-white transition-all duration-300 flex items-center justify-center gap-2 border border-[#E8DCC4] hover:border-[#5C3D2E]"
                   onClick={() => handleExport(item.format)}
                   disabled={isGenerating !== null}
                >
                   {isGenerating === item.format ? (
                     <><Loader2 className="w-4 h-4 animate-spin" /> Traitement...</>
                   ) : (
                     <><Download className="w-4 h-4" /> Générer</>
                   )}
                </button>
             </div>
          </div>
        ))}
      </div>

      {/* Configuration + History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
         <div className="config-section lg:col-span-2 bg-white p-10 rounded-[40px] shadow-premium border border-[#E8DCC4] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FAF3E0]/50 rounded-bl-full -mr-32 -mt-32" />
            
            <div className="flex items-center justify-between mb-10 relative z-10">
               <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#5C3D2E] rounded-xl flex items-center justify-center">
                     <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-[#5C3D2E] font-dogon">Configuration du Rapport</h3>
               </div>
            </div>
            
            <div className="space-y-8 relative z-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest pl-1">Période</label>
                     <select 
                       value={selectedPeriod}
                       onChange={(e) => setSelectedPeriod(e.target.value)}
                       className="w-full p-5 rounded-2xl bg-[#FAF3E0]/30 border-2 border-transparent focus:border-[#D4AF37] outline-none font-bold text-[#5C3D2E] appearance-none cursor-pointer"
                     >
                        <option>Mois en cours</option>
                        <option>60 derniers jours</option>
                        <option>Trimestre en cours</option>
                        <option>Année {new Date().getFullYear()}</option>
                        <option>Toutes les données</option>
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest pl-1">Entreprise</label>
                     <select 
                       value={selectedCompany}
                       onChange={(e) => setSelectedCompany(e.target.value)}
                       className="w-full p-5 rounded-2xl bg-[#FAF3E0]/30 border-2 border-transparent focus:border-[#D4AF37] outline-none font-bold text-[#5C3D2E] appearance-none cursor-pointer"
                     >
                        <option value="Toutes les entreprises">Toutes les entreprises</option>
                        {companies.map(name => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                     </select>
                  </div>
               </div>
               
               <div className="space-y-4">
                  <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest pl-1">Données à inclure</label>
                  <div className="flex flex-wrap gap-3">
                     {["Chiffre d'affaires", "Recouvrements", "Clients", "Modes de paiement"].map(tag => (
                        <label key={tag} className="flex items-center gap-2 bg-[#FAF3E0]/50 px-5 py-3 rounded-2xl border-2 border-transparent hover:border-[#D4AF37]/30 cursor-pointer transition-all has-[input:checked]:bg-[#5C3D2E] has-[input:checked]:text-white has-[input:checked]:border-[#5C3D2E] shadow-sm">
                           <input 
                             type="checkbox" 
                             className="hidden" 
                             checked={checkedFields[tag] === true}
                             onChange={() => toggleField(tag)} 
                           />
                           <span className="text-sm font-bold">{tag}</span>
                        </label>
                     ))}
                  </div>
               </div>

               <Button 
                 variant="gold" 
                 className="w-full h-16 rounded-[24px] text-lg shadow-gold"
                 onClick={handleExportPDF}
                 disabled={isGenerating !== null}
               >
                  {isGenerating ? (
                    <span className="flex items-center gap-3"><Loader2 className="w-5 h-5 animate-spin" /> Génération en cours...</span>
                  ) : (
                    <span className="flex items-center gap-3"><FileText className="w-5 h-5" /> Générer le Rapport Complet (PDF)</span>
                  )}
               </Button>
            </div>
         </div>

         <div className="config-section bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4]">
            <div className="flex items-center gap-3 mb-8">
               <Clock className="w-6 h-6 text-[#A66037]" />
               <h3 className="text-xl font-bold text-[#5C3D2E] font-dogon">Historique</h3>
            </div>
            <div className="space-y-6">
               {lastExport ? (
                 <div className="flex gap-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                       <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                       <p className="text-sm font-bold text-emerald-800">Export {lastExport.format} réussi</p>
                       <p className="text-xs text-emerald-600 mt-1">{lastExport.date}</p>
                    </div>
                 </div>
               ) : (
                 <div className="py-16 text-center">
                    <Download className="w-12 h-12 text-[#E8DCC4] mx-auto mb-4" />
                    <p className="text-[#B89E7E] font-medium">Aucun export réalisé pour le moment.</p>
                    <p className="text-xs text-[#E8DCC4] mt-2">Vos rapports générés apparaîtront ici.</p>
                 </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
