"use client";

import React, { useRef, useState, useEffect } from "react";
import { Plus, ShieldCheck, MoreVertical, Search, Sparkles, Loader2, Edit3, Trash2, Activity, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { collection, onSnapshot, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import UserModal from "@/components/dashboard/UserModal";
import UserActivityDrawer from "@/components/dashboard/UserActivityDrawer";
import toast from "react-hot-toast";

interface Collaborator {
  id: string;
  displayName: string;
  role: string;
  email: string;
  active: boolean;
  entriesCount?: number;
}

export default function UsersPage() {
  const container = useRef<HTMLDivElement>(null);
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<Collaborator | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isActivityOpen, setIsActivityOpen] = useState(false);
  const [selectedUserForActivity, setSelectedUserForActivity] = useState<Collaborator | null>(null);

  const handleOpenActivity = (user: Collaborator) => {
    setSelectedUserForActivity(user);
    setIsActivityOpen(true);
    setActiveDropdown(null);
  };

  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("displayName", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Collaborator));
      setCollaborators(docs);
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

  const filteredCollaborators = collaborators.filter(u => {
    const matchesSearch = u.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Role stats
  const roleStats = {
    super_admin: collaborators.filter(c => c.role === "super_admin").length,
    admin_entreprise: collaborators.filter(c => c.role === "admin_entreprise").length,
    superviseur: collaborators.filter(c => c.role === "superviseur").length,
    commerciale: collaborators.filter(c => c.role === "commerciale").length,
  };

  // Dynamic avatar color from name hash
  const getAvatarColor = (name: string) => {
    let hash = 0;
    for (let i = 0; i < (name || "").length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash % 360);
    return `hsl(${hue}, 55%, 45%)`;
  };

  useGSAP(() => {
    if (!loading) {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.from(".page-header", { y: -20, opacity: 0, duration: 0.8 });
      tl.from(".user-row", { y: 20, opacity: 0, stagger: 0.1, duration: 0.6 });
    }
  }, { scope: container, dependencies: [loading] });

  const handleEdit = (user: Collaborator) => {
    setEditUser(user);
    setIsModalOpen(true);
    setActiveDropdown(null);
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce collaborateur ?")) return;
    try {
      await deleteDoc(doc(db, "users", userId));
      toast.success("Collaborateur supprimé !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression.");
    }
    setActiveDropdown(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditUser(null);
  };

  if (loading) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
       <Loader2 className="w-12 h-12 text-[#A66037] animate-spin mb-4" />
       <p className="text-[#5C3D2E] font-bold">Appel des forces de vente...</p>
    </div>
  );

  return (
    <div ref={container} className="space-y-8 pb-12 relative text-[#2D1A12]">
      <div className="absolute inset-0 dogon-pattern opacity-5 pointer-events-none" />

      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-[#5C3D2E] font-dogon uppercase tracking-tight">Forces de Vente</h1>
          <p className="text-[#B89E7E] mt-1">Gérez vos collaboratrices et leurs niveaux d&apos;accès.</p>
        </div>
        <Button 
          variant="gold" 
          className="rounded-2xl shadow-gold h-14 min-w-[240px]"
          onClick={() => { setEditUser(null); setIsModalOpen(true); }}
        >
          <Plus className="w-5 h-5 mr-3" />
          Nouvelle Collaboratrice
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {[
          { label: "Total", count: collaborators.length, bg: "bg-[#5C3D2E]", text: "text-[#2D1A12]", filter: "all" },
          { label: "Admins", count: roleStats.super_admin + roleStats.admin_entreprise, bg: "bg-[#D4AF37]", text: "text-[#D4AF37]", filter: "admin" },
          { label: "Superviseurs", count: roleStats.superviseur, bg: "bg-[#A66037]", text: "text-[#A66037]", filter: "superviseur" },
          { label: "Commerciales", count: roleStats.commerciale, bg: "bg-emerald-500", text: "text-emerald-600", filter: "commerciale" },
        ].map((s, i) => (
          <button
            key={i}
            onClick={() => setRoleFilter(s.filter === "admin" ? (roleFilter === "super_admin" || roleFilter === "admin_entreprise" ? "all" : "super_admin") : (roleFilter === s.filter ? "all" : s.filter))}
            className={`bg-white p-4 rounded-2xl shadow-premium border border-[#E8DCC4] flex items-center gap-3 hover:shadow-dogon hover:-translate-y-1 transition-all duration-300 cursor-pointer text-left ${
              (roleFilter === s.filter || (s.filter === "admin" && (roleFilter === "super_admin" || roleFilter === "admin_entreprise"))) ? "ring-2 ring-[#D4AF37]" : ""
            }`}
          >
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center text-white`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[9px] font-bold text-[#B89E7E] uppercase tracking-widest">{s.label}</p>
              <p className={`text-xl font-bold font-dogon ${s.text}`}>{s.count}</p>
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-[40px] shadow-premium border border-[#E8DCC4] overflow-hidden relative z-10">
        <div className="p-8 border-b border-[#E8DCC4] flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FAF3E0]/30">
          <div className="relative group min-w-[320px]">
             <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B89E7E]" />
             <input 
               placeholder="Rechercher une force de vente..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] font-medium text-[#5C3D2E] outline-none transition-all" 
             />
          </div>
          <p className="text-sm font-bold text-[#B89E7E]">{filteredCollaborators.length} collaborateur(s)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-[#FAF3E0]/50 text-[#B89E7E] text-[10px] font-bold uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Collaboratrice</th>
                <th className="px-8 py-5">Rôle & Rang</th>
                <th className="px-8 py-5">Statut</th>
                <th className="px-8 py-5">Activités</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8DCC4]/30">
              {filteredCollaborators.map((user) => (
                <tr key={user.id} className="user-row hover:bg-[#FAF3E0]/20 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-[#5C3D2E] flex items-center justify-center text-white font-bold relative overflow-hidden">
                          {user.displayName?.charAt(0) || "U"}
                          <div className="absolute inset-0 dogon-pattern opacity-10" />
                       </div>
                       <div>
                          <p className="font-bold text-[#5C3D2E]">{user.displayName || "Utilisateur"}</p>
                          <p className="text-xs text-[#B89E7E]">{user.email}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
                       <span className="text-sm font-bold text-[#A66037] uppercase tracking-tighter">{user.role?.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                       user.active !== false ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    }`}>
                       {user.active !== false ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex flex-col gap-1">
                       <div className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-[#D4AF37]" />
                          <span className="font-bold text-[#5C3D2E]">{user.entriesCount || 0} saisies</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right relative">
                    <button 
                      className="p-3 rounded-xl hover:bg-[#E8DCC4]/30 transition-colors text-[#B89E7E]"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveDropdown(activeDropdown === user.id ? null : user.id);
                      }}
                    >
                       <MoreVertical className="w-5 h-5" />
                    </button>
                    
                    {activeDropdown === user.id && (
                      <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                        <button className="dropdown-item" onClick={() => handleOpenActivity(user)}>
                          <Activity className="w-4 h-4" /> Activité commerciale
                        </button>
                        <button className="dropdown-item" onClick={() => handleEdit(user)}>
                          <Edit3 className="w-4 h-4" /> Modifier
                        </button>
                        <button className="dropdown-item danger" onClick={() => handleDelete(user.id)}>
                          <Trash2 className="w-4 h-4" /> Supprimer
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
               {filteredCollaborators.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center italic text-[#B89E7E]">
                      {searchTerm ? `Aucun résultat pour "${searchTerm}".` : "Aucun utilisateur enregistré."}
                    </td>
                  </tr>
               )}
            </tbody>
          </table>
        </div>
      </div>
      <UserModal isOpen={isModalOpen} onClose={handleCloseModal} editUser={editUser} />
      <UserActivityDrawer 
        isOpen={isActivityOpen} 
        onClose={() => { setIsActivityOpen(false); setSelectedUserForActivity(null); }} 
        user={selectedUserForActivity} 
      />
    </div>
  );
}
