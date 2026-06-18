"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Building2, 
  History, 
  FileText, 
  Settings, 
  LogOut, 
  LayoutDashboard,
  Users,
  ShieldCheck,
  ChevronRight,
  Gift,
  X
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const MENU_ITEMS = [
  { icon: LayoutDashboard, label: "Vue d'ensemble", href: "/dashboard" },
  { icon: History, label: "Saisies de Vente", href: "/dashboard/entries" },
  { icon: Building2, label: "Entreprises", href: "/dashboard/companies" },
  { icon: Users, label: "Forces de Vente", href: "/dashboard/users" },
  { icon: Gift, label: "Parrainages & Codes", href: "/dashboard/parrainage" },
  { icon: ShieldCheck, label: "Journal d'Audit", href: "/dashboard/audit" },
  { icon: FileText, label: "Archives & Exports", href: "/dashboard/exports" },
  { icon: Settings, label: "Paramètres", href: "/dashboard/settings" },
];

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useAuth();
  const container = React.useRef(null);

  useGSAP(() => {
    const items = container.current
      ? (container.current as HTMLElement).querySelectorAll(".nav-item")
      : [];
    if (items.length === 0) return;
    gsap.set(items, { x: -30, autoAlpha: 0 });
    gsap.to(items, {
      x: 0,
      autoAlpha: 1,
      stagger: 0.08,
      duration: 0.7,
      ease: "power3.out",
      delay: 0.1,
    });
  }, { scope: container });

  const handleNavClick = () => {
    if (onNavigate) onNavigate();
  };

  const filteredMenuItems = MENU_ITEMS.filter(item => {
    if (item.href === "/dashboard/audit") {
      return profile && ["super_admin", "admin_entreprise", "superviseur"].includes(profile.role);
    }
    return true;
  });

  return (
    <div ref={container} className="w-72 h-screen bg-[#2D1A12] text-[#F7EAE3] flex flex-col sticky top-0 border-r border-[#5C3D2E]/50">
      <div className="p-8 pb-12 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={handleNavClick}>
          <div className="w-12 h-12 bg-[#D4AF37] rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(212,175,55,0.3)] group-hover:rotate-12 transition-transform">
             <ShieldCheck className="w-7 h-7 text-[#2D1A12]" />
          </div>
          <div className="font-dogon">
            <h1 className="text-xl font-bold tracking-tighter leading-none">NYA BLO</h1>
            <p className="text-[10px] text-[#D4AF37] font-bold tracking-[0.3em] uppercase mt-1">Symmetry & Earth</p>
          </div>
        </Link>
        {onNavigate && (
          <button onClick={onNavigate} className="lg:hidden p-2 hover:bg-white/10 rounded-xl transition-colors">
            <X className="w-5 h-5 text-[#B89E7E]" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto custom-scrollbar">
        {filteredMenuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleNavClick}
              className={`nav-item flex items-center justify-between px-5 py-4 rounded-2xl transition-all group ${
                isActive 
                ? "bg-[#D4AF37] text-[#2D1A12] shadow-dogon font-bold" 
                : "text-[#E8DCC4] hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-4">
                <item.icon className={`w-5 h-5 ${isActive ? "text-[#2D1A12]" : "text-[#B89E7E] group-hover:text-[#D4AF37] transition-colors"}`} />
                <span className="text-sm tracking-tight">{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-white/5">
        <div className="bg-[#5C3D2E]/30 p-4 rounded-2xl mb-4 border border-[#5C3D2E]/50">
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#A66037] flex items-center justify-center text-lg font-bold">
                 {profile?.displayName?.charAt(0) || "U"}
              </div>
              <div className="min-w-0">
                 <p className="text-xs font-bold truncate">{profile?.displayName}</p>
                 <p className="text-[10px] text-[#E8DCC4] uppercase tracking-widest">{profile?.role?.replace('_', ' ')}</p>
              </div>
           </div>
        </div>
        
        <button 
          onClick={() => signOut(auth)}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-300 hover:bg-red-500/10 hover:text-red-400 transition-all font-bold text-sm"
        >
          <LogOut className="w-5 h-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
