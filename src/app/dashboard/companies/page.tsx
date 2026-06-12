"use client";

import React, { useRef, useState, useEffect } from "react";
import { Plus, Search, Building2, Users, TrendingUp, MoreVertical, Globe, Loader2, Edit3, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";

const PIE_COLORS = ["#5C3D2E", "#A66037", "#D4AF37", "#8B5E3C", "#B89E7E", "#2D1A12"];
import { db } from "@/lib/firebase/config";
import CompanyModal from "@/components/dashboard/CompanyModal";
import toast from "react-hot-toast";
import { useAuth } from "@/context/AuthContext";
import { logAction } from "@/lib/audit";

interface Company {
  id: string;
  name: string;
  domain: string;
  location: string;
  phone?: string;
  email?: string;
}

export default function CompaniesPage() {
  const { profile } = useAuth();
  const container = useRef<HTMLDivElement>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editCompany, setEditCompany] = useState<Company | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
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
    const q = query(collection(db, "companies"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
      setCompanies(docs);
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

  const filteredCompanies = companies.filter(c => 
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.domain?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.location?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const [stats, setStats] = useState({ totalSales: 0, count: 0 });
  const [chartData, setChartData] = useState<{ name: string; sales: number }[]>([]);

  useEffect(() => {
    const qEntries = query(collection(db, "daily_entries"));
    const unsubscribe = onSnapshot(qEntries, (snapshot) => {
      let total = 0;
      const companySales: Record<string, number> = {};
      snapshot.docs.forEach(d => {
        const data = d.data();
        const sales = Number(data.totalAmount || 0);
        total += sales;
        const company = data.companyId || "Inconnue";
        companySales[company] = (companySales[company] || 0) + sales;
      });
      
      const formattedChart = Object.entries(companySales).map(([name, sales]) => ({
        name,
        sales
      })).sort((a, b) => b.sales - a.sales);

      setStats({ totalSales: total, count: snapshot.size });
      setChartData(formattedChart);
    });
    return () => unsubscribe();
  }, []);

  useGSAP(() => {
    if (!loading) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".page-header", { y: -20, opacity: 0, duration: 0.8 });
      tl.from(".stat-card", { scale: 0.9, opacity: 0, stagger: 0.1, duration: 0.6 });
      tl.from(".company-row", { y: 20, opacity: 0, stagger: 0.05, duration: 0.5 });
    }
  }, { scope: container, dependencies: [loading] });

  const handleEdit = (company: Company) => {
    setEditCompany(company);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (companyId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette entreprise ?")) return;
    const company = companies.find(c => c.id === companyId);
    const companyName = company ? company.name : companyId;
    try {
      await deleteDoc(doc(db, "companies", companyId));
      await logAction(profile?.uid, profile?.email, "company_delete", `Suppression de l'entreprise ${companyName}`, companyName);
      toast.success("Entreprise supprimée !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    }
    setActiveDropdown(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditCompany(null);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
       <Loader2 className="w-12 h-12 text-[#A66037] animate-spin mb-4" />
       <p className="text-[#A66037] font-bold">Récupération des archives filiales...</p>
    </div>
  );

  return (
    <div ref={container} className="space-y-8 pb-12 relative text-[#2D1A12]">
      <div className="absolute inset-0 dogon-pattern opacity-5 pointer-events-none" />
      
      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-20">
        <div>
          <h1 className="text-3xl font-bold text-[#5C3D2E] font-dogon uppercase tracking-tight">Gestion des Entreprises</h1>
          <p className="text-[#B89E7E] mt-1">Pilotez vos filiales et partenaires avec la sagesse Dogon.</p>
        </div>
        <Button 
          variant="gold" 
          className="rounded-2xl shadow-gold h-14 min-w-[240px] relative z-20"
          onClick={() => { setEditCompany(null); setIsModalOpen(true); }}
        >
          <Plus className="w-5 h-5 mr-3" />
          Ajouter une Entreprise
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
        {[
          { label: "Total Filiales", value: companies.length.toString(), icon: Building2, color: "bg-[#5C3D2E]" },
          { label: "Ventes Totales", value: stats.totalSales.toLocaleString() + " " + currency, icon: TrendingUp, color: "bg-[#A66037]" },
          { label: "Opérations", value: stats.count.toString(), icon: Users, color: "bg-[#D4AF37]" },
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

      {/* Comparative Performance Chart */}
      {chartData.length > 0 && (
        <div className="stat-card bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4] relative overflow-hidden z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-[#A66037] rounded-xl flex items-center justify-center text-white">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#5C3D2E] font-dogon">Performance des Filiales</h3>
              <p className="text-xs text-[#B89E7E]">Comparatif du chiffre d&apos;affaires consolidé par entreprise.</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#FAF3E0" vertical={false} />
                <XAxis dataKey="name" stroke="#B89E7E" fontSize={10} tickLine={false} />
                <YAxis stroke="#B89E7E" fontSize={10} tickLine={false} tickFormatter={(v) => `${(v / 1000).toLocaleString()}k`} />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString()} ${currency}`, "Ventes"]}
                  contentStyle={{ backgroundColor: "#FAF3E0", borderRadius: "16px", border: "1px solid #E8DCC4", fontSize: "12px", fontFamily: "Outfit" }}
                />
                <Bar dataKey="sales" fill="#A66037" radius={[8, 8, 0, 0]} maxBarSize={50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[40px] shadow-premium border border-[#E8DCC4] overflow-hidden relative z-10">
        <div className="p-8 border-b border-[#E8DCC4] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative group flex-1 max-w-md">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B89E7E]" />
             <input 
               placeholder="Filtrer par nom ou secteur..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-14 pr-6 py-4 rounded-2xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-medium text-[#2D1A12] outline-none transition-all" 
             />
          </div>
          <p className="text-sm font-bold text-[#B89E7E]">{filteredCompanies.length} entreprise(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF3E0]/50 text-[#B89E7E] text-[10px] font-bold uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Filiale</th>
                <th className="px-8 py-5">Secteur</th>
                <th className="px-8 py-5">Siège</th>
                <th className="px-8 py-5">Statut</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC4]/30">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="company-row hover:bg-[#FAF3E0]/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 rounded-xl bg-[#FAF3E0] flex items-center justify-center text-[#A66037] border border-[#E8DCC4]">
                          <Building2 className="w-5 h-5" />
                       </div>
                       <span className="font-bold text-[#5C3D2E]">{company.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                     <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-[#D4AF37]" />
                        <span className="text-sm font-bold text-[#A66037]">{company.domain}</span>
                     </div>
                  </td>
                  <td className="px-8 py-6">
                     <span className="text-sm text-[#B89E7E] font-medium">{company.location}</span>
                  </td>
                  <td className="px-8 py-6">
                     <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Opérationnel</span>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <button 
                      className="p-3 rounded-xl hover:bg-[#E8DCC4]/30 transition-colors text-[#B89E7E]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === company.id ? null : company.id);
                      }}
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {activeDropdown === company.id && (
                      <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="dropdown-item" onClick={() => handleEdit(company)}>
                          <Edit3 className="w-4 h-4" /> Modifier
                        </button>
                        <button className="dropdown-item danger" onClick={() => handleDelete(company.id)}>
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCompanies.length === 0 && (
                 <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-[#B89E7E] italic uppercase tracking-widest text-xs">
                       {searchTerm ? `Aucun résultat pour "${searchTerm}".` : "Aucune entreprise enregistrée. Cliquez sur 'Ajouter une Entreprise'."}
                    </td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <CompanyModal isOpen={isModalOpen} onClose={handleCloseModal} editCompany={editCompany} />
    </div>
  );
}
