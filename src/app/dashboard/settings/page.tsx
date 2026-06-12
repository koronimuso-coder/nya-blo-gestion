"use client";

import React, { useRef, useState, useEffect } from "react";
import { User, Shield, Bell, Database, Save, Camera, Sparkles, Building, Globe, Loader2, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc, setDoc, addDoc, collection, onSnapshot, getDocs, increment } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast from "react-hot-toast";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { logAction } from "@/lib/audit";

const TABS = [
  { id: "profile", label: "Profil Utilisateur", icon: User },
  { id: "security", label: "Sécurité & Accès", icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "company", label: "Configuration Entreprise", icon: Building },
  { id: "system", label: "Paramètres Système", icon: Database },
];

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const container = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // User Profile
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");

  // Enterprise Settings
  const [enterpriseName, setEnterpriseName] = useState("NYA BLO SARL");
  const [enterpriseCurrency, setEnterpriseCurrency] = useState("FCFA");
  const [enterpriseAddress, setEnterpriseAddress] = useState("Abidjan, Côte d'Ivoire");
  const [salesTarget, setSalesTarget] = useState<number>(5000000);
  const [loadingEnterprise, setLoadingEnterprise] = useState(true);
  const [savingEnterprise, setSavingEnterprise] = useState(false);

  // Security
  const [twoFactor, setTwoFactor] = useState(false);

  // User Notifications Settings
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    notif_sales: true,
    notif_reports: true,
    notif_alerts: true,
    notif_system: true
  });
  const [seeding, setSeeding] = useState(false);

  // Load profile fields
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || "");
      setEmail(profile.email || "");
      if (profile.notifications) {
        setNotifications(profile.notifications);
      }
    }
  }, [profile]);

  // Load enterprise configuration dynamically
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "enterprise"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setEnterpriseName(data.name || "NYA BLO SARL");
        setEnterpriseCurrency(data.currency || "FCFA");
        setEnterpriseAddress(data.address || "Abidjan, Côte d'Ivoire");
        setSalesTarget(Number(data.salesTarget || 5000000));
      }
      setLoadingEnterprise(false);
    }, (error) => {
      console.error("Failed to load enterprise settings", error);
      setLoadingEnterprise(false);
    });
    return () => unsub();
  }, []);

  const toggleNotif = async (id: string) => {
    if (!user) return;
    const updatedNotifs = { ...notifications, [id]: !notifications[id] };
    setNotifications(updatedNotifs);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        notifications: updatedNotifs
      });
      toast.success("Préférences enregistrées");
    } catch (e) {
      console.error("Failed to save notif preferences", e);
    }
  };

  useGSAP(() => {
    const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
    tl.from(".page-header", { y: -20, opacity: 0, duration: 1 });
    tl.from(".settings-card", { x: -30, opacity: 0, stagger: 0.1, duration: 0.8 }, "-=0.6");
  }, { scope: container });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        displayName: displayName.trim(),
      });
      await logAction(user.uid, email, "profile_update", `Modification du nom de profil pour ${displayName}`);
      setSaved(true);
      toast.success("Profil mis à jour avec succès");
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEnterprise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profile?.role !== "super_admin" && profile?.role !== "admin_entreprise") {
      toast.error("Vous n'êtes pas autorisé à modifier ces paramètres.");
      return;
    }
    setSavingEnterprise(true);
    try {
      await setDoc(doc(db, "settings", "enterprise"), {
        name: enterpriseName.trim(),
        currency: enterpriseCurrency.trim(),
        address: enterpriseAddress.trim(),
        salesTarget: Number(salesTarget || 0),
        updatedAt: new Date().toISOString(),
        updatedBy: profile?.email || "unknown"
      }, { merge: true });

      await logAction(
        profile?.uid,
        profile?.email,
        "enterprise_settings_update",
        `Mise à jour des paramètres : Nom=${enterpriseName}, Devise=${enterpriseCurrency}, Objectif=${salesTarget}`
      );

      toast.success("Configuration entreprise enregistrée !");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSavingEnterprise(false);
    }
  };

  const handleSeedData = async () => {
    if (profile?.role !== "super_admin") {
      toast.error("Seuls les Super Admins peuvent exécuter cette action.");
      return;
    }
    if (!confirm("Voulez-vous générer 25 transactions de simulation ? Les données existantes seront conservées.")) return;

    setSeeding(true);
    try {
      // Fetch existing users to distribute the sales
      const userList: { uid: string; displayName: string; email: string }[] = [];
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        usersSnap.forEach(uDoc => {
          const uData = uDoc.data();
          userList.push({
            uid: uDoc.id,
            displayName: uData.displayName || "Agent",
            email: uData.email || ""
          });
        });
      } catch (err) {
        console.error("Failed to fetch users for seeding", err);
      }

      // Fallback if no users found
      if (userList.length === 0 && user) {
        userList.push({
          uid: user.uid,
          displayName: displayName || "Admin",
          email: user.email || ""
        });
      }

      const clients = [
        { name: "Mamadou Koné", contact: "+225 07070707", engin: "KTM EXC 300", motif: "Achat pièces & Entretien" },
        { name: "Awa Touré", contact: "+225 01020304", engin: "Vespa GTS 300", motif: "Réparation carrosserie" },
        { name: "Christian Yao", contact: "+225 05050606", engin: "Yamaha TMAX 560", motif: "Vidange & Filtres" },
        { name: "Fatoumata Diop", contact: "+225 08080909", engin: "Honda SH 150", motif: "Changement de pneus" },
        { name: "Abdoulaye Sylla", contact: "+225 09091010", engin: "Suzuki GSX-R 1000", motif: "Diagnostic Électronique" },
        { name: "Marie-Louise Ndour", contact: "+225 05556677", engin: "BMW R 1250 GS", motif: "Révision des 20 000 km" },
        { name: "Jean-Pierre Coulibaly", contact: "+225 07778899", engin: "Kawasaki Z900", motif: "Kit Chaîne & Plaquettes" }
      ];

      const companiesList = ["GALF SARL", "NB FLOWERS", "NB FLOWS", "GALF LOGISTICS"];
      const channels = ["Direct", "Social", "Referral"];
      const paymentModes = ["Espèces", "Wave", "OM", "Momo", "Virement"];
      const sessions = ["Matin", "Après-midi", "Soir"];
      const locations = ["Abidjan", "Bouaké", "Yamoussoukro", "San Pedro"];
      
      const promises = [];
      const now = new Date();

      // Track user increments
      const userIncrements: Record<string, number> = {};

      for (let i = 0; i < 25; i++) {
        const dateOffset = Math.floor(Math.random() * 90); // last 90 days
        const dateVal = new Date();
        dateVal.setDate(now.getDate() - dateOffset);
        const dateString = dateVal.toISOString().split('T')[0];

        const client = clients[Math.floor(Math.random() * clients.length)];
        const company = companiesList[Math.floor(Math.random() * companiesList.length)];
        const canal = channels[Math.floor(Math.random() * channels.length)];
        const mode = paymentModes[Math.floor(Math.random() * paymentModes.length)];
        const session = sessions[Math.floor(Math.random() * sessions.length)];
        const location = locations[Math.floor(Math.random() * locations.length)];

        const total = Math.floor((Math.random() * 300 + 50)) * 1000;
        const fullyPaid = Math.random() > 0.25;
        const paid = fullyPaid ? total : Math.floor(Math.random() * (total / 1000)) * 1000;
        const remaining = total - paid;
        const status = remaining === 0 ? "Confirmé" : (paid === 0 ? "En attente" : "Incomplet");

        const randomCreator = userList[Math.floor(Math.random() * userList.length)];
        userIncrements[randomCreator.uid] = (userIncrements[randomCreator.uid] || 0) + 1;

        const entryData = {
          date: dateString,
          companyId: company,
          session,
          localisation: location,
          status,
          prochaineAction: remaining > 0 ? "Relancer pour recouvrement" : "Livrer commande",
          observation: "Opération générée via le simulateur de données.",
          clientName: client.name,
          clientContact: client.contact,
          engin: client.engin,
          motif: client.motif,
          totalAmount: total,
          paidAmount: paid,
          resteAVerser: remaining,
          canal,
          modePaiement: mode,
          createdAt: dateVal.toISOString(),
          createdBy: randomCreator.uid,
          createdByName: randomCreator.displayName,
          createdByEmail: randomCreator.email
        };

        promises.push(
          addDoc(collection(db, "daily_entries"), entryData).then(async (docRef) => {
            await logAction(
              profile?.uid,
              profile?.email,
              "sale_create",
              `[Simulation] Saisie de vente pour ${client.name} (${total.toLocaleString()} ${enterpriseCurrency}, filiale: ${company}) par ${randomCreator.displayName}`,
              company
            );
            return docRef;
          })
        );
      }

      await Promise.all(promises);

      // Apply increments to users
      const userUpdates = Object.entries(userIncrements).map(([uid, count]) => {
        return updateDoc(doc(db, "users", uid), {
          entriesCount: increment(count)
        }).catch(() => {});
      });
      await Promise.all(userUpdates);

      await logAction(
        profile?.uid,
        profile?.email,
        "system_simulation_run",
        "Exécution du simulateur de données : 25 transactions fictives injectées dans la base."
      );

      toast.success("✅ 25 transactions de simulation générées et assignées !");
    } catch (e) {
      console.error("Simulation Seeding Error:", e);
      toast.error("Erreur lors de l'injection des données.");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div ref={container} className="space-y-8 pb-12 relative">
      <div className="absolute inset-0 dogon-pattern opacity-5 pointer-events-none" />

      <div className="page-header flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-[#5C3D2E] font-dogon uppercase tracking-tight">Paramètres</h1>
          <p className="text-[#B89E7E] mt-1">Configurez votre espace de gestion et vos préférences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
         {/* Sidebar Tabs */}
         <div className="lg:col-span-1 space-y-4">
            {TABS.map((tab) => {
              // Hide System settings tab if not super admin
              if (tab.id === "system" && profile?.role !== "super_admin") return null;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-4 p-5 rounded-3xl transition-all ${
                    activeTab === tab.id 
                      ? "bg-[#5C3D2E] text-white shadow-xl shadow-[#5C3D2E]/20 translate-x-2" 
                      : "bg-white text-[#B89E7E] hover:bg-[#FAF3E0] hover:text-[#5C3D2E] border border-[#E8DCC4]"
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-bold text-sm tracking-wide">{tab.label}</span>
                </button>
              );
            })}
         </div>

         {/* Content Area */}
         <div className="lg:col-span-2 space-y-8">
            {activeTab === "profile" && (
            <div className="settings-card bg-white p-10 rounded-[48px] shadow-premium border border-[#E8DCC4] relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-[#FAF3E0]/50 rounded-bl-full -mr-32 -mt-32" />
               
               <div className="flex items-center gap-6 mb-12 relative z-10">
                  <div className="relative group">
                     <div className="w-24 h-24 rounded-[32px] bg-[#5C3D2E] flex items-center justify-center border-4 border-[#FAF3E0] shadow-xl relative overflow-hidden">
                        <span className="text-4xl font-bold text-[#FAF3E0]">{displayName?.charAt(0) || "U"}</span>
                        <div className="absolute inset-0 dogon-pattern opacity-10" />
                     </div>
                     <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-[#D4AF37] rounded-2xl flex items-center justify-center text-[#1A0F0A] shadow-lg border-2 border-white hover:scale-110 transition-transform">
                        <Camera className="w-5 h-5" />
                     </button>
                  </div>
                  <div>
                     <h3 className="text-2xl font-bold text-[#5C3D2E] font-dogon">{displayName || "Administrateur"}</h3>
                     <p className="text-[#A66037] font-bold text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
                        <Sparkles className="w-3 h-3" /> {profile?.role?.replace('_', ' ') || 'Super Admin'}
                     </p>
                  </div>
               </div>

               <form onSubmit={handleSaveProfile} className="space-y-8 relative z-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest pl-1">Nom Complet</label>
                        <input 
                          value={displayName} 
                          onChange={(e) => setDisplayName(e.target.value)}
                          className="w-full p-5 rounded-2xl bg-[#FAF3E0]/30 border-2 border-transparent focus:border-[#D4AF37] focus:bg-white outline-none transition-all font-bold text-[#5C3D2E]" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest pl-1">Adresse E-mail</label>
                        <input 
                          value={email} 
                          disabled
                          className="w-full p-5 rounded-2xl bg-[#FAF3E0]/30 border-none font-bold text-[#B89E7E] cursor-not-allowed" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest pl-1">Fuseau Horaire</label>
                        <div className="relative">
                           <Globe className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#B89E7E]" />
                           <select className="w-full pl-14 pr-5 py-5 rounded-2xl bg-[#FAF3E0]/30 border-2 border-transparent focus:border-[#D4AF37] outline-none font-bold text-[#5C3D2E] appearance-none">
                              <option>(GMT+00:00) Abidjan / Bamako</option>
                              <option>(GMT+01:00) Paris / Lagos</option>
                           </select>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest pl-1">Langue Interface</label>
                        <select className="w-full p-5 rounded-2xl bg-[#FAF3E0]/30 border-2 border-transparent focus:border-[#D4AF37] outline-none font-bold text-[#5C3D2E] appearance-none">
                           <option>Français (Afrique)</option>
                           <option>Bambara (Beta)</option>
                           <option>English (UK)</option>
                        </select>
                     </div>
                  </div>

                  <div className="pt-8 border-t border-[#E8DCC4]">
                     <button 
                       type="submit"
                       disabled={saving}
                       className="px-10 py-5 rounded-2xl dogon-gradient text-white font-bold text-lg shadow-xl shadow-[#A66037]/20 hover:shadow-2xl hover:shadow-[#A66037]/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                     >
                        {saving ? (
                          <Loader2 className="w-6 h-6 animate-spin" />
                        ) : saved ? (
                          <Check className="w-6 h-6" />
                        ) : (
                          <Save className="w-6 h-6" />
                        )}
                        {saving ? "Sauvegarde..." : saved ? "Sauvegardé !" : "Sauvegarder les Changements"}
                     </button>
                  </div>
               </form>
            </div>
            )}

            {activeTab === "security" && (
            <div className="settings-card bg-white p-10 rounded-[48px] shadow-premium border border-[#E8DCC4]">
               <h3 className="text-2xl font-bold text-[#5C3D2E] font-dogon mb-8">Sécurité & Accès</h3>
               <div className="space-y-6">
                  <div className="flex items-center justify-between p-6 bg-[#FAF3E0]/30 rounded-3xl">
                     <div>
                       <p className="font-bold text-[#5C3D2E]">Authentification à deux facteurs</p>
                       <p className="text-sm text-[#B89E7E]">Protégez votre compte avec une double vérification</p>
                     </div>
                     <button type="button" onClick={() => setTwoFactor(!twoFactor)} className={`toggle-switch ${twoFactor ? 'active' : 'inactive'}`}>
                       <div className="toggle-knob" />
                     </button>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-[#FAF3E0]/30 rounded-3xl">
                     <div>
                       <p className="font-bold text-[#5C3D2E]">Sessions actives</p>
                       <p className="text-sm text-[#B89E7E]">1 appareil connecté en ce moment</p>
                     </div>
                     <span className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-widest">Sécurisé</span>
                  </div>
                  <div className="flex items-center justify-between p-6 bg-[#FAF3E0]/30 rounded-3xl">
                     <div>
                       <p className="font-bold text-[#5C3D2E]">Changer le mot de passe</p>
                       <p className="text-sm text-[#B89E7E]">Dernière modification il y a 30 jours</p>
                     </div>
                     <button className="px-6 py-3 rounded-2xl border-2 border-[#E8DCC4] text-[#A66037] font-bold text-sm hover:bg-[#FAF3E0] transition-all">Modifier</button>
                  </div>
               </div>
            </div>
            )}

            {activeTab === "notifications" && (
            <div className="settings-card bg-white p-10 rounded-[48px] shadow-premium border border-[#E8DCC4]">
               <h3 className="text-2xl font-bold text-[#5C3D2E] font-dogon mb-8">Notifications</h3>
               <div className="space-y-6">
                  {[
                    { id: 'notif_sales', label: "Nouvelles saisies de vente" },
                    { id: 'notif_reports', label: "Rapports hebdomadaires" },
                    { id: 'notif_alerts', label: "Alertes de recouvrement" },
                    { id: 'notif_system', label: "Mises à jour système" }
                  ].map((notif) => (
                    <div key={notif.id} className="flex items-center justify-between p-6 bg-[#FAF3E0]/30 rounded-3xl">
                      <p className="font-bold text-[#5C3D2E]">{notif.label}</p>
                      <button 
                        type="button" 
                        onClick={() => toggleNotif(notif.id)} 
                        className={`toggle-switch ${notifications[notif.id] !== false ? 'active' : 'inactive'}`}
                      >
                        <div className="toggle-knob" />
                      </button>
                    </div>
                  ))}
               </div>
            </div>
            )}

            {activeTab === "company" && (
            <div className="settings-card bg-white p-10 rounded-[48px] shadow-premium border border-[#E8DCC4]">
               <h3 className="text-2xl font-bold text-[#5C3D2E] font-dogon mb-8">Configuration Entreprise</h3>
               {loadingEnterprise ? (
                 <div className="py-20 flex justify-center items-center">
                    <Loader2 className="w-8 h-8 text-[#A66037] animate-spin" />
                 </div>
               ) : (
                 <form onSubmit={handleSaveEnterprise} className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-2">
                         <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest pl-1">Nom de l&apos;Entreprise</label>
                         <input 
                           value={enterpriseName} 
                           onChange={(e) => setEnterpriseName(e.target.value)}
                           className="w-full p-5 rounded-2xl bg-[#FAF3E0]/30 border-2 border-transparent focus:border-[#D4AF37] outline-none font-bold text-[#5C3D2E]" 
                         />
                       </div>
                       <div className="space-y-2">
                         <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest pl-1">Devise</label>
                         <select 
                           value={enterpriseCurrency} 
                           onChange={(e) => setEnterpriseCurrency(e.target.value)}
                           className="w-full p-5 rounded-2xl bg-[#FAF3E0]/30 border-2 border-transparent focus:border-[#D4AF37] outline-none font-bold text-[#5C3D2E]"
                         >
                           <option value="FCFA">FCFA (XOF)</option>
                           <option value="EUR">EUR (€)</option>
                           <option value="USD">USD ($)</option>
                           <option value="CAD">CAD ($)</option>
                         </select>
                       </div>
                       <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest pl-1">Adresse du Siège</label>
                         <input 
                           value={enterpriseAddress} 
                           onChange={(e) => setEnterpriseAddress(e.target.value)}
                           className="w-full p-5 rounded-2xl bg-[#FAF3E0]/30 border-2 border-transparent focus:border-[#D4AF37] outline-none font-bold text-[#5C3D2E]" 
                         />
                       </div>
                       <div className="space-y-2 md:col-span-2">
                         <label className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest pl-1">Objectif Mensuel de Ventes ({enterpriseCurrency})</label>
                         <input 
                           type="number"
                           value={salesTarget} 
                           onChange={(e) => setSalesTarget(Number(e.target.value))}
                           className="w-full p-5 rounded-2xl bg-[#FAF3E0]/30 border-2 border-transparent focus:border-[#D4AF37] outline-none font-bold text-[#5C3D2E]" 
                         />
                       </div>
                    </div>
                    
                    <div className="pt-4 border-t border-[#E8DCC4]">
                       <button 
                         type="submit"
                         disabled={savingEnterprise}
                         className="px-10 py-5 rounded-2xl dogon-gradient text-white font-bold text-lg shadow-xl shadow-[#A66037]/20 hover:shadow-2xl hover:shadow-[#A66037]/40 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                       >
                          {savingEnterprise ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                          {savingEnterprise ? "Enregistrement..." : "Enregistrer la Configuration"}
                       </button>
                    </div>
                 </form>
               )}
            </div>
            )}

            {activeTab === "system" && (
            <div className="settings-card bg-white p-10 rounded-[48px] shadow-premium border border-[#E8DCC4] space-y-8">
               <div>
                  <h3 className="text-2xl font-bold text-[#5C3D2E] font-dogon mb-8">Paramètres Système</h3>
                  <div className="space-y-6">
                     <div className="p-6 bg-[#FAF3E0]/30 rounded-3xl">
                       <p className="font-bold text-[#5C3D2E] mb-1">Version de l&apos;Application</p>
                       <p className="text-sm text-[#B89E7E]">NB GEST v2.2.0 — Build {new Date().toISOString().split('T')[0]}</p>
                     </div>
                     <div className="p-6 bg-[#FAF3E0]/30 rounded-3xl">
                       <p className="font-bold text-[#5C3D2E] mb-1">Base de Données</p>
                       <p className="text-sm text-[#B89E7E]">Firebase Firestore — Connecté <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full ml-1" /></p>
                     </div>
                     <div className="p-6 bg-[#FAF3E0]/30 rounded-3xl">
                       <p className="font-bold text-[#5C3D2E] mb-1">Stockage Utilisé</p>
                       <div className="mt-3 h-3 bg-[#E8DCC4] rounded-full overflow-hidden">
                         <div className="h-full w-1/4 bg-gradient-to-r from-[#A66037] to-[#D4AF37] rounded-full" />
                       </div>
                       <p className="text-xs text-[#B89E7E] mt-2">~25% utilisé sur la capacité totale</p>
                     </div>
                  </div>
               </div>

               {profile?.role === "super_admin" && (
               <div className="pt-8 border-t border-[#E8DCC4] space-y-4">
                  <div className="bg-[#FAF3E0]/70 p-8 rounded-3xl border border-[#E8DCC4]">
                     <h4 className="font-bold text-lg text-primary font-dogon mb-2">Simulateur & Seeder de Données</h4>
                     <p className="text-sm text-[#B89E7E] leading-relaxed mb-6">
                        Utile pour les présentations ou le développement. Génère instantanément 25 transactions commerciales fictives cohérentes, réparties de manière aléatoire sur les 3 derniers mois avec leurs journaux d&apos;audit respectifs.
                     </p>
                     <button
                       type="button"
                       disabled={seeding}
                       onClick={handleSeedData}
                       className="px-8 py-4 rounded-2xl bg-[#5C3D2E] text-[#FAF3E0] font-bold text-sm hover:bg-[#A66037] hover:text-white transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                     >
                       {seeding ? (
                         <><Loader2 className="w-4 h-4 animate-spin" /> Injection en cours...</>
                       ) : (
                         <>Lancer la Simulation (25 transactions)</>
                       )}
                     </button>
                  </div>
               </div>
               )}
            </div>
            )}
         </div>
      </div>
    </div>
  );
}
