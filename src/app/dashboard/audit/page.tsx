"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  ShieldAlert, 
  Search, 
  Clock, 
  User, 
  Tag, 
  Building, 
  ArrowDownCircle, 
  Filter, 
  Loader2,
  Calendar,
  Activity,
  FileText
} from "lucide-react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  companyId: string;
  timestamp: string;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  sale_create: { label: "Création Vente", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  sale_update: { label: "Mise à Jour Vente", color: "bg-blue-50 text-blue-700 border-blue-200" },
  sale_delete: { label: "Suppression Vente", color: "bg-red-50 text-red-700 border-red-200" },
  company_create: { label: "Création Filiale", color: "bg-purple-50 text-purple-700 border-purple-200" },
  company_update: { label: "Mise à Jour Filiale", color: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  company_delete: { label: "Suppression Filiale", color: "bg-rose-50 text-rose-700 border-rose-200" },
  user_create: { label: "Intégration Agent", color: "bg-amber-50 text-amber-700 border-amber-200" },
  user_update: { label: "Mise à Jour Agent", color: "bg-orange-50 text-orange-700 border-orange-200" },
  export_pdf: { label: "Export PDF", color: "bg-teal-50 text-teal-700 border-teal-200" },
  export_xlsx: { label: "Export Excel", color: "bg-cyan-50 text-cyan-700 border-cyan-200" }
};

export default function AuditPage() {
  const { profile, loading } = useAuth();
  const container = useRef<HTMLDivElement>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    // Only subscribe to database if user is authorized
    if (loading || !profile) return;
    
    const isAuthorized = ["super_admin", "admin_entreprise", "superviseur"].includes(profile.role);
    if (!isAuthorized) {
      setDataLoading(false);
      return;
    }

    const q = query(collection(db, "audit_logs"), orderBy("timestamp", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AuditLog));
      setLogs(docs);
      setDataLoading(false);
    }, (error) => {
      console.error("Audit Logs fetch error:", error);
      setDataLoading(false);
    });

    return () => unsubscribe();
  }, [profile, loading]);

  useGSAP(() => {
    if (!dataLoading && profile && ["super_admin", "admin_entreprise", "superviseur"].includes(profile.role)) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".page-header", { y: -20, opacity: 0, duration: 0.8 });
      tl.from(".stat-card", { scale: 0.9, opacity: 0, stagger: 0.1, duration: 0.6 }, "-=0.4");
      tl.from(".log-row", { y: 15, opacity: 0, stagger: 0.04, duration: 0.5 }, "-=0.2");
    }
  }, { scope: container, dependencies: [dataLoading] });

  // Access Control check
  if (loading || dataLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#A66037] animate-spin mb-4" />
        <p className="text-[#5C3D2E] font-bold">Sécurisation et décryptage des écritures...</p>
      </div>
    );
  }

  const isAuthorized = profile && ["super_admin", "admin_entreprise", "superviseur"].includes(profile.role);

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-24 h-24 bg-red-50 rounded-[32px] flex items-center justify-center border border-red-200 shadow-xl shadow-red-500/10 mb-8 animate-bounce">
          <ShieldAlert className="w-12 h-12 text-red-600" />
        </div>
        <h2 className="text-3xl font-bold font-dogon text-[#5C3D2E] uppercase tracking-wide mb-4">Accès Refusé</h2>
        <p className="text-[#B89E7E] max-w-md mx-auto leading-relaxed">
          Seuls les esprits gardiens (Super Admin, Admin ou Superviseur) sont habilités à consulter le grimoire des audits de NYA BLO.
        </p>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.companyId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === "all" || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  // Basic aggregation metrics for header
  const today = new Date().toISOString().split("T")[0];
  const logsToday = logs.filter(l => l.timestamp?.startsWith(today)).length;
  const uniqueUsers = new Set(logs.map(l => l.userEmail)).size;
  const totalExports = logs.filter(l => l.action.startsWith("export_")).length;

  return (
    <div ref={container} className="space-y-8 pb-12 relative text-[#2D1A12]">
      <div className="absolute inset-0 dogon-pattern opacity-5 pointer-events-none" />

      {/* Header */}
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-[#5C3D2E] font-dogon uppercase tracking-tight">Journal d&apos;Audit & Sécurité</h1>
          <p className="text-[#B89E7E] mt-1">Traçabilité complète des actions administratives et commerciales.</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {[
          { label: "Actions Aujourd'hui", value: logsToday.toString(), icon: Activity, color: "bg-[#5C3D2E]" },
          { label: "Utilisateurs Actifs", value: uniqueUsers.toString(), icon: User, color: "bg-[#A66037]" },
          { label: "Rapports Générés", value: totalExports.toString(), icon: FileText, color: "bg-[#D4AF37]" },
        ].map((stat, i) => (
          <div key={i} className="stat-card bg-white p-6 rounded-3xl shadow-premium border border-[#E8DCC4] flex items-center gap-6 hover:shadow-dogon hover:-translate-y-1 transition-all duration-300">
            <div className={`w-14 h-14 rounded-2xl ${stat.color} flex items-center justify-center text-[#FAF3E0] shadow-lg`}>
              <stat.icon className="w-7 h-7" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest">{stat.label}</p>
              <p className="text-2xl font-bold font-dogon text-[#2D1A12] leading-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-[40px] shadow-premium border border-[#E8DCC4] overflow-hidden relative z-10">
        <div className="p-8 border-b border-[#E8DCC4]/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B89E7E]" />
            <input 
              placeholder="Rechercher par email, action ou filiale..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-medium text-[#2D1A12] outline-none transition-all" 
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#A66037] uppercase tracking-wider">
              <Filter className="w-4 h-4" /> Filtrer :
            </div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-5 py-3.5 rounded-2xl bg-[#FAF3E0]/50 border border-[#E8DCC4] text-xs font-bold text-[#5C3D2E] outline-none focus:ring-2 focus:ring-[#D4AF37]/20 cursor-pointer"
            >
              <option value="all">Toutes les actions</option>
              <option value="sale_create">Création de saisies</option>
              <option value="sale_update">Modification de saisies</option>
              <option value="sale_delete">Suppression de saisies</option>
              <option value="company_create">Création de filiales</option>
              <option value="company_delete">Suppression de filiales</option>
              <option value="user_create">Intégration d&apos;agents</option>
              <option value="user_update">Mise à jour d&apos;agents</option>
              <option value="export_pdf">Génération PDF</option>
              <option value="export_xlsx">Génération Excel</option>
            </select>
            <p className="text-xs font-bold text-[#B89E7E] ml-2">{filteredLogs.length} ligne(s)</p>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF3E0]/50 text-[#B89E7E] text-[10px] font-bold uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Date & Heure</th>
                <th className="px-8 py-5">Utilisateur</th>
                <th className="px-8 py-5">Action</th>
                <th className="px-8 py-5">Détails de l&apos;Opération</th>
                <th className="px-8 py-5">Cible</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC4]/20">
              {filteredLogs.map((log) => {
                const actionMeta = ACTION_LABELS[log.action] || { label: log.action, color: "bg-slate-50 text-slate-700 border-slate-200" };
                const dateObj = new Date(log.timestamp);
                const dateStr = dateObj.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
                const timeStr = dateObj.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

                return (
                  <tr key={log.id} className="log-row hover:bg-[#FAF3E0]/15 transition-colors">
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-[#B89E7E]" />
                        <span className="text-xs font-bold text-[#5C3D2E]">{dateStr}</span>
                        <span className="text-[10px] text-[#A66037] font-medium">{timeStr}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-[#E8DCC4] flex items-center justify-center text-[9px] font-bold text-[#5C3D2E]">
                          {log.userEmail?.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-xs font-semibold text-primary">{log.userEmail}</span>
                      </div>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${actionMeta.color}`}>
                        {actionMeta.label}
                      </span>
                    </td>
                    <td className="px-8 py-5 max-w-md">
                      <p className="text-xs font-medium text-[#2D1A12] leading-relaxed break-words">{log.details}</p>
                    </td>
                    <td className="px-8 py-5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#A66037] uppercase tracking-tight">
                        <Building className="w-3.5 h-3.5 text-[#B89E7E]" />
                        <span>{log.companyId}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-20 text-center text-[#B89E7E] italic uppercase tracking-widest text-xs">
                    Aucun événement de sécurité trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
