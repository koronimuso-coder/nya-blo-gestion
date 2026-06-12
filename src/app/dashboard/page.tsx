"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  TrendingUp, 
  Target, 
  CreditCard, 
  AlertCircle,
  Calendar,
  ArrowRight,
  User,
  Loader2,
  Activity,
  Filter,
  Edit2,
  Check,
  X
} from "lucide-react";
import toast from "react-hot-toast";

import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  Legend,
  PieChart,
  Pie,
  Cell
} from "recharts";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { collection, query, onSnapshot, orderBy, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface DashboardEntry {
  id: string;
  clientName: string;
  totalAmount: number;
  paidAmount: number;
  resteAVerser: number;
  companyId: string;
  createdAt: string;
  date: string;
  modePaiement?: string;
  clientContact?: string;
  createdBy?: string;
}

const PIE_COLORS = ["#5C3D2E", "#A66037", "#D4AF37", "#059669", "#3B82F6", "#8B5E3C"];

export default function DashboardPage() {
  const { profile, loading } = useAuth();

  const container = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<DashboardEntry[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("Toutes les entreprises");
  const [selectedPeriod, setSelectedPeriod] = useState("30 derniers jours");
  const [enterprise, setEnterprise] = useState({ name: "NYA BLO", currency: "FCFA", salesTarget: 5000000 });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState("");
  const [particles, setParticles] = useState<{ id: number; x: string; y: string; size: string; delay: string; duration: string; scale: number }[]>([]);
  
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);
  const dateString = mounted ? new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : "";

  // 1. Fetch entries in real-time
  useEffect(() => {
    const qAll = query(collection(db, "daily_entries"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(qAll, (snapshot) => {
      const allDocs = snapshot.docs.map(doc => {
        const data = doc.data();
        const total = Number(data.totalAmount || 0);
        const paid = Number(data.paidAmount || 0);
        return {
          id: doc.id,
          ...data,
          totalAmount: total,
          paidAmount: paid,
          resteAVerser: data.resteAVerser != null ? Number(data.resteAVerser) : (total - paid),
        } as DashboardEntry;
      });
      setEntries(allDocs);
    }, (error) => {
      console.error("Dashboard Real-time Error:", error);
    });

    return () => unsubscribe();
  }, []);

  // 2. Fetch companies list dynamically
  useEffect(() => {
    const q = query(collection(db, "companies"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => d.data().name as string);
      setCompanies(list);
    });
    return () => unsubscribe();
  }, []);

  // 3. Fetch enterprise global settings
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "settings", "enterprise"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEnterprise({
          name: data.name || "NYA BLO GESTION",
          currency: data.currency || "FCFA",
          salesTarget: Number(data.salesTarget || 5000000)
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // currentMonthSales, progressPercent, celebration and goal update computed below

  // 4. Filter entries reactively
  const filteredEntries = useMemo(() => {
    let result = entries;

    // Row-level role-based filtering (commerciale only sees their own sales)
    if (profile?.role === "commerciale") {
      result = result.filter(e => (e as any).createdBy === profile.uid);
    }

    if (selectedCompany !== "Toutes les entreprises") {
      result = result.filter(e => e.companyId === selectedCompany);
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOf30 = new Date(); startOf30.setDate(now.getDate() - 30);
    const startOf90 = new Date(); startOf90.setDate(now.getDate() - 90);

    result = result.filter(e => {
      const dateVal = e.date ? new Date(e.date) : (e.createdAt ? new Date(e.createdAt) : null);
      if (!dateVal) return true;

      if (selectedPeriod === "Mois en cours") {
        return dateVal >= startOfMonth;
      } else if (selectedPeriod === "30 derniers jours") {
        return dateVal >= startOf30;
      } else if (selectedPeriod === "90 derniers jours") {
        return dateVal >= startOf90;
      }
      return true; // Toutes les données
    });

    return result;
  }, [entries, selectedCompany, selectedPeriod, profile]);

  // Calculate current month's sales
  const currentMonthSales = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    let total = 0;
    filteredEntries.forEach(entry => {
      const entryDate = entry.date ? new Date(entry.date) : (entry.createdAt ? new Date(entry.createdAt) : null);
      if (entryDate && entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth) {
        total += entry.totalAmount;
      }
    });
    return total;
  }, [filteredEntries]);

  const progressPercent = useMemo(() => {
    if (!enterprise.salesTarget || enterprise.salesTarget <= 0) return 0;
    return Math.min(Math.round((currentMonthSales / enterprise.salesTarget) * 100), 100);
  }, [currentMonthSales, enterprise.salesTarget]);

  // Célébration de l'objectif de vente (Particules dorées)
  useEffect(() => {
    if (enterprise.salesTarget > 0 && currentMonthSales >= enterprise.salesTarget) {
      const newParticles = Array.from({ length: 45 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 200;
        const x = `${Math.cos(angle) * distance}px`;
        const y = `${Math.sin(angle) * distance}px`;
        const size = `${4 + Math.random() * 8}px`;
        const delay = `${Math.random() * 0.5}s`;
        const duration = `${1.5 + Math.random() * 1.5}s`;
        const scale = 0.5 + Math.random() * 1.5;
        return { id: i, x, y, size, delay, duration, scale };
      });
      setParticles(newParticles);
      
      const timer = setTimeout(() => {
        setParticles([]);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [currentMonthSales, enterprise.salesTarget]);

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newGoalInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Veuillez entrer un montant valide");
      return;
    }
    try {
      await updateDoc(doc(db, "settings", "enterprise"), {
        salesTarget: val
      });
      setIsEditingGoal(false);
      toast.success("Objectif de vente mis à jour !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur de mise à jour");
    }
  };

  // 5. Compute stats from filtered entries
  const stats = useMemo(() => {
    let t = 0;
    let p = 0;
    filteredEntries.forEach(d => {
      t += d.totalAmount;
      p += d.paidAmount;
    });
    return {
      total: t.toLocaleString(),
      paid: p.toLocaleString(),
      pending: (t - p).toLocaleString(),
      conversion: t > 0 ? Math.round((p / t) * 100) + "%" : "0%",
      count: filteredEntries.length
    };
  }, [filteredEntries]);

  // 6. Compute AreaChart data (latest 10 entries)
  const chartData = useMemo(() => {
    return filteredEntries.slice(0, 10).reverse().map(e => ({
      name: e.clientName?.substring(0, 12) || "Client",
      total: e.totalAmount,
      paid: e.paidAmount,
      reste: e.totalAmount - e.paidAmount,
    }));
  }, [filteredEntries]);

  // 7. Compute PieChart data (paid amount grouped by payment mode)
  const pieData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredEntries.forEach(e => {
      const mode = e.modePaiement || "Espèces";
      groups[mode] = (groups[mode] || 0) + e.paidAmount;
    });
    return Object.entries(groups)
      .map(([name, value]) => ({ name, value }))
      .filter(item => item.value > 0);
  }, [filteredEntries]);

  // 8. Recent 5 operations from filtered entries
  const recentEntries = useMemo(() => {
    return filteredEntries.slice(0, 5);
  }, [filteredEntries]);

  useGSAP(() => {
    if (!loading && profile) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".page-header", { y: -30, opacity: 0, duration: 1 });
      tl.from(".filter-bar", { y: 20, opacity: 0, duration: 0.8 }, "-=0.6");
      tl.from(".kpi-card", { scale: 0.8, opacity: 0, stagger: 0.08, duration: 0.7 }, "-=0.5");
      tl.from(".chart-box", { y: 40, opacity: 0, stagger: 0.15, duration: 0.9 }, "-=0.4");
    }
  }, { scope: container, dependencies: [loading] });

  if (loading || !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
        <p className="text-[#A66037] font-bold animate-pulse">Synchronisation avec les archives Dogon...</p>
      </div>
    );
  }

  return (
    <div ref={container} className="space-y-8 pb-10 relative">
      {/* Particle celebration overlay */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {particles.map((p) => (
          <span
            key={p.id}
            className="gold-particle absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: p.size,
              height: p.size,
              '--x': p.x,
              '--y': p.y,
              '--duration': p.duration,
              '--scale': p.scale,
              animationDelay: p.delay
            } as React.CSSProperties}
          />
        ))}
      </div>

      {/* Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-[#A66037] font-bold uppercase tracking-[0.2em] mb-1">
            {dateString || "\u00A0"}
          </p>
          <h1 className="text-3xl font-bold text-primary font-dogon uppercase tracking-tight">
            Bienvenue{profile?.displayName ? `, ${profile.displayName.split(' ')[0]}` : ''} 👋
          </h1>
          <p className="text-[#B89E7E] mt-1">Vue globale des activités de {enterprise.name} en temps réel.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-premium border border-[#E8DCC4]">
             <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
             <span className="text-sm font-bold text-primary">Temps Réel</span>
          </div>
          <div className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-2xl shadow-premium border border-[#E8DCC4]">
             <Calendar className="w-4 h-4 text-secondary" />
             <span className="text-sm font-bold text-primary">{stats.count} ops filtrées</span>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filter-bar flex flex-wrap items-center gap-4 bg-white p-5 rounded-3xl shadow-premium border border-[#E8DCC4] relative z-20">
         <div className="flex items-center gap-2 text-xs font-bold text-[#A66037] uppercase tracking-wider pl-1">
            <Filter className="w-4 h-4" /> Filtrer :
         </div>
         <select
           value={selectedCompany}
           onChange={(e) => setSelectedCompany(e.target.value)}
           className="px-4 py-2.5 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-colors"
         >
            <option value="Toutes les entreprises">Toutes les entreprises</option>
            {companies.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
         </select>
         <select
           value={selectedPeriod}
           onChange={(e) => setSelectedPeriod(e.target.value)}
           className="px-4 py-2.5 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-colors"
         >
            <option value="Mois en cours">Mois en cours</option>
            <option value="30 derniers jours">30 derniers jours</option>
            <option value="90 derniers jours">90 derniers jours</option>
            <option value="Toutes les données">Toutes les données</option>
         </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <KpiCard title="Total Ventes" value={stats.total} trend="Live" isPositive={true} icon={Target} subtitle="Chiffre d'affaires global" currency={enterprise.currency} />
        <KpiCard title="Encaissements" value={stats.paid} trend="Live" isPositive={true} icon={CreditCard} subtitle="Fonds perçus" currency={enterprise.currency} />
        <KpiCard title="En Attente" value={stats.pending} trend="Recouvrement" isPositive={false} icon={AlertCircle} subtitle="Montant à percevoir" currency={enterprise.currency} />
        <KpiCard title="Taux Conversion" value={stats.conversion} trend={stats.conversion} isPositive={true} icon={TrendingUp} subtitle="Encaissé / Total" showCurrency={false} />
        <KpiCard title="Opérations" value={stats.count.toString()} trend="Total" isPositive={true} icon={Activity} subtitle="Saisies enregistrées" showCurrency={false} />
      </div>

      {/* Charts & Target section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Flux de Trésorerie AreaChart */}
        <div className="chart-box lg:col-span-2 bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4]">
           <h3 className="font-bold text-xl text-primary font-dogon mb-8">Flux de Trésorerie</h3>
           <div className="h-[350px] w-full">
              {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DCC460" />
                     <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} />
                     <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                     <Tooltip 
                       formatter={(value: unknown) => Number(value).toLocaleString() + " " + enterprise.currency}
                       contentStyle={{ borderRadius: '16px', border: '1px solid #E8DCC4', fontWeight: 'bold' }}
                     />
                     <Legend />
                     <Area type="monotone" dataKey="total" name="Total" stroke="#5C3D2E" strokeWidth={3} fill="#5C3D2E15" />
                     <Area type="monotone" dataKey="paid" name="Encaissé" stroke="#059669" strokeWidth={2} fill="#05966910" />
                     <Area type="monotone" dataKey="reste" name="Reste" stroke="#DC2626" strokeWidth={2} fill="#DC262610" strokeDasharray="5 5" />
                  </AreaChart>
              </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[#B89E7E] italic">
                  Aucune donnée disponible pour le graphique.
                </div>
              )}
           </div>
        </div>

        {/* Objectif Mensuel Widget */}
        <div className="chart-box lg:col-span-1 bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4] flex flex-col justify-between relative overflow-hidden group/target">
           <div className="absolute inset-0 bg-radial from-[#D4AF37]/5 via-transparent to-transparent opacity-0 group-hover/target:opacity-100 transition-opacity duration-700 pointer-events-none" />

           <div className="relative z-10 flex items-center justify-between">
             <div>
                <h3 className="font-bold text-xl text-primary font-dogon mb-1">Objectif du Mois</h3>
                <p className="text-xs text-[#B89E7E]">Seuil de prospérité commerciale</p>
             </div>
             {(profile?.role === "super_admin" || profile?.role === "admin_entreprise") && (
                <button 
                  onClick={() => {
                    setNewGoalInput(enterprise.salesTarget.toString());
                    setIsEditingGoal(true);
                  }}
                  className="p-2 hover:bg-[#FAF3E0] rounded-xl border border-[#E8DCC4] transition-colors cursor-pointer text-[#A66037] hover:text-[#5C3D2E]"
                >
                   <Edit2 className="w-4 h-4" />
                </button>
             )}
           </div>

           {/* Editing Form Inline */}
           {isEditingGoal ? (
             <form onSubmit={handleUpdateGoal} className="py-6 space-y-4 relative z-10">
                <div className="space-y-1">
                   <label className="text-[9px] font-bold text-[#B89E7E] uppercase tracking-wider pl-1">Nouvel Objectif ({enterprise.currency})</label>
                   <input 
                     type="number"
                     value={newGoalInput}
                     onChange={(e) => setNewGoalInput(e.target.value)}
                     className="w-full px-4 py-3 rounded-xl bg-[#FAF3E0]/30 border border-[#E8DCC4] text-xs font-bold text-primary focus:ring-2 focus:ring-[#D4AF37]/30 outline-none"
                     autoFocus
                   />
                </div>
                <div className="flex gap-2">
                   <button 
                     type="submit"
                     className="flex-1 py-2.5 rounded-xl bg-[#5C3D2E] text-white font-bold text-xs uppercase hover:bg-[#A66037] transition-all flex items-center justify-center gap-1 cursor-pointer"
                   >
                      <Check className="w-3.5 h-3.5" /> Confirmer
                   </button>
                   <button 
                     type="button"
                     onClick={() => setIsEditingGoal(false)}
                     className="px-3 py-2.5 rounded-xl border border-[#E8DCC4] text-[#A66037] hover:bg-[#FAF3E0] transition-all cursor-pointer"
                   >
                      <X className="w-3.5 h-3.5" />
                   </button>
                </div>
             </form>
           ) : (
             <div className="flex flex-col items-center py-6 relative z-10">
                <div className="relative flex items-center justify-center">
                   <svg
                     height={110}
                     width={110}
                     className="transform -rotate-90 drop-shadow-md"
                   >
                     {/* Track Ring */}
                     <circle
                       stroke="#FAF3E0"
                       fill="transparent"
                       strokeWidth={8}
                       r={43}
                       cx={55}
                       cy={55}
                     />
                     {/* Progress Ring */}
                     <circle
                       stroke={progressPercent >= 100 ? "#D4AF37" : "#A66037"}
                       fill="transparent"
                       strokeWidth={8}
                       strokeDasharray={`${2 * Math.PI * 43} ${2 * Math.PI * 43}`}
                       style={{ strokeDashoffset: (2 * Math.PI * 43) - (progressPercent / 100) * (2 * Math.PI * 43) }}
                       strokeLinecap="round"
                       r={43}
                       cx={55}
                       cy={55}
                       className="transition-all duration-1000 ease-out"
                     />
                   </svg>
                   {/* Center Text */}
                   <div className="absolute flex flex-col items-center">
                      <span className="text-2xl font-bold font-dogon text-primary leading-none">{progressPercent}%</span>
                      <span className="text-[9px] text-[#B89E7E] font-bold uppercase tracking-wider mt-1">Atteint</span>
                   </div>
                </div>

                <div className="mt-5 text-center">
                   <p className="text-[10px] text-[#B89E7E] font-bold uppercase tracking-widest">Progression</p>
                   <p className="text-sm font-bold text-primary mt-1">
                      {currentMonthSales.toLocaleString()} / {enterprise.salesTarget.toLocaleString()} {enterprise.currency}
                   </p>
                </div>
             </div>
           )}

           <div className="border-t border-[#E8DCC4]/30 pt-4 flex justify-between items-center relative z-10 text-[10px] text-[#A66037] font-medium">
              <span>Mois Civil en Cours</span>
              {progressPercent >= 100 ? (
                <span className="px-2.5 py-1 bg-[#D4AF37]/10 text-[#D4AF37] font-bold rounded-full uppercase tracking-wider text-[8px] animate-pulse">Grenier Rempli ! 🌾</span>
              ) : (
                <span>Reste : {(enterprise.salesTarget - currentMonthSales > 0 ? enterprise.salesTarget - currentMonthSales : 0).toLocaleString()} {enterprise.currency}</span>
              )}
           </div>
        </div>
      </div>

      {/* Recent Operations, PieChart & Urgent Collections Reminders */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
         {/* Left Side: Recent Operations */}
         <div className="chart-box lg:col-span-2 bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4] flex flex-col justify-between">
           <div>
             <div className="flex items-center justify-between mb-8">
                 <h3 className="font-bold text-xl text-primary font-dogon">Dernières Opérations</h3>
                 <Link href="/dashboard/entries" className="text-xs font-bold text-secondary uppercase tracking-[0.2em] flex items-center hover:translate-x-1 transition-transform">
                    Historique complet <ArrowRight className="ml-1 w-4 h-4" />
                 </Link>
             </div>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 {recentEntries.slice(0, 4).map((entry) => (
                    <div key={entry.id} className="flex gap-4 p-4 rounded-2xl bg-[#FAF3E0]/30 border border-[#E8DCC4]/50 hover:bg-[#FAF3E0]/50 transition-colors">
                       <div className="w-10 h-10 rounded-xl bg-[#FAF3E0] flex items-center justify-center shrink-0 border border-[#E8DCC4]">
                          <User className="w-5 h-5 text-[#5C3D2E]" />
                       </div>
                       <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-primary truncate">{entry.clientName || "Client inconnu"}</p>
                          <p className="text-[10px] text-[#B89E7E] truncate">{entry.companyId}</p>
                          <p className="text-xs font-bold text-emerald-600 mt-1">{Number(entry.paidAmount).toLocaleString()} {enterprise.currency}</p>
                          <span className="text-[9px] font-bold text-[#A66037]">
                            {entry.date ? new Date(entry.date).toLocaleDateString() : "--"}
                          </span>
                       </div>
                    </div>
                 ))}
                 {recentEntries.length === 0 && (
                    <p className="col-span-full text-center py-10 text-[#B89E7E] italic text-xs">Aucune donnée trouvée.</p>
                 )}
             </div>
           </div>
         </div>

         {/* Middle: Répartition par mode de paiement PieChart */}
         <div className="chart-box lg:col-span-1 bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4] flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-xl text-primary font-dogon mb-2">Modes de Paiement</h3>
              <p className="text-xs text-[#B89E7E] mb-6 font-medium">Répartition de la trésorerie encaissée.</p>
            </div>
            <div className="h-[180px] w-full flex items-center justify-center relative">
               {pieData.length > 0 ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: unknown) => Number(value).toLocaleString() + " " + enterprise.currency}
                        contentStyle={{ borderRadius: '12px', border: '1px solid #E8DCC4', fontWeight: 'bold', fontSize: 11 }}
                      />
                    </PieChart>
                 </ResponsiveContainer>
               ) : (
                 <div className="text-center text-[#B89E7E] italic text-xs">
                   Aucun encaissement sur cette période.
                 </div>
               )}
            </div>
            {pieData.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-1 justify-center mt-3">
                 {pieData.map((d, i) => (
                   <div key={d.name} className="flex items-center gap-1 text-[9px] font-bold text-primary">
                     <span className="w-2 h-2 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                     <span>{d.name}</span>
                   </div>
                 ))}
              </div>
            )}
         </div>

         {/* Right Side: Relances Prioritaires */}
         <div className="chart-box lg:col-span-1 bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4] flex flex-col justify-between">
           <div>
             <div className="flex items-center gap-2 mb-2">
                 <AlertCircle className="w-5 h-5 text-red-500 animate-pulse" />
                 <h3 className="font-bold text-xl text-primary font-dogon">Relances</h3>
             </div>
             <p className="text-xs text-[#B89E7E] mb-6 font-medium">Restes à recouvrer les plus élevés.</p>
             
             <div className="space-y-4">
                 {filteredEntries
                   .filter(e => e.resteAVerser > 0)
                   .sort((a, b) => b.resteAVerser - a.resteAVerser)
                   .slice(0, 3)
                   .map((entry) => {
                      // Generate WhatsApp reminder link
                      const cleanPhone = entry.clientContact?.replace(/[^0-9]/g, "") || "";
                      const waMsg = encodeURIComponent(`Bonjour ${entry.clientName}, nous vous contactons concernant votre règlement en attente pour un montant de ${entry.resteAVerser.toLocaleString()} ${enterprise.currency}. Merci de nous recontacter pour régulariser votre situation.`);
                      const waLink = `https://wa.me/${cleanPhone}?text=${waMsg}`;
                      
                      return (
                         <div key={entry.id} className="p-3 rounded-2xl bg-red-50/20 border border-red-100/50 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                               <p className="text-xs font-bold text-primary truncate">{entry.clientName}</p>
                               <p className="text-[10px] text-red-500 font-bold">Reste: {entry.resteAVerser.toLocaleString()}</p>
                               <p className="text-[9px] text-[#B89E7E] truncate">{entry.clientContact || "Pas de contact"}</p>
                            </div>
                            {cleanPhone && (
                               <a 
                                  href={waLink} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-[8px] font-bold uppercase transition-all shrink-0 hover:scale-105 active:scale-95 flex items-center gap-1 shadow-sm shadow-emerald-500/10 cursor-pointer"
                               >
                                  Relancer
                               </a>
                            )}
                         </div>
                      );
                   })}
                 {filteredEntries.filter(e => e.resteAVerser > 0).length === 0 && (
                    <div className="py-8 text-center text-emerald-600 font-bold text-[10px] uppercase tracking-wide">
                       Aucune relance en attente 🎉
                    </div>
                 )}
             </div>
           </div>
         </div>
      </div>
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  trend: string;
  isPositive: boolean;
  icon: React.ElementType;
  subtitle: string;
  showCurrency?: boolean;
  currency?: string;
}

