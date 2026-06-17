"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import GSAPWrapper from "@/components/GSAPWrapper";
import { Bell, Search, UserCircle, Menu, Sun, Moon, X, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import NommoAI from "@/components/dashboard/NommoAI";
import { collection, query, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface Notification {
  id: string;
  type: "sale" | "alert" | "system";
  message: string;
  createdAt: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!loading && (!user || !profile)) {
      router.push("/login");
    }
  }, [user, profile, loading, router]);

  // Load theme preference on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    let isDark = false;
    if (savedTheme) {
      isDark = savedTheme === "dark";
    } else {
      isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    }
    setIsDarkMode(isDark);
    if (isDark) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#150C07";
      document.body.style.color = "#F5E8D8";
    } else {
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#FAF3E0";
      document.body.style.color = "#1A0A04";
    }
  }, []);

  // Load read notification IDs from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("nyablo_read_notifs") || "[]");
      setReadIds(new Set(stored));
    } catch {}
  }, []);

  // Real-time notifications from latest daily_entries
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, "daily_entries"), orderBy("createdAt", "desc"), limit(8));
    const unsub = onSnapshot(q, (snap) => {
      const notifs: Notification[] = snap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: "sale",
          message: `Nouvelle saisie : ${data.clientName || "Client"} — ${Number(data.totalAmount || 0).toLocaleString()} FCFA`,
          createdAt: data.createdAt || data.date || new Date().toISOString(),
        };
      });
      setNotifications(notifs);
    });
    return () => unsub();
  }, [user]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      localStorage.setItem("theme", "dark");
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#150C07";
      document.body.style.color = "#F5E8D8";
    } else {
      localStorage.setItem("theme", "light");
      document.documentElement.setAttribute("data-theme", "light");
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#FAF3E0";
      document.body.style.color = "#1A0A04";
    }
  };

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length;

  const markAllRead = () => {
    const allIds = notifications.map(n => n.id);
    const newSet = new Set([...readIds, ...allIds]);
    setReadIds(newSet);
    localStorage.setItem("nyablo_read_notifs", JSON.stringify(Array.from(newSet)));
  };

  const getTimeAgo = (dateStr: string) => {
    try {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "À l'instant";
      if (mins < 60) return `Il y a ${mins} min`;
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return `Il y a ${hrs}h`;
      return `Il y a ${Math.floor(hrs / 24)}j`;
    } catch { return "Récemment"; }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary" />
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${isDarkMode ? "dark" : ""}`} style={{ backgroundColor: 'var(--bg-base)', color: 'var(--fg-base)' }}>
      {/* Large screen sidebar */}
      <div className="hidden lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div className="w-72 h-full" onClick={(e) => e.stopPropagation()}>
             <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#E8DCC4] sticky top-0 z-30 px-6 flex items-center justify-between">
          <div className="flex items-center gap-4 lg:hidden">
             <button 
               className="p-2 hover:bg-[#FAF3E0] rounded-lg transition-colors cursor-pointer"
               onClick={() => setIsMobileMenuOpen(true)}
             >
                <Menu className="w-6 h-6 text-[#5C3D2E]" />
             </button>
             <h1 className="font-bold font-dogon text-[#5C3D2E] tracking-tight">NYA BLO</h1>
          </div>

          <div className="hidden md:flex items-center gap-3 bg-[#FAF3E0]/50 px-4 py-2.5 rounded-xl border border-[#E8DCC4] w-full max-w-md">
            <Search className="w-4 h-4 text-[#B89E7E]" />
            <input 
              type="text" 
              placeholder="Rechercher avec précision..." 
              className="bg-transparent border-none outline-none text-sm w-full text-[#2D1A12] placeholder-[#B89E7E]"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Theme toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2.5 hover:bg-[#FAF3E0]/50 rounded-xl border border-[#E8DCC4] transition-all duration-300 group flex items-center justify-center cursor-pointer"
              title={isDarkMode ? "Thème clair" : "Thème sombre"}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-[#D4AF37]" />
              ) : (
                <Moon className="w-5 h-5 text-[#5C3D2E] group-hover:rotate-12 transition-transform" />
              )}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => {
                  const newState = !notifOpen;
                  setNotifOpen(newState);
                  if (newState) markAllRead();
                }}
                className="relative p-2.5 hover:bg-[#FAF3E0] rounded-xl border border-[#E8DCC4] transition-colors group cursor-pointer"
              >
                <Bell className="w-5 h-5 text-[#B89E7E] group-hover:text-[#A66037]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-[#A66037] text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-sm animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Panel */}
              {notifOpen && (
                <div className="absolute right-0 top-full mt-3 w-96 bg-white rounded-[24px] shadow-2xl border border-[#E8DCC4] overflow-hidden z-50">
                  <div className="p-5 border-b border-[#E8DCC4]/50 flex items-center justify-between bg-[#FAF3E0]/40">
                    <div>
                      <h3 className="font-bold text-[#5C3D2E] font-dogon">Activité Récente</h3>
                      <p className="text-[10px] text-[#B89E7E] uppercase tracking-wider">Dernières saisies — temps réel</p>
                    </div>
                    <button onClick={() => setNotifOpen(false)} className="p-1.5 hover:bg-[#E8DCC4]/50 rounded-lg transition-colors cursor-pointer">
                      <X className="w-4 h-4 text-[#B89E7E]" />
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="py-12 text-center text-[#B89E7E] italic text-sm">
                        <Bell className="w-8 h-8 mx-auto mb-3 opacity-30" />
                        Aucune activité récente
                      </div>
                    ) : (
                      notifications.map(notif => {
                        const isRead = readIds.has(notif.id);
                        return (
                          <div key={notif.id} className={`flex items-start gap-3 p-4 border-b border-[#E8DCC4]/20 transition-colors hover:bg-[#FAF3E0]/30 ${!isRead ? "bg-[#FAF3E0]/20" : ""}`}>
                            <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-emerald-100">
                              <TrendingUp className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-[#2D1A12] leading-snug">{notif.message}</p>
                              <p className="text-[10px] text-[#B89E7E] mt-1">{getTimeAgo(notif.createdAt)}</p>
                            </div>
                            {!isRead && <span className="w-2 h-2 bg-[#D4AF37] rounded-full shrink-0 mt-2" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 border-t border-[#E8DCC4]/30 bg-[#FAF3E0]/20 text-center">
                      <button
                        onClick={() => { setNotifOpen(false); router.push("/dashboard/entries"); }}
                        className="text-xs font-bold text-[#A66037] hover:text-[#5C3D2E] transition-colors cursor-pointer"
                      >
                        Voir toutes les saisies →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="h-8 w-[1px] bg-[#E8DCC4] mx-1" />
            <div className="flex items-center gap-3 pl-1">
               <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-[#2D1A12] leading-none mb-1 uppercase tracking-wider">{profile?.displayName}</p>
                  <p className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest">{profile?.role?.replace('_', ' ')}</p>
               </div>
               <div className="w-10 h-10 rounded-xl bg-[#5C3D2E] flex items-center justify-center border border-[#5C3D2E]/10 shadow-lg shadow-[#5C3D2E]/20">
                  <UserCircle className="w-7 h-7 text-[#FAF3E0]" />
               </div>
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 md:p-10 max-w-7xl w-full mx-auto relative">
          <div className="absolute inset-0 dogon-pattern opacity-5 pointer-events-none" />
          <GSAPWrapper>
            {children}
          </GSAPWrapper>
          
          <NommoAI />
        </main>
      </div>

      {/* Close notif panel when clicking outside */}
      {notifOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setNotifOpen(false)} />
      )}
    </div>
  );
}
