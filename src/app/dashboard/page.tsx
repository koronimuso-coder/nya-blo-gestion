"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  TrendingUp, 
  TrendingDown,
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
  X,
  Sparkles,
  Trophy,
  Flame,
  Star
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
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line
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
  createdByName?: string;
  createdByEmail?: string;
}

const PIE_COLORS = ["#5C3D2E", "#A66037", "#D4AF37", "#059669", "#3B82F6", "#8B5E3C"];

const MONTHS_LIST = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", 
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

// Skeleton loader component
const SkeletonCard = () => (
  <div className="kpi-card bg-white p-6 rounded-[32px] border border-[#E8DCC4] relative overflow-hidden">
    <div className="flex justify-between items-start mb-4">
      <div className="w-12 h-12 rounded-2xl shimmer" />
      <div className="w-12 h-3 rounded-full shimmer" />
    </div>
    <div className="space-y-2">
      <div className="w-20 h-2 rounded-full shimmer" />
      <div className="w-32 h-6 rounded-lg shimmer" />
      <div className="w-24 h-2 rounded-full shimmer" />
    </div>
  </div>
);

export default function DashboardPage() {
  const { profile, loading } = useAuth();

  const container = useRef<HTMLDivElement>(null);
  const [entries, setEntries] = useState<DashboardEntry[]>([]);
  const [companies, setCompanies] = useState<string[]>([]);
  const [selectedCompany, setSelectedCompany] = useState("Toutes les entreprises");
  const [selectedPeriod, setSelectedPeriod] = useState("30 derniers jours");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [enterprise, setEnterprise] = useState({ name: "NYA BLO", currency: "FCFA", salesTarget: 5000000 });
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoalInput, setNewGoalInput] = useState("");
  const [particles, setParticles] = useState<{ id: number; x: string; y: string; size: string; delay: string; duration: string; scale: number }[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [users, setUsers] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  
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
      setDataLoaded(true);
    }, (error) => {
      console.error("Dashboard Real-time Error:", error);
      setDataLoaded(true);
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

  // 3b. Fetch users list dynamically
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("displayName", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(list);
    });
    return () => unsubscribe();
  }, []);

  // 4. Filter entries reactively
  const filteredEntries = useMemo(() => {
    let result = entries;

    // Row-level role-based filtering
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
      } else if (selectedPeriod === "Par mois spécifique") {
        return dateVal.getFullYear() === selectedYear && dateVal.getMonth() === selectedMonth;
      }
      return true;
    });

    return result;
  }, [entries, selectedCompany, selectedPeriod, selectedMonth, selectedYear, profile]);

  // --- Previous period entries for trend calculation ---
  const prevPeriodEntries = useMemo(() => {
    let result = entries;
    if (profile?.role === "commerciale") {
      result = result.filter(e => (e as any).createdBy === profile.uid);
    }
    if (selectedCompany !== "Toutes les entreprises") {
      result = result.filter(e => e.companyId === selectedCompany);
    }

    const now = new Date();
    const startOf30 = new Date(); startOf30.setDate(now.getDate() - 30);
    const startOf60 = new Date(); startOf60.setDate(now.getDate() - 60);
    const startOf90 = new Date(); startOf90.setDate(now.getDate() - 90);
    const startOf180 = new Date(); startOf180.setDate(now.getDate() - 180);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    return result.filter(e => {
      const dateVal = e.date ? new Date(e.date) : (e.createdAt ? new Date(e.createdAt) : null);
      if (!dateVal) return false;
      if (selectedPeriod === "Mois en cours") {
        return dateVal >= startOfPrevMonth && dateVal < startOfMonth;
      } else if (selectedPeriod === "30 derniers jours") {
        return dateVal >= startOf60 && dateVal < startOf30;
      } else if (selectedPeriod === "90 derniers jours") {
        return dateVal >= startOf180 && dateVal < startOf90;
      } else if (selectedPeriod === "Par mois spécifique") {
        const prevMonth = selectedMonth === 0 ? 11 : selectedMonth - 1;
        const prevYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear;
        return dateVal.getFullYear() === prevYear && dateVal.getMonth() === prevMonth;
      }
      return false;
    });
  }, [entries, selectedCompany, selectedPeriod, selectedMonth, selectedYear, profile]);

  // Current month sales
  const currentMonthSales = useMemo(() => {
    const targetMonth = selectedPeriod === "Par mois spécifique" ? selectedMonth : new Date().getMonth();
    const targetYear = selectedPeriod === "Par mois spécifique" ? selectedYear : new Date().getFullYear();
    let total = 0;
    
    // We compute this from the total matching entries list for correct historical target comparison
    entries.forEach(entry => {
      // Apply the same company filter
      if (selectedCompany !== "Toutes les entreprises" && entry.companyId !== selectedCompany) return;
      // Role permission check
      if (profile?.role === "commerciale" && (entry as any).createdBy !== profile.uid) return;

      const entryDate = entry.date ? new Date(entry.date) : (entry.createdAt ? new Date(entry.createdAt) : null);
      if (entryDate && entryDate.getFullYear() === targetYear && entryDate.getMonth() === targetMonth) {
        total += entry.totalAmount;
      }
    });
    return total;
  }, [entries, selectedPeriod, selectedMonth, selectedYear, selectedCompany, profile]);

  const progressPercent = useMemo(() => {
    if (!enterprise.salesTarget || enterprise.salesTarget <= 0) return 0;
    return Math.min(Math.round((currentMonthSales / enterprise.salesTarget) * 100), 100);
  }, [currentMonthSales, enterprise.salesTarget]);

  // Celebration
  useEffect(() => {
    if (enterprise.salesTarget > 0 && currentMonthSales >= enterprise.salesTarget) {
      const newParticles = Array.from({ length: 45 }).map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 200;
        return {
          id: i,
          x: `${Math.cos(angle) * distance}px`,
          y: `${Math.sin(angle) * distance}px`,
          size: `${4 + Math.random() * 8}px`,
          delay: `${Math.random() * 0.5}s`,
          duration: `${1.5 + Math.random() * 1.5}s`,
          scale: 0.5 + Math.random() * 1.5
        };
      });
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 4500);
      return () => clearTimeout(timer);
    }
  }, [currentMonthSales, enterprise.salesTarget]);

  const handleUpdateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(newGoalInput);
    if (isNaN(val) || val <= 0) { toast.error("Veuillez entrer un montant valide"); return; }
    try {
      await updateDoc(doc(db, "settings", "enterprise"), { salesTarget: val });
      setIsEditingGoal(false);
      toast.success("Objectif de vente mis à jour !");
    } catch (err) {
      console.error(err);
      toast.error("Erreur de mise à jour");
    }
  };

  // 5. Compute stats
  const stats = useMemo(() => {
    let t = 0, p = 0;
    filteredEntries.forEach(d => { t += d.totalAmount; p += d.paidAmount; });
    return {
      total: t, totalStr: t.toLocaleString(),
      paid: p, paidStr: p.toLocaleString(),
      pending: t - p, pendingStr: (t - p).toLocaleString(),
      conversion: t > 0 ? Math.round((p / t) * 100) : 0,
      count: filteredEntries.length
    };
  }, [filteredEntries]);

  // Previous period stats for trend
  const prevStats = useMemo(() => {
    let t = 0, p = 0;
    prevPeriodEntries.forEach(d => { t += d.totalAmount; p += d.paidAmount; });
    return { total: t, paid: p, count: prevPeriodEntries.length };
  }, [prevPeriodEntries]);

  const trendPct = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // Average basket
  const avgBasket = useMemo(() => {
    let t = 0;
    filteredEntries.forEach(d => { t += d.totalAmount; });
    return filteredEntries.length > 0 ? Math.round(t / filteredEntries.length) : 0;
  }, [filteredEntries]);
  const prevAvgBasket = useMemo(() => {
    let t = 0;
    prevPeriodEntries.forEach(d => { t += d.totalAmount; });
    return prevPeriodEntries.length > 0 ? Math.round(t / prevPeriodEntries.length) : 0;
  }, [prevPeriodEntries]);

  // Best day
  const bestDay = useMemo(() => {
    const dayMap: Record<string, number> = {};
    filteredEntries.forEach(e => {
      const d = e.date ? e.date.substring(0, 10) : null;
      if (d) dayMap[d] = (dayMap[d] || 0) + e.totalAmount;
    });
    const entries2 = Object.entries(dayMap).sort((a, b) => b[1] - a[1]);
    if (entries2.length === 0) return null;
    const [date, amount] = entries2[0];
    return { date: new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }), amount };
  }, [filteredEntries]);

  // Entries filtered specifically for rankings (always by calendar month)
  const rankingFilteredEntries = useMemo(() => {
    let result = entries;

    if (profile?.role === "commerciale") {
      result = result.filter(e => (e as any).createdBy === profile.uid);
    }

    if (selectedCompany !== "Toutes les entreprises") {
      result = result.filter(e => e.companyId === selectedCompany);
    }

    result = result.filter(e => {
      const dateVal = e.date ? new Date(e.date) : (e.createdAt ? new Date(e.createdAt) : null);
      if (!dateVal) return false;
      return dateVal.getFullYear() === selectedYear && dateVal.getMonth() === selectedMonth;
    });

    return result;
  }, [entries, selectedCompany, selectedMonth, selectedYear, profile]);

  // Agent performance
  const agentPerformance = useMemo(() => {
    const perfMap: Record<string, { id: string; name: string; email: string; sales: number; paid: number; pending: number; count: number }> = {};
    users.forEach(u => {
      perfMap[u.id] = { id: u.id, name: u.displayName || "Agent", email: u.email || "", sales: 0, paid: 0, pending: 0, count: 0 };
    });
    rankingFilteredEntries.forEach(e => {
      const creatorId = e.createdBy;
      if (!creatorId) return;
      if (!perfMap[creatorId]) {
        perfMap[creatorId] = { id: creatorId, name: e.createdByName || "Agent inconnu", email: e.createdByEmail || "", sales: 0, paid: 0, pending: 0, count: 0 };
      }
      perfMap[creatorId].sales += e.totalAmount;
      perfMap[creatorId].paid += e.paidAmount;
      perfMap[creatorId].pending += (e.totalAmount - e.paidAmount);
      perfMap[creatorId].count += 1;
    });
    return Object.values(perfMap).sort((a, b) => b.sales - a.sales);
  }, [rankingFilteredEntries, users]);


  // Weekly chart data (last 8 weeks)
  const weeklyChartData = useMemo(() => {
    const weeks: Record<string, { label: string; total: number; paid: number; reste: number; weekStart: Date }> = {};
    const now = new Date();

    for (let w = 7; w >= 0; w--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - w * 7 - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      const key = weekStart.toISOString().substring(0, 10);
      const label = `${weekStart.getDate()}/${weekStart.getMonth() + 1}`;
      weeks[key] = { label, total: 0, paid: 0, reste: 0, weekStart };
    }

    entries.forEach(e => {
      const dateVal = e.date ? new Date(e.date) : (e.createdAt ? new Date(e.createdAt) : null);
      if (!dateVal) return;
      if (selectedCompany !== "Toutes les entreprises" && e.companyId !== selectedCompany) return;

      for (const [key, week] of Object.entries(weeks)) {
        const weekEnd = new Date(week.weekStart);
        weekEnd.setDate(week.weekStart.getDate() + 7);
        if (dateVal >= week.weekStart && dateVal < weekEnd) {
          week.total += e.totalAmount;
          week.paid += e.paidAmount;
          week.reste += (e.totalAmount - e.paidAmount);
          break;
        }
      }
    });

    return Object.values(weeks).map(w => ({ name: w.label, total: w.total, paid: w.paid, reste: w.reste }));
  }, [entries, selectedCompany]);

  // Pie chart data
  const pieData = useMemo(() => {
    const groups: Record<string, number> = {};
    filteredEntries.forEach(e => {
      const mode = e.modePaiement || "Espèces";
      groups[mode] = (groups[mode] || 0) + e.paidAmount;
    });
    return Object.entries(groups).map(([name, value]) => ({ name, value })).filter(item => item.value > 0);
  }, [filteredEntries]);

  const recentEntries = useMemo(() => filteredEntries.slice(0, 5), [filteredEntries]);

  useGSAP(() => {
    if (!loading && profile && dataLoaded) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".page-header", { y: -30, opacity: 0, duration: 1 });
      tl.from(".filter-bar", { y: 20, opacity: 0, duration: 0.8 }, "-=0.6");
      tl.from(".kpi-card", { scale: 0.8, opacity: 0, stagger: 0.08, duration: 0.7 }, "-=0.5");
      tl.from(".chart-box", { y: 40, opacity: 0, stagger: 0.15, duration: 0.9 }, "-=0.4");
    }
  }, { scope: container, dependencies: [loading, dataLoaded] });

  if (loading || !profile) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-12 h-12 text-[#D4AF37] animate-spin" />
        <p className="text-[#A66037] font-bold animate-pulse">Synchronisation avec les archives Dogon...</p>
      </div>
    );
  }

  const kpiData = [
    {
      title: "Total Ventes",
      value: stats.totalStr,
      trend: trendPct(stats.total, prevStats.total),
      icon: Target,
      subtitle: "Chiffre d'affaires global",
      currency: enterprise.currency,
      showCurrency: true,
      color: "#5C3D2E"
    },
    {
      title: "Encaissements",
      value: stats.paidStr,
      trend: trendPct(stats.paid, prevStats.paid),
      icon: CreditCard,
      subtitle: "Fonds perçus",
      currency: enterprise.currency,
      showCurrency: true,
      color: "#059669"
    },
    {
      title: "En Attente",
      value: stats.pendingStr,
      trend: -trendPct(stats.pending, prevStats.total - prevStats.paid),
      icon: AlertCircle,
      subtitle: "Montant à percevoir",
      currency: enterprise.currency,
      showCurrency: true,
      color: "#DC2626",
      invertTrend: true
    },
    {
      title: "Panier Moyen",
      value: avgBasket.toLocaleString(),
      trend: trendPct(avgBasket, prevAvgBasket),
      icon: Sparkles,
      subtitle: "Moyenne par transaction",
      currency: enterprise.currency,
      showCurrency: true,
      color: "#D4AF37"
    },
    {
      title: "Taux Conversion",
      value: `${stats.conversion}%`,
      trend: trendPct(stats.conversion, prevStats.total > 0 ? Math.round((prevStats.paid / prevStats.total) * 100) : 0),
      icon: TrendingUp,
      subtitle: "Encaissé / Total",
      currency: enterprise.currency,
      showCurrency: false,
      color: "#3B82F6"
    },
    {
      title: "Opérations",
      value: stats.count.toString(),
      trend: trendPct(stats.count, prevStats.count),
      icon: Activity,
      subtitle: "Saisies enregistrées",
      currency: enterprise.currency,
      showCurrency: false,
      color: "#A66037"
    },
  ];

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
        <div className="flex items-center gap-3 flex-wrap">
          {bestDay && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl">
              <Flame className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-bold text-amber-700">Meilleure journée : {bestDay.date} — {bestDay.amount.toLocaleString()} {enterprise.currency}</span>
            </div>
          )}
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
            <option value="Par mois spécifique">Par mois spécifique</option>
            <option value="Toutes les données">Toutes les données</option>
         </select>

         {selectedPeriod === "Par mois spécifique" && (
            <>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2.5 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-colors"
              >
                {MONTHS_LIST.map((m, index) => (
                  <option key={index} value={index}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2.5 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-colors"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </>
          )}
      </div>

      {/* KPI Cards */}
      {!dataLoaded ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {[...Array(6)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
          {kpiData.map((kpi, i) => (
            <KpiCard
              key={i}
              title={kpi.title}
              value={kpi.value}
              trend={kpi.trend}
              icon={kpi.icon}
              subtitle={kpi.subtitle}
              currency={kpi.currency}
              showCurrency={kpi.showCurrency}
              accentColor={kpi.color}
            />
          ))}
        </div>
      )}

      {/* Tab Switcher */}
      <div className="flex gap-4 border-b border-[#E8DCC4] pb-px">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-4 px-4 font-bold text-sm tracking-wide transition-all border-b-2 uppercase cursor-pointer ${
            activeTab === "overview"
              ? "border-[#5C3D2E] text-[#5C3D2E]"
              : "border-transparent text-[#B89E7E] hover:text-[#5C3D2E]"
          }`}
        >
          Vue d&apos;ensemble
        </button>
        <button
          onClick={() => setActiveTab("performance")}
          className={`pb-4 px-4 font-bold text-sm tracking-wide transition-all border-b-2 uppercase cursor-pointer ${
            activeTab === "performance"
              ? "border-[#5C3D2E] text-[#5C3D2E]"
              : "border-transparent text-[#B89E7E] hover:text-[#5C3D2E]"
          }`}
        >
          Performances Collaborateurs
        </button>
      </div>

      {activeTab === "overview" ? (
        <>
          {/* Weekly trend chart + Target */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Flux Hebdomadaire */}
            <div className="chart-box lg:col-span-2 bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4]">
               <div className="flex items-center justify-between mb-6">
                 <div>
                   <h3 className="font-bold text-xl text-primary font-dogon">Flux Hebdomadaire</h3>
                   <p className="text-xs text-[#B89E7E] mt-1">Évolution des ventes sur les 8 dernières semaines</p>
                 </div>
                 <div className="flex items-center gap-2 bg-[#FAF3E0]/50 px-3 py-1.5 rounded-xl border border-[#E8DCC4]">
                   <TrendingUp className="w-3 h-3 text-[#D4AF37]" />
                   <span className="text-[10px] font-bold text-[#A66037] uppercase tracking-wider">8 semaines</span>
                 </div>
               </div>
               <div className="h-[320px] w-full">
                  {weeklyChartData.some(w => w.total > 0) ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyChartData}>
                         <defs>
                           <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#5C3D2E" stopOpacity={0.25}/>
                             <stop offset="95%" stopColor="#5C3D2E" stopOpacity={0}/>
                           </linearGradient>
                           <linearGradient id="gradPaid" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#059669" stopOpacity={0.2}/>
                             <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                           </linearGradient>
                         </defs>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DCC460" />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={11} />
                         <YAxis axisLine={false} tickLine={false} fontSize={11} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                         <Tooltip 
                           formatter={(value: unknown) => Number(value).toLocaleString() + " " + enterprise.currency}
                           contentStyle={{ borderRadius: '16px', border: '1px solid #E8DCC4', fontWeight: 'bold' }}
                         />
                         <Legend />
                         <Area type="monotone" dataKey="total" name="Total" stroke="#5C3D2E" strokeWidth={3} fill="url(#gradTotal)" />
                         <Area type="monotone" dataKey="paid" name="Encaissé" stroke="#059669" strokeWidth={2} fill="url(#gradPaid)" />
                         <Area type="monotone" dataKey="reste" name="Reste" stroke="#DC2626" strokeWidth={2} fill="none" strokeDasharray="5 5" />
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
                       <button type="submit" className="flex-1 py-2.5 rounded-xl bg-[#5C3D2E] text-white font-bold text-xs uppercase hover:bg-[#A66037] transition-all flex items-center justify-center gap-1 cursor-pointer">
                          <Check className="w-3.5 h-3.5" /> Confirmer
                       </button>
                       <button type="button" onClick={() => setIsEditingGoal(false)} className="px-3 py-2.5 rounded-xl border border-[#E8DCC4] text-[#A66037] hover:bg-[#FAF3E0] transition-all cursor-pointer">
                          <X className="w-3.5 h-3.5" />
                       </button>
                    </div>
                 </form>
               ) : (
                 <div className="flex flex-col items-center py-6 relative z-10">
                    <div className="relative flex items-center justify-center">
                       <svg height={110} width={110} className="transform -rotate-90 drop-shadow-md">
                         <circle stroke="#FAF3E0" fill="transparent" strokeWidth={8} r={43} cx={55} cy={55} />
                         <circle
                           stroke={progressPercent >= 100 ? "#D4AF37" : "#A66037"}
                           fill="transparent"
                           strokeWidth={8}
                           strokeDasharray={`${2 * Math.PI * 43} ${2 * Math.PI * 43}`}
                           style={{ strokeDashoffset: (2 * Math.PI * 43) - (progressPercent / 100) * (2 * Math.PI * 43) }}
                           strokeLinecap="round"
                           r={43} cx={55} cy={55}
                           className="transition-all duration-1000 ease-out"
                         />
                       </svg>
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

          {/* Recent Operations, PieChart & Urgent Collections */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
             {/* Recent Operations */}
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

             {/* Modes de Paiement PieChart */}
             <div className="chart-box lg:col-span-1 bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4] flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-xl text-primary font-dogon mb-2">Modes de Paiement</h3>
                  <p className="text-xs text-[#B89E7E] mb-6 font-medium">Répartition de la trésorerie encaissée.</p>
                </div>
                <div className="h-[180px] w-full flex items-center justify-center relative">
                   {pieData.length > 0 ? (
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={4} dataKey="value">
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
                     <div className="text-center text-[#B89E7E] italic text-xs">Aucun encaissement sur cette période.</div>
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

             {/* Relances Prioritaires */}
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
        </>
      ) : (
        /* Performances Collaborateurs */
        <div className="space-y-8">
          {/* Month selector for the rankings */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-premium border border-[#E8DCC4]">
            <div>
              <h2 className="font-bold text-lg text-primary font-dogon">Classement Commercial Mensuel</h2>
              <p className="text-xs text-[#B89E7E] mt-0.5">Palmarès et performances des collaborateurs pour le mois sélectionné.</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-[#A66037] uppercase tracking-wider">Choisir le mois :</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2.5 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-colors"
              >
                {MONTHS_LIST.map((m, index) => (
                  <option key={index} value={index}>{m}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2.5 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer transition-colors"
              >
                {[2024, 2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Premium Visual Podium */}
          {agentPerformance.some(a => a.sales > 0) ? (
            <div className="bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4] flex flex-col items-center">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="w-6 h-6 text-[#D4AF37] animate-bounce" />
                <h3 className="font-bold text-xl text-primary font-dogon uppercase tracking-wide">Le Podium des Commerciaux</h3>
              </div>
              
              <div className="flex items-end justify-center gap-4 sm:gap-8 w-full max-w-2xl py-6">
                {/* 2nd Place */}
                {agentPerformance[1] && agentPerformance[1].sales > 0 && (
                  <div className="flex flex-col items-center w-1/3 group">
                    <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center font-bold text-slate-700 text-xs shadow-sm mb-2 transition-transform duration-300 group-hover:scale-110">
                      {agentPerformance[1].name.charAt(0)}
                    </div>
                    <p className="text-xs font-bold text-primary text-center truncate w-full">{agentPerformance[1].name}</p>
                    <p className="text-[10px] font-bold text-emerald-600 mb-3">{agentPerformance[1].sales.toLocaleString()} {enterprise.currency}</p>
                    <div className="w-full bg-gradient-to-t from-slate-200 to-slate-100 border-x border-t border-slate-300 rounded-t-2xl flex flex-col items-center justify-center p-4 min-h-[110px] shadow-md shadow-slate-100">
                      <span className="text-3xl font-black text-slate-400 font-dogon">2</span>
                      <span className="text-[9px] font-extrabold text-slate-500 uppercase tracking-widest mt-1">Argent 🥈</span>
                    </div>
                  </div>
                )}

                {/* 1st Place */}
                {agentPerformance[0] && agentPerformance[0].sales > 0 && (
                  <div className="flex flex-col items-center w-1/3 group relative -top-4">
                    <div className="absolute -top-6 text-yellow-500 animate-pulse">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div className="w-12 h-12 rounded-full bg-amber-50 border border-[#D4AF37] flex items-center justify-center font-bold text-amber-700 text-sm shadow-md mb-2 transition-transform duration-300 group-hover:scale-110">
                      {agentPerformance[0].name.charAt(0)}
                    </div>
                    <p className="text-sm font-extrabold text-primary text-center truncate w-full">{agentPerformance[0].name}</p>
                    <p className="text-xs font-extrabold text-amber-600 mb-3">{agentPerformance[0].sales.toLocaleString()} {enterprise.currency}</p>
                    <div className="w-full bg-gradient-to-t from-[#D4AF37]/20 to-[#FAF3E0] border-x border-t border-[#D4AF37]/50 rounded-t-3xl flex flex-col items-center justify-center p-4 min-h-[150px] shadow-lg shadow-[#D4AF37]/5 relative">
                      <div className="absolute inset-0 bg-radial from-[#D4AF37]/10 via-transparent to-transparent pointer-events-none rounded-t-3xl" />
                      <span className="text-4xl font-black text-amber-600 font-dogon">1</span>
                      <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-widest mt-1">Or 🥇</span>
                    </div>
                  </div>
                )}

                {/* 3rd Place */}
                {agentPerformance[2] && agentPerformance[2].sales > 0 && (
                  <div className="flex flex-col items-center w-1/3 group">
                    <div className="w-10 h-10 rounded-full bg-amber-50 border border-orange-200 flex items-center justify-center font-bold text-orange-700 text-xs shadow-sm mb-2 transition-transform duration-300 group-hover:scale-110">
                      {agentPerformance[2].name.charAt(0)}
                    </div>
                    <p className="text-xs font-bold text-primary text-center truncate w-full">{agentPerformance[2].name}</p>
                    <p className="text-[10px] font-bold text-emerald-600 mb-3">{agentPerformance[2].sales.toLocaleString()} {enterprise.currency}</p>
                    <div className="w-full bg-gradient-to-t from-orange-100 to-orange-50 border-x border-t border-orange-200 rounded-t-2xl flex flex-col items-center justify-center p-4 min-h-[85px] shadow-sm shadow-orange-100">
                      <span className="text-2xl font-black text-orange-400 font-dogon">3</span>
                      <span className="text-[9px] font-extrabold text-orange-500 uppercase tracking-widest mt-1">Bronze 🥉</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4] flex flex-col items-center py-12">
              <Trophy className="w-12 h-12 text-[#E8DCC4] mb-3" />
              <p className="text-sm font-bold text-[#A66037] text-center">Aucune vente enregistrée pour ce mois.</p>
              <p className="text-xs text-[#B89E7E] text-center mt-1">Le podium attend son premier champion ! 🏆</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

           {/* Bar Chart */}
           <div className="chart-box lg:col-span-1 bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4]">
              <h3 className="font-bold text-xl text-primary font-dogon mb-2">Performances Comparées</h3>
              <p className="text-xs text-[#B89E7E] mb-8">Classement graphique des ventes et encaissements par agent commercial.</p>
              <div className="h-[400px] w-full">
                 {agentPerformance.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={agentPerformance.slice(0, 6)} layout="vertical" margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E8DCC460" />
                          <XAxis type="number" stroke="#B89E7E" fontSize={10} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toLocaleString()}k` : v} />
                          <YAxis dataKey="name" type="category" stroke="#B89E7E" fontSize={10} tickLine={false} width={80} />
                          <Tooltip 
                            formatter={(value: any) => [`${Number(value).toLocaleString()} ${enterprise.currency}`, "Montant"]}
                            contentStyle={{ backgroundColor: "#FAF3E0", borderRadius: "16px", border: "1px solid #E8DCC4", fontSize: "11px", fontFamily: "Outfit" }}
                          />
                          <Legend />
                          <Bar dataKey="sales" name="Ventes" fill="#A66037" radius={[0, 6, 6, 0]} />
                          <Bar dataKey="paid" name="Encaissé" fill="#059669" radius={[0, 6, 6, 0]} />
                       </BarChart>
                    </ResponsiveContainer>
                 ) : (
                    <div className="h-full flex items-center justify-center text-[#B89E7E] italic text-xs">
                      Aucune donnée de performance disponible.
                    </div>
                 )}
              </div>
           </div>

           {/* Leaderboard Honor Roll */}
           <div className="chart-box lg:col-span-2 bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4]">
              <h3 className="font-bold text-xl text-primary font-dogon mb-2">Tableau d&apos;Honneur</h3>
              <p className="text-xs text-[#B89E7E] mb-8">Médailles et indicateurs de performance des forces de vente.</p>
              
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-[#FAF3E0]/50 text-[#B89E7E] text-[10px] font-bold uppercase tracking-[0.2em]">
                       <tr>
                          <th className="px-6 py-4">Rang</th>
                          <th className="px-6 py-4">Collaborateur</th>
                          <th className="px-6 py-4">Saisies</th>
                          <th className="px-6 py-4">Total Ventes</th>
                          <th className="px-6 py-4">Encaissé</th>
                          <th className="px-6 py-4">Taux Recouvr.</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8DCC4]/20">
                       {agentPerformance.map((agent, index) => {
                          const rank = index + 1;
                          const rate = agent.sales > 0 ? Math.round((agent.paid / agent.sales) * 100) : 0;
                          
                          return (
                             <tr key={agent.id} className="hover:bg-[#FAF3E0]/15 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                   {rank === 1 ? (
                                      <span className="px-2 py-1 bg-yellow-100 text-yellow-700 font-bold rounded-lg text-xs flex items-center gap-1 w-fit border border-yellow-200">
                                         🥇 Or
                                      </span>
                                   ) : rank === 2 ? (
                                      <span className="px-2 py-1 bg-slate-100 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 w-fit border border-slate-200">
                                         🥈 Argent
                                      </span>
                                   ) : rank === 3 ? (
                                      <span className="px-2 py-1 bg-orange-100 text-orange-700 font-bold rounded-lg text-xs flex items-center gap-1 w-fit border border-orange-200">
                                         🥉 Bronze
                                      </span>
                                   ) : (
                                      <span className="text-xs font-bold text-[#B89E7E] px-2">#{rank}</span>
                                   )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                   <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-[#5C3D2E] text-white flex items-center justify-center font-bold text-xs">
                                         {agent.name.charAt(0)}
                                      </div>
                                      <div>
                                         <p className="text-xs font-bold text-primary">{agent.name}</p>
                                         <p className="text-[10px] text-[#B89E7E]">{agent.email}</p>
                                      </div>
                                   </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-[#5C3D2E]">
                                   {agent.count} ops
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-[#5C3D2E]">
                                   {agent.sales.toLocaleString()} {enterprise.currency}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-emerald-600">
                                   {agent.paid.toLocaleString()} {enterprise.currency}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                   <div className="flex items-center gap-2">
                                      <div className="w-12 bg-[#FAF3E0] h-2 rounded-full overflow-hidden border border-[#E8DCC4]/50">
                                         <div className="bg-[#059669] h-full rounded-full" style={{ width: `${rate}%` }} />
                                      </div>
                                      <span className="text-xs font-bold text-[#059669]">{rate}%</span>
                                   </div>
                                </td>
                             </tr>
                          );
                       })}
                       {agentPerformance.length === 0 && (
                          <tr>
                             <td colSpan={6} className="px-6 py-10 text-center text-[#B89E7E] italic text-xs uppercase tracking-widest">
                                Aucun agent actif trouvé.
                             </td>
                          </tr>
                       )}
                    </tbody>
                 </table>
              </div>
            </div>
          </div>
        </div>
       )}
    </div>
  );
}

interface KpiCardProps {
  title: string;
  value: string;
  trend: number;
  icon: React.ElementType;
  subtitle: string;
  showCurrency?: boolean;
  currency?: string;
  accentColor?: string;
}

const KpiCard = ({ title, value, trend, icon: Icon, subtitle, showCurrency = true, currency = "FCFA", accentColor = "#5C3D2E" }: KpiCardProps) => {
  const isPositive = trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? "text-emerald-600" : "text-red-500";
  const trendBg = isPositive ? "bg-emerald-50" : "bg-red-50";

  return (
    <div className="kpi-card bg-white p-6 rounded-[32px] shadow-premium border border-[#E8DCC4] relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-24 h-24 rounded-bl-[80px] -mr-6 -mt-6 transition-all duration-500"
           style={{ backgroundColor: `${accentColor}08` }} />
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-2xl transition-all duration-300 group-hover:scale-110"
               style={{ backgroundColor: `${accentColor}12`, color: accentColor }}>
            <Icon className="w-6 h-6" />
          </div>
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold ${trendBg} ${trendColor}`}>
            <TrendIcon className="w-3 h-3" />
            <span>{Math.abs(trend)}%</span>
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
};