const KpiCard = ({ title, value, trend, isPositive, icon: Icon, subtitle, showCurrency = true, currency = "FCFA" }: KpiCardProps) => (
  <div className="kpi-card bg-white p-6 rounded-[32px] shadow-premium border border-[#E8DCC4] relative overflow-hidden group">
    <div className="absolute top-0 right-0 w-24 h-24 bg-[#5C3D2E]/5 rounded-bl-[80px] -mr-6 -mt-6 group-hover:bg-[#5C3D2E]/10 transition-all duration-500" />
    <div className="relative z-10">
      <div className="flex justify-between items-start mb-4">
        <div className="bg-[#5C3D2E]/5 p-3 rounded-2xl text-[#5C3D2E] group-hover:bg-[#5C3D2E] group-hover:text-white transition-all duration-300">
          <Icon className="w-6 h-6" />
        </div>
        <div className={`text-[10px] font-bold tracking-[0.2em] uppercase ${isPositive ? 'text-[#D4AF37]' : 'text-orange-600'}`}>
          {trend}
        </div>
      </div>
      <div>
        <p className="text-[#B89E7E] text-[10px] font-bold uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-xl font-bold text-primary font-dogon mb-1">{value}{showCurrency ? ` ${currency}` : ""}</h3>
        <p className="text-[10px] text-[#A66037] font-medium">{subtitle}</p>
      </div>
    </div>
  </div>
);
