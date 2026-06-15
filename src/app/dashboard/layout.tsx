"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import GSAPWrapper from "@/components/GSAPWrapper";
import { Bell, Search, UserCircle, Menu, X, Sun, Moon } from "lucide-react";

import NommoAI from "@/components/dashboard/NommoAI";

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
    // Also set on documentElement so body inherits dark styles
    if (isDark) {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#1A0F0A";
      document.body.style.color = "#F7EAE3";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#FAF3E0";
      document.body.style.color = "#2D1A12";
    }
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleTheme = () => {
    const nextMode = !isDarkMode;
    setIsDarkMode(nextMode);
    if (nextMode) {
      localStorage.setItem("theme", "dark");
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#1A0F0A";
      document.body.style.color = "#F7EAE3";
    } else {
      localStorage.setItem("theme", "light");
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#FAF3E0";
      document.body.style.color = "#2D1A12";
    }
  };


  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-secondary" />
      </div>
    );
  }

  return (
    <div className={`flex min-h-screen bg-[#FAF3E0] text-[#2D1A12] transition-colors duration-300 ${isDarkMode ? "dark bg-[#1A0F0A] text-[#F7EAE3]" : ""}`}>
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
               className="p-2 hover:bg-[#FAF3E0] rounded-lg transition-colors"
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
            <button 
              onClick={toggleTheme}
              className="p-2.5 hover:bg-[#FAF3E0]/50 rounded-xl border border-[#E8DCC4] transition-all duration-300 group flex items-center justify-center cursor-pointer"
              title={isDarkMode ? "Thème clair" : "Thème sombre"}
            >
              {isDarkMode ? (
                <Sun className="w-5 h-5 text-[#D4AF37] animate-spin-slow" />
              ) : (
                <Moon className="w-5 h-5 text-[#5C3D2E] group-hover:rotate-12 transition-transform" />
              )}
            </button>
            <button className="relative p-2.5 hover:bg-[#FAF3E0] rounded-xl border border-[#E8DCC4] transition-colors group">
              <Bell className="w-5 h-5 text-[#B89E7E] group-hover:text-[#A66037]" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#A66037] rounded-full border-2 border-white" />
            </button>
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
    </div>
  );
}
