"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Users, 
  Gift, 
  ShieldAlert, 
  Calendar, 
  BarChart3, 
  Search, 
  SlidersHorizontal,
  Download, 
  Plus, 
  Edit3, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2, 
  ArrowRight,
  Bookmark,
  Award,
  Sparkles,
  Phone,
  Check,
  X,
  FileText,
  Copy,
  Info,
  Layers,
  Settings,
  HelpCircle,
  TrendingUp,
  MapPin,
  RefreshCw,
  UserCheck,
  Activity
} from "lucide-react";
import { 
  collection, 
  query, 
  onSnapshot, 
  orderBy, 
  doc, 
  updateDoc, 
  addDoc, 
  getDocs, 
  where, 
  deleteDoc, 
  setDoc,
  getDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";
import toast from "react-hot-toast";
import { logAction } from "@/lib/audit";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";
import { jsPDF } from "jspdf";

interface ReferralMember {
  id: string;
  nom: string;
  prenom: string;
  telephoneNormalise: string;
  email: string;
  formationSouhaitee: string;
  campagneId: string;
  codeId: string;
  status: "active" | "suspended" | "archived";
  createdAt: string;
  stats: {
    totalReferred: number;
    pendingCount: number;
    validatedCount: number;
    rewardCount: number;
  };
}

interface ReferralReward {
  id: string;
  memberId: string;
  reference: string;
  qualifyingCount: number;
  status: "eligible" | "verification_en_cours" | "informations_requises" | "approuvee" | "programmee" | "attribuee" | "utilisee" | "refusee" | "annulee";
  trainingId: string | null;
  centerId: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  qualifyingEntries: string[];
  notes?: string;
  // client-joined info
  memberNom?: string;
  memberPrenom?: string;
}

interface ReferralCampaign {
  id: string;
  name: string;
  description: string;
  status: "active" | "expired" | "draft";
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  timestamp: string;
}

export default function ParrainagePage() {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState("members");
  const [loading, setLoading] = useState(true);

  // Firestore States
  const [members, setMembers] = useState<ReferralMember[]>([]);
  const [rewards, setRewards] = useState<ReferralReward[]>([]);
  const [campaigns, setCampaigns] = useState<ReferralCampaign[]>([]);
  const [attributions, setAttributions] = useState<any[]>([]);
  const [allEntries, setAllEntries] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState("Tous");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("Tous");
  const [selectedProgressFilter, setSelectedProgressFilter] = useState("Tous");

  // Filleuls Tab Search & Filters
  const [filleulSearch, setFilleulSearch] = useState("");
  const [filleulStatusFilter, setFilleulStatusFilter] = useState("Tous");

  // Modals & Panels
  const [selectedParrain, setSelectedParrain] = useState<ReferralMember | null>(null);
  const [parrainDetailsOpen, setParrainDetailsOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState<ReferralReward | null>(null);
  const [rewardActionOpen, setRewardActionOpen] = useState(false);
  const [newCampaignOpen, setNewCampaignOpen] = useState(false);
  const [newMemberOpen, setNewMemberOpen] = useState(false);
  
  // Advanced Features States
  const [checkerOpen, setCheckerOpen] = useState(false);
  const [checkerInput, setCheckerInput] = useState("");
  const [checkerResult, setCheckerResult] = useState<ReferralMember | null | "not_found">(null);
  const [whitelistReason, setWhitelistReason] = useState("");
  const [selectedFraudItem, setSelectedFraudItem] = useState<any | null>(null);
  const [whitelistModalOpen, setWhitelistModalOpen] = useState(false);
  const [bulkSelectRewards, setBulkSelectRewards] = useState<string[]>([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  
  // Simulator State (ROI Simulator)
  const [simParrains, setSimParrains] = useState(25);
  const [simFilleulsPerParrain, setSimFilleulsPerParrain] = useState(4);
  const [simConversionRate, setSimConversionRate] = useState(75);
  const [simAvgRevenue, setSimAvgRevenue] = useState(150000); // FCFA
  const [simAvgCost, setSimAvgCost] = useState(35000); // Operational cost per offered training

  // Auto-Suspension Settings
  const [autoSuspendRules, setAutoSuspendRules] = useState({
    enabled: true,
    maxDuplicates: 3,
    maxRegistrationsPerHour: 5
  });

  // Forms
  const [campaignForm, setCampaignForm] = useState({
    id: "",
    name: "",
    description: "",
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split("T")[0],
    status: "active" as "active" | "expired" | "draft"
  });

  const [memberForm, setMemberForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephoneNormalise: "",
    formationSouhaitee: "",
    campagneId: "",
    codeId: ""
  });

  const [rewardForm, setRewardForm] = useState({
    status: "approuvee" as ReferralReward["status"],
    trainingId: "",
    centerId: "",
    notes: "",
    dateLimite: new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split("T")[0]
  });

  const [bulkRewardForm, setBulkRewardForm] = useState({
    status: "approuvee" as ReferralReward["status"],
    trainingId: "",
    centerId: "",
    notes: ""
  });

  // Real-time Firestore Sync
  useEffect(() => {
    const unsubMembers = onSnapshot(collection(db, "referral_members"), (snap) => {
      setMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReferralMember)));
    });

    const unsubRewards = onSnapshot(collection(db, "referral_rewards"), (snap) => {
      setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReferralReward)));
    });

    const unsubCampaigns = onSnapshot(collection(db, "referral_campaigns"), (snap) => {
      setCampaigns(snap.docs.map(d => ({ id: d.id, ...d.data() } as ReferralCampaign)));
    });

    const unsubAttributions = onSnapshot(collection(db, "referral_attributions"), (snap) => {
      setAttributions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubLogs = onSnapshot(query(collection(db, "referral_audit_logs"), orderBy("timestamp", "desc")), (snap) => {
      setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
    });

    const unsubEntries = onSnapshot(collection(db, "daily_entries"), (snap) => {
      setAllEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });

    return () => {
      unsubMembers();
      unsubRewards();
      unsubCampaigns();
      unsubAttributions();
      unsubLogs();
      unsubEntries();
    };
  }, []);

  // Sync Campaigns to New Member Form default Campaign
  useEffect(() => {
    const activeCamp = campaigns.find(c => c.status === "active");
    if (activeCamp) {
      setMemberForm(prev => ({ ...prev, campagneId: activeCamp.id }));
      setCampaignForm(prev => ({ ...prev, id: `campagne_${Date.now().toString().substring(8)}` }));
    }
  }, [campaigns]);

  // Join rewards with names
  const joinedRewards = useMemo(() => {
    return rewards.map(reward => {
      const member = members.find(m => m.id === reward.memberId);
      return {
        ...reward,
        memberNom: member ? member.nom : "Inconnu",
        memberPrenom: member ? member.prenom : "Parrain"
      };
    });
  }, [rewards, members]);

  // High-Risk Alert calculation
  const alerts4or5 = useMemo(() => {
    return members.filter(m => {
      const count = m.stats?.validatedCount || 0;
      return (count === 4 || count >= 5) && m.status === "active";
    });
  }, [members]);

  // Filters process for members
  const processedMembers = useMemo(() => {
    let result = members;

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(m => 
        m.nom.toLowerCase().includes(q) ||
        m.prenom.toLowerCase().includes(q) ||
        m.codeId.toLowerCase().includes(q) ||
        m.telephoneNormalise.includes(q)
      );
    }

    if (selectedCampaignFilter !== "Tous") {
      result = result.filter(m => m.campagneId === selectedCampaignFilter);
    }

    if (selectedStatusFilter !== "Tous") {
      result = result.filter(m => m.status === selectedStatusFilter);
    }

    if (selectedProgressFilter !== "Tous") {
      const target = Number(selectedProgressFilter);
      result = result.filter(m => (m.stats?.validatedCount || 0) === target);
    }

    return result;
  }, [members, searchTerm, selectedCampaignFilter, selectedStatusFilter, selectedProgressFilter]);

  // Filleuls tab filter process
  const processedFilleuls = useMemo(() => {
    let result = attributions;

    if (filleulSearch) {
      const q = filleulSearch.toLowerCase();
      result = result.filter(f => 
        f.studentName.toLowerCase().includes(q) ||
        f.studentPhone.includes(q) ||
        f.referralCodeId.toLowerCase().includes(q)
      );
    }

    if (filleulStatusFilter !== "Tous") {
      result = result.filter(f => f.status === filleulStatusFilter);
    }

    return result;
  }, [attributions, filleulSearch, filleulStatusFilter]);

  // Ambassador Leaderboard
  const ambassadorLeaderboard = useMemo(() => {
    return [...members]
      .filter(m => (m.stats?.validatedCount || 0) > 0)
      .sort((a, b) => (b.stats?.validatedCount || 0) - (a.stats?.validatedCount || 0))
      .slice(0, 5);
  }, [members]);

  // Center Allocation metrics
  const centerStats = useMemo(() => {
    const counts: Record<string, number> = {};
    rewards.forEach(r => {
      if (r.centerId) {
        counts[r.centerId] = (counts[r.centerId] || 0) + 1;
      }
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [rewards]);

  // ROI / Stats summary computations
  const statsSummary = useMemo(() => {
    const totalAttributions = attributions.length;
    const validatedAttributions = attributions.filter(a => ["Confirmé", "inscription validée"].includes(a.status)).length;
    const pendingAttributions = attributions.filter(a => ["En attente", "inscription en attente", "paiement à vérifier"].includes(a.status)).length;
    const conversionRate = totalAttributions > 0 ? Math.round((validatedAttributions / totalAttributions) * 100) : 0;
    const activeParrains = members.filter(m => m.status === "active").length;
    const approvedRewards = rewards.filter(r => ["approuvee", "programmee", "attribuee", "utilisee"].includes(r.status)).length;

    // Financial KPIs
    const averageCourseCost = 150000; // Average cost of GALF training course (FCFA)
    const estimatedValueGenerated = validatedAttributions * averageCourseCost;
    const estimatedCostOfRewards = approvedRewards * averageCourseCost;
    const calculatedNetProfit = estimatedValueGenerated - estimatedCostOfRewards;
    const grossRoi = estimatedCostOfRewards > 0 ? Math.round((estimatedValueGenerated / estimatedCostOfRewards) * 100) : 0;

    // Referred entries per campaign
    const campaignStats: Record<string, number> = {};
    attributions.forEach(a => {
      campaignStats[a.campaignId] = (campaignStats[a.campaignId] || 0) + 1;
    });

    const chartCampaignData = Object.entries(campaignStats).map(([name, value]) => {
      const camp = campaigns.find(c => c.id === name);
      return { name: camp ? camp.name : name, value };
    });

    // Filleuls validated over last 6 months
    const monthlyStats: Record<string, number> = {};
    attributions.forEach(a => {
      if (a.createdAt) {
        const month = new Date(a.createdAt).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
        monthlyStats[month] = (monthlyStats[month] || 0) + 1;
      }
    });

    const chartMonthlyData = Object.entries(monthlyStats).map(([name, count]) => ({ name, count }));

    return {
      totalAttributions,
      validatedAttributions,
      pendingAttributions,
      conversionRate,
      activeParrains,
      approvedRewards,
      estimatedValueGenerated,
      estimatedCostOfRewards,
      calculatedNetProfit,
      grossRoi,
      chartCampaignData,
      chartMonthlyData
    };
  }, [attributions, members, rewards, campaigns]);

  // Team performance stats
  const teamPerformance = useMemo(() => {
    const repMap: Record<string, { name: string; email: string; totalReferred: number; validatedCount: number; conversionRate: number }> = {};
    
    attributions.forEach(a => {
      const email = a.recordedBy || "inconnu";
      if (!repMap[email]) {
        repMap[email] = {
          name: a.recordedByName || email,
          email: email,
          totalReferred: 0,
          validatedCount: 0,
          conversionRate: 0
        };
      }
      repMap[email].totalReferred += 1;
      if (["Confirmé", "inscription validée"].includes(a.status)) {
        repMap[email].validatedCount += 1;
      }
    });

    Object.values(repMap).forEach(rep => {
      rep.conversionRate = rep.totalReferred > 0 ? Math.round((rep.validatedCount / rep.totalReferred) * 100) : 0;
    });

    return Object.values(repMap).sort((a, b) => b.totalReferred - a.totalReferred);
  }, [attributions]);

  // Anti-Fraud Candidates calculation
  const fraudDossiers = useMemo(() => {
    const list: any[] = [];

    // 1. Multiples attributions duplicate phones
    const phoneGroups: Record<string, any[]> = {};
    attributions.forEach(attr => {
      if (attr.isWhitelisted) return; // Skip whitelisted
      const ph = attr.studentPhoneNormalized || attr.studentPhone;
      if (ph) {
        if (!phoneGroups[ph]) phoneGroups[ph] = [];
        phoneGroups[ph].push(attr);
      }
    });

    Object.entries(phoneGroups).forEach(([ph, group]) => {
      if (group.length > 1) {
        list.push({
          type: "Rattachements multiples",
          risk: group.length > 2 ? "critique" : "moyen",
          detail: `Le numéro ${ph} a été rattaché ${group.length} fois à des parrains différents.`,
          evidence: group.map(g => `${g.studentName} rattaché au code ${g.referralCodeId}`).join(", "),
          timestamp: group[group.length - 1].createdAt,
          rawItem: group[0] // reference for whitelist action
        });
      }
    });

    // 2. Self-referrals check
    attributions.forEach(attr => {
      if (attr.isWhitelisted) return;
      const parrain = members.find(m => m.id === attr.referralMemberId);
      if (parrain) {
        const parrainPhone = (parrain.telephoneNormalise || "").replace(/\D/g, "");
        const studentPhone = (attr.studentPhoneNormalized || "").replace(/\D/g, "");
        if (parrainPhone && studentPhone && parrainPhone === studentPhone) {
          list.push({
            type: "Auto-parrainage suspecté",
            risk: "elevé",
            detail: `L'apprenant ${attr.studentName} semble s'auto-parrainer avec son propre numéro.`,
            evidence: `Parrain: ${parrain.prenom} ${parrain.nom} (${parrain.telephoneNormalise}) | Filleul: ${attr.studentName} (${attr.studentPhone})`,
            timestamp: attr.createdAt,
            rawItem: attr
          });
        }
      }
    });

    // 3. Rapid registrations check
    const parrainRegTimes: Record<string, string[]> = {};
    attributions.forEach(attr => {
      if (attr.isWhitelisted) return;
      const pid = attr.referralMemberId;
      if (!parrainRegTimes[pid]) parrainRegTimes[pid] = [];
      parrainRegTimes[pid].push(attr.createdAt);
    });

    Object.entries(parrainRegTimes).forEach(([pid, times]) => {
      const sorted = [...times].sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
      for (let i = 0; i < sorted.length - 2; i++) {
        const diff = new Date(sorted[i + 2]).getTime() - new Date(sorted[i]).getTime();
        if (diff < 3600000) { // < 1 hour
          const parrain = members.find(m => m.id === pid);
          list.push({
            type: "Saisies anormalement rapides",
            risk: "elevé",
            detail: `Le parrain ${parrain ? parrain.prenom + " " + parrain.nom : pid} a généré 3 filleuls en moins d'une heure.`,
            evidence: `Déclencheur d'activité rapprochée le ${new Date(sorted[i]).toLocaleString("fr-FR")}`,
            timestamp: sorted[i + 2],
            rawItem: attributions.find(a => a.referralMemberId === pid && a.createdAt === sorted[i + 2])
          });
          break;
        }
      }
    });

    return list;
  }, [attributions, members]);

  // Campaign create handler
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.id || !campaignForm.name) {
      toast.error("Veuillez renseigner les champs obligatoires.");
      return;
    }
    try {
      await setDoc(doc(db, "referral_campaigns", campaignForm.id), {
        ...campaignForm,
        createdAt: new Date().toISOString()
      });
      await logAction(profile?.uid, profile?.email, "referral_campaign_create", `Création de la campagne ${campaignForm.name}`);
      toast.success("Campagne créée avec succès !");
      setNewCampaignOpen(false);
      setCampaignForm({
        id: "",
        name: "",
        description: "",
        startDate: new Date().toISOString().split("T")[0],
        endDate: new Date(Date.now() + 180 * 24 * 3600 * 1000).toISOString().split("T")[0],
        status: "active"
      });
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la création.");
    }
  };

  // Member/Parrain create handler
  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!memberForm.nom || !memberForm.prenom || !memberForm.codeId || !memberForm.telephoneNormalise) {
      toast.error("Veuillez renseigner tous les champs obligatoires.");
      return;
    }

    const codeUpper = memberForm.codeId.trim().toUpperCase();

    try {
      // Check if code already exists
      const codeRef = doc(db, "referral_codes", codeUpper);
      const codeSnap = await getDoc(codeRef);
      if (codeSnap.exists()) {
        toast.error("Ce code parrain est déjà attribué à un autre membre.");
        return;
      }

      const memberId = `member_${Date.now()}`;

      // Create member document
      await setDoc(doc(db, "referral_members", memberId), {
        id: memberId,
        nom: memberForm.nom,
        prenom: memberForm.prenom,
        email: memberForm.email,
        telephoneNormalise: memberForm.telephoneNormalise,
        formationSouhaitee: memberForm.formationSouhaitee,
        campagneId: memberForm.campagneId,
        codeId: codeUpper,
        status: "active",
        createdAt: new Date().toISOString(),
        recordedBy: profile?.uid || "admin",
        stats: {
          totalReferred: 0,
          pendingCount: 0,
          validatedCount: 0,
          rewardCount: 0
        }
      });

      // Create code document
      await setDoc(codeRef, {
        code: codeUpper,
        memberId: memberId,
        campaignId: memberForm.campagneId,
        status: "active",
        createdAt: new Date().toISOString(),
        expiresAt: null
      });

      await logAction(profile?.uid, profile?.email, "referral_member_create", `Création du parrain ${memberForm.prenom} ${memberForm.nom} (Code: ${codeUpper})`);
      toast.success("Parrain et code créés avec succès !");
      setNewMemberOpen(false);
      setMemberForm({
        nom: "",
        prenom: "",
        email: "",
        telephoneNormalise: "",
        formationSouhaitee: "",
        campagneId: campaigns.find(c => c.status === "active")?.id || "",
        codeId: ""
      });
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de la création.");
    }
  };

  // Toggle parrain active status
  const handleToggleMemberStatus = async (member: ReferralMember) => {
    const nextStatus = member.status === "active" ? "suspended" : "active";
    if (!confirm(`Êtes-vous sûr de vouloir passer ce parrain au statut: ${nextStatus} ?`)) return;

    try {
      await updateDoc(doc(db, "referral_members", member.id), { status: nextStatus });
      await updateDoc(doc(db, "referral_codes", member.codeId), { status: nextStatus });
      await logAction(profile?.uid, profile?.email, "referral_member_status", `Passage du parrain ${member.prenom} ${member.nom} à ${nextStatus}`);
      toast.success(`Statut mis à jour : ${nextStatus}`);
    } catch (err) {
      console.error(err);
      toast.error("Erreur de modification.");
    }
  };

  // Process single Reward decision
  const handleProcessReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReward) return;

    try {
      await updateDoc(doc(db, "referral_rewards", selectedReward.id), {
        status: rewardForm.status,
        trainingId: rewardForm.trainingId || null,
        centerId: rewardForm.centerId || null,
        approvedBy: profile?.email || "Administrateur",
        approvedAt: new Date().toISOString(),
        expiresAt: rewardForm.dateLimite
      });

      await logAction(
        profile?.uid,
        profile?.email,
        "referral_reward_decision",
        `Décision sur la récompense ${selectedReward.reference} : ${rewardForm.status}. Notes: ${rewardForm.notes}`
      );

      toast.success(`Récompense mise à jour : ${rewardForm.status}`);
      setRewardActionOpen(false);
      setSelectedReward(null);
    } catch (err) {
      console.error(err);
      toast.error("Erreur de mise à jour.");
    }
  };

  // Whitelist Fraudulent candidate
  const handleWhitelistFraud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFraudItem || !whitelistReason) return;

    try {
      await updateDoc(doc(db, "referral_attributions", selectedFraudItem.id), {
        isWhitelisted: true,
        whitelistReason: whitelistReason,
        whitelistedBy: profile?.email || "Admin",
        whitelistedAt: new Date().toISOString()
      });

      await logAction(
        profile?.uid,
        profile?.email,
        "referral_whitelist",
        `Autorisation de parrainage (whitelist) pour filleul ID ${selectedFraudItem.id}. Raison : ${whitelistReason}`
      );

      toast.success("Parrainage autorisé et retiré des alertes !");
      setWhitelistModalOpen(false);
      setSelectedFraudItem(null);
      setWhitelistReason("");
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors de l'autorisation.");
    }
  };

  // Bulk process rewards
  const handleBulkProcessRewards = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkSelectRewards.length === 0) return;

    try {
      const promises = bulkSelectRewards.map(id => {
        return updateDoc(doc(db, "referral_rewards", id), {
          status: bulkRewardForm.status,
          trainingId: bulkRewardForm.trainingId || null,
          centerId: bulkRewardForm.centerId || null,
          approvedBy: profile?.email || "Administrateur",
          approvedAt: new Date().toISOString(),
          notes: bulkRewardForm.notes
        });
      });

      await Promise.all(promises);
      await logAction(
        profile?.uid,
        profile?.email,
        "referral_rewards_bulk",
        `Traitement en masse de ${bulkSelectRewards.length} récompenses vers le statut ${bulkRewardForm.status}`
      );

      toast.success(`${bulkSelectRewards.length} récompenses traitées avec succès !`);
      setBulkActionOpen(false);
      setBulkSelectRewards([]);
    } catch (err) {
      console.error(err);
      toast.error("Erreur de traitement en masse.");
    }
  };

  // Client progress check handler
  const handleCheckClient = () => {
    if (!checkerInput) return;
    const cleanPhone = checkerInput.replace(/\D/g, "");
    const found = members.find(m => 
      m.telephoneNormalise.replace(/\D/g, "") === cleanPhone || 
      m.codeId.toUpperCase() === checkerInput.toUpperCase().trim()
    );

    if (found) {
      setCheckerResult(found);
    } else {
      setCheckerResult("not_found");
    }
  };

  // PDF Generation for Official Voucher (jsPDF)
  const generatePDFVoucher = (reward: any) => {
    const docPdf = new jsPDF();
    const dateStr = new Date(reward.createdAt).toLocaleDateString("fr-FR");
    const expStr = reward.expiresAt ? new Date(reward.expiresAt).toLocaleDateString("fr-FR") : "N/A";
    const appStr = reward.approvedAt ? new Date(reward.approvedAt).toLocaleDateString("fr-FR") : "N/A";

    // Header border / decorative bar
    docPdf.setFillColor(92, 61, 46); // Dogon brown
    docPdf.rect(0, 0, 210, 15, "F");

    // Title
    docPdf.setTextColor(92, 61, 46);
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(22);
    docPdf.text("GALF FORMATION", 105, 35, { align: "center" });

    docPdf.setFontSize(14);
    docPdf.setTextColor(166, 96, 55); // Orange brown
    docPdf.text("BON D'ATTRIBUTION DE FORMATION OFFERTE", 105, 45, { align: "center" });

    // Border Frame
    docPdf.setDrawColor(232, 220, 196); // Warm beige border
    docPdf.setLineWidth(1);
    docPdf.rect(15, 55, 180, 115);

    // Voucher Info
    docPdf.setTextColor(50, 50, 50);
    docPdf.setFont("helvetica", "normal");
    docPdf.setFontSize(11);

    docPdf.text(`RÉFÉRENCE :`, 25, 70);
    docPdf.setFont("helvetica", "bold");
    docPdf.text(reward.reference, 80, 70);

    docPdf.setFont("helvetica", "normal");
    docPdf.text(`DATE D'ÉMISSION :`, 25, 80);
    docPdf.text(dateStr, 80, 80);

    docPdf.text(`DATE DE VALIDATION :`, 25, 90);
    docPdf.text(appStr, 80, 90);

    docPdf.text(`DATE LIMITE DE VALIDITÉ :`, 25, 100);
    docPdf.setTextColor(180, 50, 50);
    docPdf.setFont("helvetica", "bold");
    docPdf.text(expStr, 80, 100);
    docPdf.setTextColor(50, 50, 50);
    docPdf.setFont("helvetica", "normal");

    // Recipient Details
    docPdf.setFillColor(250, 243, 224); // Cream highlight
    docPdf.rect(20, 110, 170, 30, "F");

    docPdf.setFont("helvetica", "bold");
    docPdf.text("BÉNÉFICIAIRE (PARRAIN) :", 25, 118);
    docPdf.text(`${reward.memberPrenom} ${reward.memberNom}`, 85, 118);
    docPdf.setFont("helvetica", "normal");
    docPdf.text(`Code Affilié : ${reward.memberId}`, 25, 126);
    docPdf.text(`Téléphone : ${reward.telephoneNormalise || "Non spécifié"}`, 25, 134);

    // Offered Course Details
    docPdf.setFont("helvetica", "bold");
    docPdf.text(`FORMATION ATTRIBUÉE :`, 25, 150);
    docPdf.setTextColor(92, 61, 46);
    docPdf.text(reward.trainingId || "A choisir", 85, 150);

    docPdf.setTextColor(50, 50, 50);
    docPdf.text(`CENTRE DE FORMATION :`, 25, 160);
    docPdf.text(reward.centerId || "A définir", 85, 160);

    // Terms
    docPdf.setFont("helvetica", "italic");
    docPdf.setFontSize(9);
    docPdf.setTextColor(120, 120, 120);
    docPdf.text("Ce bon de formation est personnel et nominatif. Il doit être présenté au centre de formation", 105, 185, { align: "center" });
    docPdf.text("désigné lors de la réservation de la session. Valable uniquement pour les modules GALF Formation.", 105, 190, { align: "center" });

    // Anti-Fraud verification hash
    const verificationHash = `VERIF-HASH:${reward.id.substring(0, 8)}-${reward.memberId.substring(0, 8)}`;
    docPdf.setFont("monospace", "normal");
    docPdf.setFontSize(8);
    docPdf.text(verificationHash, 15, 285);

    // Signatures
    docPdf.setFont("helvetica", "bold");
    docPdf.setFontSize(10);
    docPdf.setTextColor(92, 61, 46);
    docPdf.text("Signature du Directeur Général", 30, 220);
    docPdf.text("Signature de l'Ambassadeur", 130, 220);

    docPdf.setDrawColor(180, 180, 180);
    docPdf.line(30, 245, 90, 245);
    docPdf.line(130, 245, 190, 245);

    // Download
    docPdf.save(`BON_FORMATION_${reward.reference}.pdf`);
    toast.success("Bon de formation PDF généré !");
  };

  // Export functions
  const handleExportCSV = (type: "members" | "rewards" | "attributions") => {
    let headers: string[] = [];
    let rows: any[] = [];
    let filename = "";

    if (type === "members") {
      headers = ["Nom", "Prénom", "Téléphone", "Email", "Formation souhaitée", "Code Parrain", "Statut", "Filleuls Générés", "Validés"];
      rows = members.map(m => [m.nom, m.prenom, m.telephoneNormalise, m.email, m.formationSouhaitee, m.codeId, m.status, m.stats?.totalReferred || 0, m.stats?.validatedCount || 0]);
      filename = "export_parrains.csv";
    } else if (type === "rewards") {
      headers = ["Référence", "Parrain ID", "Filleuls qualifiants", "Statut", "Formation offerte", "Centre", "Approuvé par", "Date décision"];
      rows = rewards.map(r => [r.reference, r.memberId, r.qualifyingCount, r.status, r.trainingId || "N/A", r.centerId || "N/A", r.approvedBy || "N/A", r.approvedAt || "N/A"]);
      filename = "export_recompenses.csv";
    } else {
      headers = ["Date", "Apprenant", "Téléphone", "Code utilisé", "Parrain ID", "Campagne", "Commerciale", "Statut"];
      rows = attributions.map(a => [a.createdAt, a.studentName, a.studentPhone, a.referralCodeId, a.referralMemberId, a.campaignId, a.recordedByName, a.status]);
      filename = "export_filleuls.csv";
    }

    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
      + [headers.join(";"), ...rows.map(e => e.join(";"))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV exporté avec succès !");
  };

  // Toggle Bulk Selection
  const handleToggleBulkSelect = (id: string) => {
    setBulkSelectRewards(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle All Bulk Selection
  const handleToggleAllBulk = () => {
    if (bulkSelectRewards.length === rewards.length) {
      setBulkSelectRewards([]);
    } else {
      setBulkSelectRewards(rewards.map(r => r.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-12 h-12 text-[#A66037] animate-spin mb-4" />
        <p className="text-[#5C3D2E] font-bold">Chargement des parrainages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 relative text-[#2D1A12]">
      <div className="absolute inset-0 dogon-pattern opacity-5 pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-[#5C3D2E] font-dogon uppercase tracking-tight">Programme de Parrainage</h1>
          <p className="text-[#B89E7E] mt-1">Gérez le programme commercial : « 5 inscriptions validées = 1 formation offerte ».</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCheckerOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-white border border-[#E8DCC4] hover:bg-[#FAF3E0] text-[#5C3D2E] rounded-2xl text-sm font-bold transition-all shadow-md cursor-pointer"
          >
            <UserCheck className="w-4 h-4" /> Vérifier un Client
          </button>
          {profile && ["super_admin", "admin_entreprise"].includes(profile.role) && (
            <button 
              onClick={() => setNewCampaignOpen(true)}
              className="flex items-center gap-2 px-5 py-3.5 bg-[#5C3D2E] hover:bg-[#A66037] text-white rounded-2xl text-sm font-bold transition-all shadow-lg cursor-pointer"
            >
              <Calendar className="w-4 h-4" /> Nouvelle Campagne
            </button>
          )}
          <button 
            onClick={() => setNewMemberOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-[#D4AF37] hover:scale-105 text-[#2D1A12] rounded-2xl text-sm font-bold transition-all shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Enregistrer un Parrain
          </button>
        </div>
      </div>

      {/* Alerts notification center */}
      {alerts4or5.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-[24px] space-y-3 relative overflow-hidden z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" />
            <h4 className="font-bold text-amber-800 text-sm">Alertes de progression de parrainage</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto custom-scrollbar">
            {alerts4or5.map(m => {
              const valCount = m.stats?.validatedCount || 0;
              return (
                <div key={m.id} className="p-3 bg-white border border-amber-100 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#5C3D2E]">{m.prenom} {m.nom}</span> (Code: <span className="font-black">{m.codeId}</span>)
                    <p className="text-[10px] text-[#B89E7E] mt-0.5">{valCount === 4 ? "Première récompense imminente !" : "Éligible à une formation offerte !"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1.5 rounded-lg font-bold text-[10px] uppercase ${valCount === 4 ? "bg-blue-50 text-blue-700" : "bg-emerald-50 text-emerald-700 animate-bounce"}`}>
                      {valCount}/5 validés
                    </span>
                    <button 
                      onClick={() => {
                        setSelectedParrain(m);
                        setParrainDetailsOpen(true);
                      }}
                      className="p-1 hover:bg-[#FAF3E0] rounded text-[#A66037] hover:text-[#5C3D2E]"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
         {[
            { label: "Prospects parrainés", value: statsSummary.totalAttributions, sub: `${statsSummary.pendingAttributions} en attente`, icon: Users, color: "text-[#5C3D2E]" },
            { label: "Inscriptions validées", value: statsSummary.validatedAttributions, sub: `Taux conversion : ${statsSummary.conversionRate}%`, icon: CheckCircle, color: "text-emerald-600" },
            { label: "Parrains actifs", value: statsSummary.activeParrains, sub: `Sur ${members.length} parrains inscrits`, icon: Award, color: "text-[#D4AF37]" },
            { label: "Formations offertes", value: statsSummary.approvedRewards, sub: `${rewards.filter(r => r.status === "eligible").length} à vérifier`, icon: Gift, color: "text-blue-600" },
         ].map((stat, i) => (
            <div key={i} className="bg-white p-5 rounded-3xl shadow-premium border border-[#E8DCC4] flex items-center gap-4 hover:shadow-dogon hover:-translate-y-1 transition-all duration-300">
               <div className="w-12 h-12 bg-[#FAF3E0] rounded-2xl flex items-center justify-center text-[#5C3D2E] border border-[#E8DCC4]">
                  <stat.icon className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest">{stat.label}</p>
                  <p className={`text-xl font-bold font-dogon ${stat.color} leading-none mt-1`}>{stat.value}</p>
                  <p className="text-[10px] text-[#A66037] mt-1 font-semibold">{stat.sub}</p>
               </div>
            </div>
         ))}
      </div>

      {/* Navigation tabs */}
      <div className="flex gap-4 border-b border-[#E8DCC4] pb-px overflow-x-auto custom-scrollbar">
        {[
          { id: "members", label: "Membres & Codes", icon: Users },
          { id: "filleuls", label: "Filleuls & Suivi", icon: Layers },
          { id: "rewards", label: "Contrôle des Récompenses", icon: Gift },
          { id: "frauds", label: "Anti-Fraude & Doublons", icon: ShieldAlert },
          { id: "campaigns", label: "Campagnes", icon: Calendar },
          { id: "performance", label: "Suivi Équipe", icon: BarChart3 },
          { id: "stats", label: "Graphiques & Simulation", icon: BarChart3 },
          { id: "logs", label: "Journal d'Audit", icon: Activity }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-4 font-bold text-sm tracking-wide transition-all border-b-2 uppercase cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? "border-[#5C3D2E] text-[#5C3D2E] font-black"
                  : "border-transparent text-[#B89E7E] hover:text-[#5C3D2E]"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MEMBERS */}
      {activeTab === "members" && (
        <div className="bg-white rounded-[40px] shadow-premium border border-[#E8DCC4] overflow-hidden relative z-10">
          <div className="p-8 border-b border-[#E8DCC4]/30 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B89E7E] group-focus-within:text-[#D4AF37] transition-colors" />
                <input 
                  type="text" 
                  placeholder="Rechercher un code, un parrain ou son numéro..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FAF3E0]/30 border border-[#E8DCC4] focus:ring-2 focus:ring-[#D4AF37]/20 focus:border-[#D4AF37] text-sm font-medium outline-none transition-all"
                />
              </div>
              <div className="flex items-center gap-3">
                 <select
                   value={selectedCampaignFilter}
                   onChange={e => setSelectedCampaignFilter(e.target.value)}
                   className="px-4 py-2.5 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none cursor-pointer"
                 >
                   <option value="Tous">Toutes les campagnes</option>
                   {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
                 <select
                   value={selectedStatusFilter}
                   onChange={e => setSelectedStatusFilter(e.target.value)}
                   className="px-4 py-2.5 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none cursor-pointer"
                 >
                   <option value="Tous">Tous les statuts</option>
                   <option value="active">🟢 Actif</option>
                   <option value="suspended">🔴 Suspendu</option>
                 </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#FAF3E0]/50 text-[#A66037] text-[10px] font-bold uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Code</th>
                  <th className="px-8 py-5">Parrain</th>
                  <th className="px-8 py-5">Téléphone</th>
                  <th className="px-8 py-5">Campagne</th>
                  <th className="px-8 py-5">Filleuls (V/T)</th>
                  <th className="px-8 py-5">Progression</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCC4]/20 text-sm">
                {processedMembers.map(m => {
                  const valCount = m.stats?.validatedCount || 0;
                  const totalCount = m.stats?.totalReferred || 0;
                  const progressPct = Math.min((valCount / 5) * 100, 100);

                  return (
                    <tr key={m.id} className="hover:bg-[#FAF3E0]/30 transition-colors">
                      <td className="px-8 py-5 font-black text-[#5C3D2E]">{m.codeId}</td>
                      <td className="px-8 py-5 font-semibold">{m.prenom} {m.nom}</td>
                      <td className="px-8 py-5 text-gray-500">{m.telephoneNormalise.replace(/(.{3})(.{3})(.{4})/, "$1 $2 ***")}</td>
                      <td className="px-8 py-5 text-xs text-[#A66037] font-bold">{campaigns.find(c => c.id === m.campagneId)?.name || m.campagneId}</td>
                      <td className="px-8 py-5 font-bold">{valCount} / {totalCount}</td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                           <div className="w-24 h-2 bg-[#FAF3E0] border border-[#E8DCC4] rounded-full overflow-hidden">
                              <div className="h-full bg-[#D4AF37] transition-all" style={{ width: `${progressPct}%` }} />
                           </div>
                           <span className="text-[10px] font-bold text-[#A66037]">{valCount}/5</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                          m.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                        }`}>
                          {m.status}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end gap-2">
                           <button 
                             onClick={() => {
                               setSelectedParrain(m);
                               setParrainDetailsOpen(true);
                             }}
                             className="px-3 py-1.5 bg-[#FAF3E0] hover:bg-[#E8DCC4]/30 text-[#5C3D2E] rounded-xl text-xs font-bold transition-all cursor-pointer"
                           >
                             Consulter
                           </button>
                           {profile && ["super_admin", "admin_entreprise", "superviseur"].includes(profile.role) && (
                             <button 
                               onClick={() => handleToggleMemberStatus(m)}
                               className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                 m.status === "active" ? "bg-red-50 text-red-600 hover:bg-red-600 hover:text-white" : "bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                               }`}
                             >
                               {m.status === "active" ? "Suspendre" : "Réactiver"}
                             </button>
                           )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {processedMembers.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-20 text-center text-[#B89E7E] italic">Aucun parrain enregistré ou ne correspond aux filtres.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: FILLEULS DIRECTORY (NEW) */}
      {activeTab === "filleuls" && (
        <div className="bg-white rounded-[40px] shadow-premium border border-[#E8DCC4] overflow-hidden relative z-10">
          <div className="p-8 border-b border-[#E8DCC4]/30 space-y-4 bg-[#FAF3E0]/15">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#5C3D2E] font-dogon">Répertoire des Filleuls</h3>
                <p className="text-xs text-[#B89E7E] mt-0.5">Suivi de toutes les attributions de parrainage et de leur état de validation.</p>
              </div>
              <div className="flex items-center gap-3">
                 <select
                   value={filleulStatusFilter}
                   onChange={e => setFilleulStatusFilter(e.target.value)}
                   className="px-4 py-2.5 rounded-xl bg-[#FAF3E0]/40 border border-[#E8DCC4] text-xs font-bold text-primary outline-none cursor-pointer"
                 >
                   <option value="Tous">Tous les statuts de paiement</option>
                   <option value="Confirmé">Confirmé</option>
                   <option value="inscription validée">inscription validée</option>
                   <option value="prospect enregistré">prospect enregistré</option>
                   <option value="paiement à vérifier">paiement à vérifier</option>
                 </select>
              </div>
            </div>
            <div className="relative max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B89E7E]" />
              <input 
                type="text" 
                placeholder="Rechercher par filleul, téléphone ou code..." 
                value={filleulSearch}
                onChange={(e) => setFilleulSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white border border-[#E8DCC4] text-sm font-medium outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#FAF3E0]/50 text-[#A66037] text-[10px] font-bold uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Date</th>
                  <th className="px-8 py-5">Filleul</th>
                  <th className="px-8 py-5">Téléphone</th>
                  <th className="px-8 py-5">Code Utilisé</th>
                  <th className="px-8 py-5">Parrain Bénéficiaire</th>
                  <th className="px-8 py-5">Statut de Vente</th>
                  <th className="px-8 py-5">Whiteliste</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCC4]/20">
                {processedFilleuls.map(f => {
                  const parName = members.find(m => m.id === f.referralMemberId);
                  return (
                    <tr key={f.id} className="hover:bg-[#FAF3E0]/30 transition-colors">
                      <td className="px-8 py-5 text-gray-500">{new Date(f.createdAt).toLocaleDateString("fr-FR")}</td>
                      <td className="px-8 py-5 font-bold">{f.studentName}</td>
                      <td className="px-8 py-5 text-gray-500">{f.studentPhone}</td>
                      <td className="px-8 py-5 font-black text-[#5C3D2E]">{f.referralCodeId}</td>
                      <td className="px-8 py-5 font-semibold">{parName ? `${parName.prenom} ${parName.nom}` : "Inconnu"}</td>
                      <td className="px-8 py-5">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                          ["Confirmé", "inscription validée"].includes(f.status) 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                            : "bg-amber-50 text-amber-700 border-amber-100"
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        {f.isWhitelisted ? (
                          <span className="px-2 py-1 bg-emerald-100 text-emerald-800 rounded-lg text-[9px] font-black uppercase flex items-center gap-1 w-max" title={f.whitelistReason}>
                            <Check className="w-3 h-3" /> cleared
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {processedFilleuls.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-[#B89E7E] italic">Aucun filleul enregistré ou ne correspond aux filtres.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: REWARDS CONTROL */}
      {activeTab === "rewards" && (
        <div className="bg-white rounded-[40px] shadow-premium border border-[#E8DCC4] overflow-hidden relative z-10">
          <div className="p-8 border-b border-[#E8DCC4]/30 flex justify-between items-center bg-[#FAF3E0]/20">
            <div>
              <h3 className="font-bold text-[#5C3D2E] font-dogon">Dossiers de Récompense</h3>
              <p className="text-xs text-[#B89E7E] mt-0.5">Validez l&apos;attribution de la formation offerte aux parrains ayant atteint 5 filleuls validés.</p>
            </div>
            <div className="flex items-center gap-3">
              {bulkSelectRewards.length > 0 && (
                <button 
                  onClick={() => setBulkActionOpen(true)}
                  className="px-4 py-2 bg-[#5C3D2E] text-white hover:bg-[#A66037] rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-2"
                >
                  <Layers className="w-4 h-4" /> Décision groupée ({bulkSelectRewards.length})
                </button>
              )}
              <p className="text-sm font-bold text-[#B89E7E]">{joinedRewards.length} dossier(s)</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#FAF3E0]/50 text-[#A66037] text-[10px] font-bold uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">
                    <input 
                      type="checkbox" 
                      checked={bulkSelectRewards.length === rewards.length && rewards.length > 0}
                      onChange={handleToggleAllBulk}
                      className="rounded border-[#E8DCC4] text-[#5C3D2E]"
                    />
                  </th>
                  <th className="px-8 py-5">Référence</th>
                  <th className="px-8 py-5">Parrain</th>
                  <th className="px-8 py-5">Dossier créé</th>
                  <th className="px-8 py-5">Formation sélectionnée</th>
                  <th className="px-8 py-5">Statut</th>
                  <th className="px-8 py-5 text-right">Décision / Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCC4]/20 text-sm">
                {joinedRewards.map(reward => (
                  <tr key={reward.id} className="hover:bg-[#FAF3E0]/30 transition-colors">
                    <td className="px-8 py-5">
                      <input 
                        type="checkbox"
                        checked={bulkSelectRewards.includes(reward.id)}
                        onChange={() => handleToggleBulkSelect(reward.id)}
                        className="rounded border-[#E8DCC4] text-[#5C3D2E]"
                      />
                    </td>
                    <td className="px-8 py-5 font-black text-[#5C3D2E]">{reward.reference}</td>
                    <td className="px-8 py-5 font-semibold">{reward.memberPrenom} {reward.memberNom}</td>
                    <td className="px-8 py-5 text-gray-500">{new Date(reward.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="px-8 py-5 text-xs font-semibold">{reward.trainingId ? `${reward.trainingId} (${reward.centerId})` : "Aucune / Non définie"}</td>
                    <td className="px-8 py-5">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase border ${
                        ["approuvee", "programmee", "attribuee", "utilisee"].includes(reward.status)
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : reward.status === "eligible" || reward.status === "verification_en_cours"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      }`}>
                        {reward.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        {["approuvee", "programmee", "attribuee", "utilisee"].includes(reward.status) && (
                          <button 
                            onClick={() => generatePDFVoucher(reward)}
                            className="px-3 py-1.5 bg-[#5C3D2E] hover:bg-[#A66037] text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" /> PDF
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedReward(reward);
                            setRewardForm({
                              status: reward.status,
                              trainingId: reward.trainingId || "",
                              centerId: reward.centerId || "",
                              notes: reward.notes || "",
                              dateLimite: reward.expiresAt ? reward.expiresAt.substring(0,10) : new Date(Date.now() + 90 * 24 * 3600 * 1000).toISOString().split("T")[0]
                            });
                            setRewardActionOpen(true);
                          }}
                          disabled={profile?.role === "commerciale"}
                          className="px-3 py-1.5 bg-[#FAF3E0] hover:bg-[#E8DCC4]/30 text-[#5C3D2E] rounded-xl text-xs font-bold transition-all disabled:opacity-30 cursor-pointer"
                        >
                          Traiter
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {joinedRewards.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-20 text-center text-[#B89E7E] italic">Aucun dossier de récompense généré pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ANTI-FRAUD & DUPLICATES */}
      {activeTab === "frauds" && (
        <div className="bg-white rounded-[40px] shadow-premium border border-[#E8DCC4] overflow-hidden relative z-10">
          <div className="p-8 border-b border-[#E8DCC4]/30 flex justify-between items-center bg-red-50/20">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-[#5C3D2E] font-dogon">Détection d&apos;Anomalies et Risques</h3>
                <button 
                  onClick={() => setConfigOpen(true)}
                  className="p-1 hover:bg-[#FAF3E0] rounded text-[#A66037] hover:text-[#5C3D2E]"
                  title="Paramètres de décompte"
                >
                  <Settings className="w-4 h-4 animate-spin-slow" />
                </button>
              </div>
              <p className="text-xs text-red-800 mt-0.5">Contrôlez les comportements potentiellement frauduleux ou les doublons de coordonnées.</p>
            </div>
            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold">{fraudDossiers.length} alerte(s)</span>
          </div>

          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#FAF3E0]/50 text-[#A66037] text-[10px] font-bold uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Type de Risque</th>
                  <th className="px-8 py-5">Niveau de Risque</th>
                  <th className="px-8 py-5">Description</th>
                  <th className="px-8 py-5">Preuves & Éléments</th>
                  <th className="px-8 py-5">Date d&apos;Alerte</th>
                  <th className="px-8 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCC4]/20">
                {fraudDossiers.map((fraud, idx) => (
                  <tr key={idx} className="hover:bg-red-50/10 transition-colors">
                    <td className="px-8 py-5 font-bold flex items-center gap-2">
                       <AlertTriangle className="w-4 h-4 text-red-500" />
                       {fraud.type}
                    </td>
                    <td className="px-8 py-5">
                       <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                          fraud.risk === "critique" ? "bg-red-100 text-red-800 border-red-200" : "bg-orange-50 text-orange-700 border-orange-100"
                       }`}>
                          {fraud.risk}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-xs text-gray-700">{fraud.detail}</td>
                    <td className="px-8 py-5 text-xs font-semibold text-[#A66037]">{fraud.evidence}</td>
                    <td className="px-8 py-5 text-gray-500">{new Date(fraud.timestamp).toLocaleString("fr-FR")}</td>
                    <td className="px-8 py-5 text-right">
                      {profile && ["super_admin", "admin_entreprise", "superviseur"].includes(profile.role) && (
                        <button 
                          onClick={() => {
                            setSelectedFraudItem(fraud.rawItem);
                            setWhitelistModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-[#FAF3E0] hover:bg-[#E8DCC4]/30 text-[#5C3D2E] rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          Clear/Whitelist
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                {fraudDossiers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-20 text-center text-emerald-600 font-bold italic">✓ Aucun risque ou comportement suspect détecté dans les parrainages.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: CAMPAIGNS */}
      {activeTab === "campaigns" && (
        <div className="bg-white rounded-[40px] shadow-premium border border-[#E8DCC4] overflow-hidden relative z-10">
          <div className="p-8 border-b border-[#E8DCC4]/30 flex justify-between items-center bg-[#FAF3E0]/20">
            <div>
              <h3 className="font-bold text-[#5C3D2E] font-dogon">Campagnes Commerciales</h3>
              <p className="text-xs text-[#B89E7E] mt-0.5">Définissez et expirez les campagnes de parrainage.</p>
            </div>
          </div>

          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#FAF3E0]/50 text-[#A66037] text-[10px] font-bold uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">ID de Campagne</th>
                  <th className="px-8 py-5">Nom</th>
                  <th className="px-8 py-5">Description</th>
                  <th className="px-8 py-5">Date Début</th>
                  <th className="px-8 py-5">Date Fin</th>
                  <th className="px-8 py-5">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCC4]/20">
                {campaigns.map(camp => (
                  <tr key={camp.id} className="hover:bg-[#FAF3E0]/30 transition-colors">
                    <td className="px-8 py-5 font-black text-[#5C3D2E]">{camp.id}</td>
                    <td className="px-8 py-5 font-bold">{camp.name}</td>
                    <td className="px-8 py-5 text-xs text-gray-600">{camp.description}</td>
                    <td className="px-8 py-5 text-gray-500">{camp.startDate}</td>
                    <td className="px-8 py-5 text-gray-500">{camp.endDate}</td>
                    <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase border ${
                        camp.status === "active" ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-red-50 text-red-700 border-red-100"
                      }`}>
                        {camp.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: TEAM PERFORMANCE */}
      {activeTab === "performance" && (
        <div className="bg-white rounded-[40px] shadow-premium border border-[#E8DCC4] overflow-hidden relative z-10">
          <div className="p-8 border-b border-[#E8DCC4]/30 bg-[#FAF3E0]/20">
            <h3 className="font-bold text-[#5C3D2E] font-dogon">Performances des Commerciales</h3>
            <p className="text-xs text-[#B89E7E] mt-0.5">Suivi des parrainages enregistrés par membre de l&apos;équipe commerciale.</p>
          </div>

          <div className="overflow-x-auto text-sm">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#FAF3E0]/50 text-[#A66037] text-[10px] font-bold uppercase tracking-[0.2em]">
                  <th className="px-8 py-5">Commerciale</th>
                  <th className="px-8 py-5">Email</th>
                  <th className="px-8 py-5">Filleuls Enregistrés</th>
                  <th className="px-8 py-5">Filleuls Validés</th>
                  <th className="px-8 py-5">Taux de Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCC4]/20">
                {teamPerformance.map((rep, idx) => (
                  <tr key={idx} className="hover:bg-[#FAF3E0]/30 transition-colors">
                    <td className="px-8 py-5 font-bold text-[#5C3D2E]">{rep.name}</td>
                    <td className="px-8 py-5 text-gray-500">{rep.email}</td>
                    <td className="px-8 py-5 font-black">{rep.totalReferred}</td>
                    <td className="px-8 py-5 font-black text-emerald-600">{rep.validatedCount}</td>
                    <td className="px-8 py-5 font-bold">
                       <span className="text-sm font-dogon text-[#A66037]">{rep.conversionRate}%</span>
                    </td>
                  </tr>
                ))}
                {teamPerformance.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-20 text-center text-[#B89E7E] italic">Aucun parrainage enregistré par l&apos;équipe commerciale pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: CHARTS, LEADERBOARD, SIMULATOR */}
      {activeTab === "stats" && (
        <div className="space-y-8 relative z-10">
          
          {/* ROI KPI Financial Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-sm">
              <p className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest">Valeur Générée par le Parrainage</p>
              <h3 className="text-2xl font-black font-dogon text-emerald-600 mt-1">{statsSummary.estimatedValueGenerated.toLocaleString()} FCFA</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Sur la base de 150 000 FCFA par formation validée.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-sm">
              <p className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest">Investissement Formations Offertes</p>
              <h3 className="text-2xl font-black font-dogon text-blue-600 mt-1">{statsSummary.estimatedCostOfRewards.toLocaleString()} FCFA</h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Pour {statsSummary.approvedRewards} bons validés.</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] shadow-sm">
              <p className="text-[10px] font-bold text-[#B89E7E] uppercase tracking-widest">Bilan Net & ROI estimé</p>
              <h3 className="text-2xl font-black font-dogon text-[#A66037] mt-1">
                {statsSummary.calculatedNetProfit.toLocaleString()} FCFA
              </h3>
              <p className="text-[10px] text-gray-400 mt-0.5">Taux de ROI de l&apos;opération : <span className="font-bold text-emerald-600">+{statsSummary.grossRoi}%</span></p>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4] grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="p-6 bg-[#FAF3E0]/20 border border-[#E8DCC4] rounded-2xl flex flex-col justify-between">
                <div>
                   <h4 className="font-bold text-sm text-[#5C3D2E] uppercase tracking-wider mb-2">Base Parrains</h4>
                   <p className="text-xs text-[#B89E7E]">Exportez la liste des parrains, codes, et progression cumulée.</p>
                </div>
                <button 
                  onClick={() => handleExportCSV("members")}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-[#5C3D2E] text-white font-bold text-xs rounded-xl hover:bg-[#A66037] transition-all cursor-pointer shadow-md"
                >
                   <Download className="w-4 h-4" /> Export CSV Parrains
                </button>
             </div>
             <div className="p-6 bg-[#FAF3E0]/20 border border-[#E8DCC4] rounded-2xl flex flex-col justify-between">
                <div>
                   <h4 className="font-bold text-sm text-[#5C3D2E] uppercase tracking-wider mb-2">Historique Filleuls</h4>
                   <p className="text-xs text-[#B89E7E]">Téléchargez toutes les fiches d&apos;attribution et statuts financiers.</p>
                </div>
                <button 
                  onClick={() => handleExportCSV("attributions")}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-[#5C3D2E] text-white font-bold text-xs rounded-xl hover:bg-[#A66037] transition-all cursor-pointer shadow-md"
                >
                   <Download className="w-4 h-4" /> Export CSV Filleuls
                </button>
             </div>
             <div className="p-6 bg-[#FAF3E0]/20 border border-[#E8DCC4] rounded-2xl flex flex-col justify-between">
                <div>
                   <h4 className="font-bold text-sm text-[#5C3D2E] uppercase tracking-wider mb-2">Bilan Récompenses</h4>
                   <p className="text-xs text-[#B89E7E]">Suivi des bons de formation offerte accordés et validés.</p>
                </div>
                <button 
                  onClick={() => handleExportCSV("rewards")}
                  className="mt-6 flex items-center justify-center gap-2 w-full py-3 bg-[#5C3D2E] text-white font-bold text-xs rounded-xl hover:bg-[#A66037] transition-all cursor-pointer shadow-md"
                >
                   <Download className="w-4 h-4" /> Export CSV Récompenses
                </button>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             {/* Filleuls par Mois */}
             <div className="bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4]">
                <h3 className="font-bold text-lg text-primary font-dogon mb-6">Inscriptions Parrainées</h3>
                <div className="h-[260px] w-full">
                   {statsSummary.chartMonthlyData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={statsSummary.chartMonthlyData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E8DCC460" />
                            <XAxis dataKey="name" fontSize={11} />
                            <YAxis fontSize={11} />
                            <Tooltip contentStyle={{ borderRadius: "12px" }} />
                            <Bar dataKey="count" fill="#A66037" name="Filleuls" radius={[4, 4, 0, 0]} />
                         </BarChart>
                      </ResponsiveContainer>
                   ) : (
                      <p className="h-full flex items-center justify-center text-xs text-[#B89E7E] italic">Aucune donnée disponible.</p>
                   )}
                </div>
             </div>

             {/* Répartition par Campagne */}
             <div className="bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4]">
                <h3 className="font-bold text-lg text-primary font-dogon mb-6">Répartition par Campagne</h3>
                <div className="h-[260px] w-full flex items-center justify-center">
                   {statsSummary.chartCampaignData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                         <PieChart>
                            <Pie
                                data={statsSummary.chartCampaignData}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                               {statsSummary.chartCampaignData.map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={["#5C3D2E", "#A66037", "#D4AF37", "#059669"][index % 4]} />
                               ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                         </PieChart>
                      </ResponsiveContainer>
                   ) : (
                      <p className="h-full flex items-center justify-center text-xs text-[#B89E7E] italic">Aucune donnée disponible.</p>
                   )}
                </div>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Leaderboard panel */}
            <div className="bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4] space-y-6">
              <div>
                <h3 className="font-bold text-lg text-[#5C3D2E] font-dogon">Classement des Ambassadeurs (Parrains)</h3>
                <p className="text-xs text-[#B89E7E] mt-0.5">Top parrains ayant obtenu le plus de filleuls validés.</p>
              </div>
              <div className="space-y-3">
                {ambassadorLeaderboard.map((m, idx) => {
                  const valCount = m.stats?.validatedCount || 0;
                  const badge = 
                    valCount >= 10 ? "Or 🥇" : 
                    valCount >= 5 ? "Argent 🥈" : "Bronze 🥉";
                  return (
                    <div key={m.id} className="p-4 bg-[#FAF3E0]/20 rounded-2xl flex items-center justify-between border border-[#E8DCC4]/40">
                      <div className="flex items-center gap-3">
                        <span className="font-bold font-dogon text-lg text-[#5C3D2E]">#{idx + 1}</span>
                        <div>
                          <p className="font-bold text-sm text-[#2D1A12]">{m.prenom} {m.nom}</p>
                          <span className="text-[10px] font-black tracking-widest text-[#A66037]">{m.codeId}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="px-2.5 py-1 bg-[#5C3D2E] text-white text-[10px] font-black rounded-lg uppercase">
                          {badge}
                        </span>
                        <span className="font-black text-sm text-[#5C3D2E]">{valCount} validés</span>
                      </div>
                    </div>
                  );
                })}
                {ambassadorLeaderboard.length === 0 && (
                  <p className="text-xs text-[#B89E7E] italic text-center py-12">Aucun ambassadeur classé pour le moment.</p>
                )}
              </div>
            </div>

            {/* Campaign ROI simulator */}
            <div className="bg-white p-8 rounded-[40px] shadow-premium border border-[#E8DCC4] space-y-6">
              <div>
                <h3 className="font-bold text-lg text-[#5C3D2E] font-dogon">Simulateur de Gain Parrainage</h3>
                <p className="text-xs text-[#B89E7E] mt-0.5">Simulez le rendement financier et l&apos;impact des parrainages.</p>
              </div>
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#A66037] uppercase tracking-wider block">Nombre de parrains actifs</label>
                    <input 
                      type="number"
                      value={simParrains}
                      onChange={e => setSimParrains(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#FAF3E0]/30 border border-[#E8DCC4] rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#A66037] uppercase tracking-wider block">Filleuls par parrain (moyen)</label>
                    <input 
                      type="number"
                      value={simFilleulsPerParrain}
                      onChange={e => setSimFilleulsPerParrain(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#FAF3E0]/30 border border-[#E8DCC4] rounded-xl font-bold"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#A66037] uppercase tracking-wider block">Taux de validation (%)</label>
                    <input 
                      type="number"
                      value={simConversionRate}
                      onChange={e => setSimConversionRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#FAF3E0]/30 border border-[#E8DCC4] rounded-xl font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-bold text-[#A66037] uppercase tracking-wider block">Valeur Inscription (FCFA)</label>
                    <input 
                      type="number"
                      value={simAvgRevenue}
                      onChange={e => setSimAvgRevenue(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-[#FAF3E0]/30 border border-[#E8DCC4] rounded-xl font-bold"
                    />
                  </div>
                </div>

                {/* Computations results */}
                <div className="p-4 bg-[#FAF3E0] rounded-2xl border border-[#E8DCC4] space-y-2 text-xs">
                  {(() => {
                    const totalLeads = simParrains * simFilleulsPerParrain;
                    const validated = Math.round(totalLeads * (simConversionRate / 100));
                    const revenue = validated * simAvgRevenue;
                    const freeOffered = Math.floor(validated / 5);
                    const netIncome = revenue - (freeOffered * simAvgRevenue);
                    const roi = freeOffered > 0 ? Math.round((revenue / (freeOffered * simAvgRevenue)) * 100) : 0;

                    return (
                      <>
                        <div className="flex justify-between">
                          <span>Total filleuls enregistrés :</span>
                          <span className="font-bold">{totalLeads}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Filleuls validés :</span>
                          <span className="font-bold text-emerald-600">{validated}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Chiffre d&apos;affaires brut :</span>
                          <span className="font-black">{revenue.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Formations gratuites offertes :</span>
                          <span className="font-bold text-[#A66037]">{freeOffered} session(s)</span>
                        </div>
                        <div className="border-t border-[#E8DCC4]/50 my-1 pt-1 flex justify-between font-black text-sm text-[#5C3D2E]">
                          <span>Bénéfice net simulé :</span>
                          <span>{netIncome.toLocaleString()} FCFA</span>
                        </div>
                        {freeOffered > 0 && (
                          <div className="text-[10px] text-emerald-700 font-bold text-right">
                            ROI estimé : +{roi}% sur l&apos;investissement offert.
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: JOURNAL AUDIT (NEW) */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-[40px] shadow-premium border border-[#E8DCC4] overflow-hidden relative z-10">
          <div className="p-8 border-b border-[#E8DCC4]/30 bg-[#FAF3E0]/20">
            <h3 className="font-bold text-[#5C3D2E] font-dogon">Journal d&apos;Audit Parrainage</h3>
            <p className="text-xs text-[#B89E7E] mt-0.5">Suivi de toutes les actions d&apos;attribution et décisions administratives.</p>
          </div>

          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF3E0]/30 text-[#A66037] font-bold uppercase tracking-wider sticky top-0 bg-white">
                <tr>
                  <th className="p-4">Horodatage</th>
                  <th className="p-4">Utilisateur</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8DCC4]/20">
                {auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-[#FAF3E0]/10">
                    <td className="p-4 text-gray-500">{new Date(log.timestamp).toLocaleString("fr-FR")}</td>
                    <td className="p-4 font-bold text-[#5C3D2E]">{log.userEmail}</td>
                    <td className="p-4">
                      <span className="px-2 py-0.5 bg-stone-100 text-stone-800 rounded font-black text-[9px] uppercase">
                        {log.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700">{log.details}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-12 text-center text-[#B89E7E] italic">Aucune action consignée pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: PARRAIN DETAILS */}
      {parrainDetailsOpen && selectedParrain && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
           <div className="bg-[#FAF3E0] w-full max-w-2xl max-h-[85vh] rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col">
              <div className="bg-[#5C3D2E] p-6 text-[#FAF3E0] flex justify-between items-center relative shrink-0">
                 <div className="relative z-10">
                    <h3 className="text-xl font-bold font-dogon">Fiche Parrain : {selectedParrain.prenom} {selectedParrain.nom}</h3>
                    <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest mt-1">Dossiers d&apos;attribution et progression</p>
                  </div>
                  <button onClick={() => setParrainDetailsOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                     <X className="w-5 h-5" />
                  </button>
              </div>

              <div className="p-8 flex-1 overflow-y-auto space-y-6">
                 
                 {/* Basic details */}
                 <div className="grid grid-cols-2 gap-4 text-xs bg-white p-5 rounded-2xl border border-[#E8DCC4]">
                    <p><strong>Code Parrain</strong> : <span className="font-black text-[#5C3D2E]">{selectedParrain.codeId}</span></p>
                    <p><strong>Téléphone</strong> : {selectedParrain.telephoneNormalise}</p>
                    <p><strong>Email</strong> : {selectedParrain.email || "Non renseigné"}</p>
                    <p><strong>Formation souhaitée</strong> : {selectedParrain.formationSouhaitee}</p>
                    <p><strong>Date d&apos;adhésion</strong> : {new Date(selectedParrain.createdAt).toLocaleDateString("fr-FR")}</p>
                    <p><strong>Statut du Compte</strong> : <span className="font-bold uppercase text-emerald-600">{selectedParrain.status}</span></p>
                 </div>

                 {/* Digital QR Card Generation Section (New Feature) */}
                 <div className="bg-white p-6 rounded-3xl border border-[#E8DCC4] flex flex-col items-center space-y-4">
                   <h4 className="text-xs font-bold text-[#A66037] uppercase tracking-widest">Carte Ambassadeur Numérique</h4>
                   
                   {/* Digital Card Preview */}
                   <div className="w-80 h-48 rounded-2xl bg-gradient-to-r from-[#5C3D2E] to-[#8B5E3C] p-4 text-[#FAF3E0] flex flex-col justify-between shadow-xl relative overflow-hidden">
                     <div className="absolute right-0 bottom-0 w-24 h-24 opacity-10 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-200 via-amber-400 to-amber-900 rounded-full" />
                     <div className="flex justify-between items-start">
                       <div>
                         <p className="text-[9px] tracking-widest text-[#D4AF37] font-bold">GALF FORMATION</p>
                         <h4 className="text-sm font-bold font-dogon mt-0.5">{selectedParrain.prenom} {selectedParrain.nom}</h4>
                       </div>
                       <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                     </div>

                     <div className="flex justify-between items-end">
                       <div>
                         <p className="text-[8px] text-[#FAF3E0]/60 tracking-wider">CODE UNIQUE</p>
                         <p className="text-xl font-black font-mono leading-none tracking-widest text-[#D4AF37]">{selectedParrain.codeId}</p>
                       </div>
                       
                       {/* Interactive API QR Generator */}
                       <img 
                         src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&color=5c3d2e&bgcolor=faf3e0&data=https://galf.ci/inscription?ref=${selectedParrain.codeId}`}
                         alt="QR Code Parrain"
                         className="w-12 h-12 bg-white p-1 rounded"
                       />
                     </div>
                   </div>

                   <div className="flex gap-2">
                     <button 
                       onClick={() => {
                         navigator.clipboard.writeText(`https://galf.ci/inscription?ref=${selectedParrain.codeId}`);
                         toast.success("Lien de parrainage copié !");
                       }}
                       className="px-4 py-2 bg-[#FAF3E0] hover:bg-[#E8DCC4]/30 border border-[#E8DCC4] text-[#5C3D2E] text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                     >
                       <Copy className="w-3.5 h-3.5" /> Copier le lien
                     </button>
                   </div>
                 </div>

                 {/* WhatsApp / SMS Templates Panel (New Feature) */}
                 <div className="space-y-3">
                   <h4 className="text-xs font-bold text-[#A66037] uppercase tracking-widest">Modèles de Partage</h4>
                   <div className="space-y-2">
                     {[
                       { title: "Invitation WhatsApp/SMS", text: `Bonjour ! Rejoins-moi chez GALF Formation pour te former aux métiers d'avenir. Utilise mon code parrain "${selectedParrain.codeId}" lors de ton inscription : https://galf.ci/inscription?ref=${selectedParrain.codeId}` },
                       { title: "Relance Filleul en attente", text: `Salut ! N'oublie pas de finaliser ton inscription chez GALF Formation avec mon code parrain "${selectedParrain.codeId}" pour valider ton entrée !` }
                     ].map((t, i) => (
                       <div key={i} className="p-3 bg-white border border-[#E8DCC4]/40 rounded-xl space-y-1.5">
                         <div className="flex justify-between items-center">
                           <span className="text-[10px] font-bold text-[#5C3D2E]">{t.title}</span>
                           <button 
                             onClick={() => {
                               navigator.clipboard.writeText(t.text);
                               toast.success("Modèle de message copié !");
                             }}
                             className="p-1 hover:bg-[#FAF3E0] rounded text-[#A66037]"
                             title="Copier le texte"
                           >
                             <Copy className="w-3.5 h-3.5" />
                           </button>
                         </div>
                         <p className="text-[10px] text-gray-500 italic bg-[#FAF3E0]/15 p-2 rounded">{t.text}</p>
                       </div>
                     ))}
                   </div>
                 </div>

                 {/* Filleuls table */}
                 <div className="space-y-2">
                    <h4 className="text-xs font-bold text-[#A66037] uppercase tracking-widest">Inscriptions Filleuls Rattachées</h4>
                    <div className="max-h-56 overflow-y-auto border border-[#E8DCC4] rounded-2xl overflow-hidden bg-white custom-scrollbar">
                       <table className="w-full text-left text-xs">
                          <thead className="bg-[#FAF3E0]/30 text-[#A66037] font-bold">
                             <tr>
                                <th className="p-3">Filleul</th>
                                <th className="p-3">Téléphone</th>
                                <th className="p-3">Date</th>
                                <th className="p-3">Statut Vente</th>
                                <th className="p-3">Comptabilisé</th>
                             </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E8DCC4]/20">
                             {attributions.filter(a => a.referralMemberId === selectedParrain.id).map(a => {
                                const isCounted = ["Confirmé", "inscription validée"].includes(a.status);
                                return (
                                   <tr key={a.id} className="hover:bg-[#FAF3E0]/10">
                                      <td className="p-3 font-semibold">{a.studentName}</td>
                                      <td className="p-3 text-gray-500">{a.studentPhone}</td>
                                      <td className="p-3 text-gray-500">{new Date(a.createdAt).toLocaleDateString("fr-FR")}</td>
                                      <td className="p-3 font-bold">{a.status}</td>
                                      <td className="p-3">
                                         <span className={`px-2 py-0.5 rounded font-bold text-[9px] ${
                                            isCounted ? "bg-emerald-100 text-emerald-800" : "bg-red-50 text-red-700"
                                         }`}>
                                            {isCounted ? "OUI" : "NON"}
                                         </span>
                                      </td>
                                   </tr>
                                );
                             })}
                             {attributions.filter(a => a.referralMemberId === selectedParrain.id).length === 0 && (
                                <tr>
                                   <td colSpan={5} className="p-6 text-center text-[#B89E7E] italic">Aucun filleul rattaché à ce parrain.</td>
                                </tr>
                             )}
                          </tbody>
                       </table>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: TREAT REWARD DOSSIER */}
      {rewardActionOpen && selectedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
           <form onSubmit={handleProcessReward} className="bg-[#FAF3E0] w-full max-w-lg rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col">
              <div className="bg-[#5C3D2E] p-6 text-[#FAF3E0] flex justify-between items-center relative shrink-0">
                 <div>
                    <h3 className="text-xl font-bold font-dogon">Décision Récompense</h3>
                    <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest mt-1">Réf: {selectedReward.reference}</p>
                 </div>
                 <button type="button" onClick={() => setRewardActionOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-8 space-y-4">
                 <div className="bg-white p-4 rounded-xl border border-[#E8DCC4] text-xs space-y-1">
                    <p><strong>Parrain</strong> : {selectedReward.memberPrenom} {selectedReward.memberNom}</p>
                    <p><strong>Dossier déclenché par</strong> : 5 inscriptions validées</p>
                    <p><strong>Méthode d&apos;attribution</strong> : Vérification automatique administrative</p>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Statut Récompense *</label>
                    <select
                      value={rewardForm.status}
                      onChange={e => setRewardForm({ ...rewardForm, status: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    >
                      <option value="eligible">eligible — Vérification administrative en cours</option>
                      <option value="approuvee">approuvee — Formation offerte approuvée</option>
                      <option value="programmee">programmee — Session programmée</option>
                      <option value="attribuee">attribuee — Bons d&apos;attribution remis</option>
                      <option value="utilisee">utilisee — Utilisé par le parrain</option>
                      <option value="refusee">refusee — Refusé (Fraude, non-conformité)</option>
                      <option value="annulee">annulee — Annulé</option>
                    </select>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Formation offerte choisie</label>
                    <input
                      type="text"
                      value={rewardForm.trainingId}
                      onChange={e => setRewardForm({ ...rewardForm, trainingId: e.target.value })}
                      placeholder="Ex: Pelle hydraulique, HSE..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Centre / Agence</label>
                       <input
                         type="text"
                         value={rewardForm.centerId}
                         onChange={e => setRewardForm({ ...rewardForm, centerId: e.target.value })}
                         placeholder="Ex: Abidjan, Yamoussoukro"
                         className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Date limite d&apos;utilisation</label>
                       <input
                         type="date"
                         value={rewardForm.dateLimite}
                         onChange={e => setRewardForm({ ...rewardForm, dateLimite: e.target.value })}
                         className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Notes internes & Motif</label>
                    <textarea
                      value={rewardForm.notes}
                      onChange={e => setRewardForm({ ...rewardForm, notes: e.target.value })}
                      placeholder="Indiquez ici tout élément de justification comptable ou motif de refus..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none"
                    />
                 </div>

                 <div className="border-t border-[#E8DCC4]/30 pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setRewardActionOpen(false)}
                      className="flex-1 py-3 bg-white hover:bg-[#FAF3E0] border border-[#E8DCC4] rounded-xl text-xs font-bold text-[#5C3D2E] transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 bg-[#5C3D2E] text-white hover:bg-[#A66037] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                    >
                      Enregistrer la décision
                    </button>
                 </div>
              </div>
           </form>
        </div>
      )}

      {/* MODAL: BULK PROCESS REWARDS (NEW FEATURE) */}
      {bulkActionOpen && bulkSelectRewards.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
           <form onSubmit={handleBulkProcessRewards} className="bg-[#FAF3E0] w-full max-w-lg rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col">
              <div className="bg-[#5C3D2E] p-6 text-[#FAF3E0] flex justify-between items-center relative shrink-0">
                 <div>
                    <h3 className="text-xl font-bold font-dogon">Décision groupée</h3>
                    <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest mt-1">Application à {bulkSelectRewards.length} récompenses sélectionnées</p>
                 </div>
                 <button type="button" onClick={() => setBulkActionOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-8 space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Statut Commun Récompenses *</label>
                    <select
                      value={bulkRewardForm.status}
                      onChange={e => setBulkRewardForm({ ...bulkRewardForm, status: e.target.value as any })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-bold outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    >
                      <option value="approuvee">approuvee — Formation offerte approuvée</option>
                      <option value="refusee">refusee — Refusé (Fraude, non-conformité)</option>
                    </select>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Formation offerte choisie</label>
                    <input
                      type="text"
                      value={bulkRewardForm.trainingId}
                      onChange={e => setBulkRewardForm({ ...bulkRewardForm, trainingId: e.target.value })}
                      placeholder="Ex: Pelle hydraulique..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Centre / Agence</label>
                    <input
                      type="text"
                      value={bulkRewardForm.centerId}
                      onChange={e => setBulkRewardForm({ ...bulkRewardForm, centerId: e.target.value })}
                      placeholder="Ex: Abidjan"
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Notes communes & Justification</label>
                    <textarea
                      value={bulkRewardForm.notes}
                      onChange={e => setBulkRewardForm({ ...bulkRewardForm, notes: e.target.value })}
                      placeholder="Indiquez ici tout motif ou note commune..."
                      rows={3}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none"
                    />
                 </div>

                 <div className="border-t border-[#E8DCC4]/30 pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setBulkActionOpen(false)}
                      className="flex-1 py-3 bg-white hover:bg-[#FAF3E0] border border-[#E8DCC4] rounded-xl text-xs font-bold text-[#5C3D2E] transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 bg-[#5C3D2E] text-white hover:bg-[#A66037] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                    >
                      Appliquer la décision
                    </button>
                 </div>
              </div>
           </form>
        </div>
      )}

      {/* MODAL: WHITELIST FRAUD CANDIDATE (NEW FEATURE) */}
      {whitelistModalOpen && selectedFraudItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
           <form onSubmit={handleWhitelistFraud} className="bg-[#FAF3E0] w-full max-w-md rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col">
              <div className="bg-[#5C3D2E] p-6 text-[#FAF3E0] flex justify-between items-center relative shrink-0">
                 <div>
                    <h3 className="text-xl font-bold font-dogon">Autoriser le parrainage</h3>
                    <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest mt-1">Classification Liste Blanche (Whiteliste)</p>
                 </div>
                 <button type="button" onClick={() => { setWhitelistModalOpen(false); setSelectedFraudItem(null); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-8 space-y-4">
                 <div className="bg-white p-4 rounded-xl border border-[#E8DCC4] text-xs space-y-1">
                    <p><strong>Filleul</strong> : {selectedFraudItem.studentName}</p>
                    <p><strong>Téléphone</strong> : {selectedFraudItem.studentPhone}</p>
                    <p><strong>Code utilisé</strong> : {selectedFraudItem.referralCodeId}</p>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Motif de la dérogation *</label>
                    <textarea
                      required
                      value={whitelistReason}
                      onChange={e => setWhitelistReason(e.target.value)}
                      placeholder="Expliquez pourquoi ce dossier est valide malgré l'alerte frauduleuse (ex: Filleul s'est inscrit en deux sessions différentes légitimement, etc.)..."
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none"
                    />
                 </div>

                 <div className="border-t border-[#E8DCC4]/30 pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => { setWhitelistModalOpen(false); setSelectedFraudItem(null); }}
                      className="flex-1 py-3 bg-white hover:bg-[#FAF3E0] border border-[#E8DCC4] rounded-xl text-xs font-bold text-[#5C3D2E] transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 bg-[#5C3D2E] text-white hover:bg-[#A66037] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                    >
                      Valider et déroger
                    </button>
                 </div>
              </div>
           </form>
        </div>
      )}

      {/* MODAL: CLIENT PROGRESS CHECKER (NEW FEATURE) */}
      {checkerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
           <div className="bg-[#FAF3E0] w-full max-w-md rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col">
              <div className="bg-[#5C3D2E] p-6 text-[#FAF3E0] flex justify-between items-center relative shrink-0">
                 <div>
                    <h3 className="text-xl font-bold font-dogon">Vérificateur Client</h3>
                    <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest mt-1">Vérification de code ou téléphone</p>
                 </div>
                 <button type="button" onClick={() => { setCheckerOpen(false); setCheckerInput(""); setCheckerResult(null); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-8 space-y-4">
                 <div className="flex gap-2">
                   <input
                     type="text"
                     placeholder="Entrez un code parrain ou téléphone..."
                     value={checkerInput}
                     onChange={e => setCheckerInput(e.target.value)}
                     className="flex-1 px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                   />
                   <button 
                     onClick={handleCheckClient}
                     className="px-4 py-2.5 bg-[#5C3D2E] text-white rounded-xl text-xs font-bold hover:bg-[#A66037] transition-all cursor-pointer"
                   >
                     Vérifier
                   </button>
                 </div>

                 {/* Results presentation */}
                 {checkerResult && checkerResult !== "not_found" && (
                   <div className="p-5 bg-white border border-[#E8DCC4] rounded-2xl space-y-3 text-xs">
                     <div className="flex items-center justify-between border-b border-[#FAF3E0] pb-2">
                       <h4 className="font-bold text-sm text-[#5C3D2E]">{checkerResult.prenom} {checkerResult.nom}</h4>
                       <span className="font-mono text-[#A66037] font-black text-xs">{checkerResult.codeId}</span>
                     </div>
                     <div className="space-y-1">
                       <p><strong>Filleuls Validés</strong> : {checkerResult.stats?.validatedCount || 0} / 5</p>
                       <p><strong>Dossiers en attente</strong> : {checkerResult.stats?.pendingCount || 0}</p>
                       <p><strong>Statut du code</strong> : <span className="text-emerald-600 font-bold uppercase">{checkerResult.status}</span></p>
                     </div>
                     <div className="pt-2">
                       <div className="w-full h-2 bg-[#FAF3E0] rounded-full overflow-hidden border border-[#E8DCC4]">
                         <div 
                           className="h-full bg-[#D4AF37]" 
                           style={{ width: `${Math.min(((checkerResult.stats?.validatedCount || 0) / 5) * 100, 100)}%` }} 
                         />
                       </div>
                       <p className="text-[10px] text-gray-500 text-right mt-1">
                         {checkerResult.stats?.validatedCount >= 5 
                           ? "🎉 Éligible à une formation offerte !" 
                           : `${5 - (checkerResult.stats?.validatedCount || 0)} filleul(s) restant(s) pour la récompense.`}
                       </p>
                     </div>
                   </div>
                 )}

                 {checkerResult === "not_found" && (
                   <p className="text-xs text-red-600 font-bold italic text-center py-4 bg-red-50 rounded-xl border border-red-100">
                     Aucun parrain ou code trouvé pour cette saisie.
                   </p>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* MODAL: ANTI-FRAUD SETTINGS (NEW FEATURE) */}
      {configOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
           <div className="bg-[#FAF3E0] w-full max-w-md rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col">
              <div className="bg-[#5C3D2E] p-6 text-[#FAF3E0] flex justify-between items-center relative shrink-0">
                 <div>
                    <h3 className="text-xl font-bold font-dogon">Paramètres d&apos;Alertes</h3>
                    <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest mt-1">Configuration des seuils de sécurité</p>
                 </div>
                 <button type="button" onClick={() => setConfigOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-8 space-y-4 text-xs">
                 <div className="flex items-center justify-between">
                   <label className="font-bold text-[#5C3D2E] uppercase">Activer la détection automatique</label>
                   <input 
                     type="checkbox"
                     checked={autoSuspendRules.enabled}
                     onChange={e => setAutoSuspendRules({ ...autoSuspendRules, enabled: e.target.checked })}
                     className="rounded border-[#E8DCC4] text-[#5C3D2E] w-5 h-5"
                   />
                 </div>
                 
                 <div className="space-y-1.5">
                   <label className="font-bold text-[#A66037] uppercase tracking-wider block">Doublons max par filleul</label>
                   <input 
                     type="number"
                     value={autoSuspendRules.maxDuplicates}
                     onChange={e => setAutoSuspendRules({ ...autoSuspendRules, maxDuplicates: Number(e.target.value) })}
                     className="w-full px-3 py-2 bg-white border border-[#E8DCC4] rounded-xl font-bold"
                   />
                   <p className="text-[9px] text-gray-400">Nombre maximal autorisé avant suspension automatique.</p>
                 </div>

                 <div className="space-y-1.5">
                   <label className="font-bold text-[#A66037] uppercase tracking-wider block">Saisies max par heure et par parrain</label>
                   <input 
                     type="number"
                     value={autoSuspendRules.maxRegistrationsPerHour}
                     onChange={e => setAutoSuspendRules({ ...autoSuspendRules, maxRegistrationsPerHour: Number(e.target.value) })}
                     className="w-full px-3 py-2 bg-white border border-[#E8DCC4] rounded-xl font-bold"
                   />
                   <p className="text-[9px] text-gray-400">Seuil de vitesse pour la détection des activités anormales.</p>
                 </div>

                 <button 
                   onClick={() => {
                     setConfigOpen(false);
                     toast.success("Paramètres enregistrés avec succès !");
                   }}
                   className="w-full py-3 bg-[#5C3D2E] text-white hover:bg-[#A66037] rounded-xl font-bold uppercase tracking-wider shadow-md text-xs cursor-pointer mt-4"
                 >
                   Enregistrer
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* MODAL: CREATE CAMPAIGN */}
      {newCampaignOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
           <form onSubmit={handleCreateCampaign} className="bg-[#FAF3E0] w-full max-w-md rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col">
              <div className="bg-[#5C3D2E] p-6 text-[#FAF3E0] flex justify-between items-center relative shrink-0">
                 <div>
                    <h3 className="text-xl font-bold font-dogon">Créer une Campagne</h3>
                    <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest mt-1">Définition de la période active</p>
                 </div>
                 <button type="button" onClick={() => setNewCampaignOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-8 space-y-4">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Identifiant unique (slug) *</label>
                    <input
                      required
                      placeholder="Ex: campagne_ete_2026"
                      value={campaignForm.id}
                      onChange={e => setCampaignForm({ ...campaignForm, id: e.target.value.toLowerCase().replace(/\s+/g, "_") })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Nom de la Campagne *</label>
                    <input
                      required
                      placeholder="Ex: Parrainage GALF Été 2026"
                      value={campaignForm.name}
                      onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                    />
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Description</label>
                    <input
                      placeholder="Ex: Campagne de parrainage pour l'obtention d'une formation offerte..."
                      value={campaignForm.description}
                      onChange={e => setCampaignForm({ ...campaignForm, description: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Date Début</label>
                       <input
                         type="date"
                         value={campaignForm.startDate}
                         onChange={e => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                         className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Date Fin</label>
                       <input
                         type="date"
                         value={campaignForm.endDate}
                         onChange={e => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                         className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                       />
                    </div>
                 </div>

                 <div className="border-t border-[#E8DCC4]/30 pt-4 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setNewCampaignOpen(false)}
                      className="flex-1 py-3 bg-white hover:bg-[#FAF3E0] border border-[#E8DCC4] rounded-xl text-xs font-bold text-[#5C3D2E] transition-colors cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button 
                      type="submit" 
                      className="flex-1 py-3 bg-[#5C3D2E] text-white hover:bg-[#A66037] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                    >
                      Créer la Campagne
                    </button>
                 </div>
              </div>
           </form>
        </div>
      )}

      {/* MODAL: CREATE PARRAIN / MEMBER */}
      {newMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm">
           <form onSubmit={handleCreateMember} className="bg-[#FAF3E0] w-full max-w-md rounded-[40px] shadow-2xl border border-white/20 overflow-hidden flex flex-col">
              <div className="bg-[#5C3D2E] p-6 text-[#FAF3E0] flex justify-between items-center relative shrink-0">
                 <div>
                    <h3 className="text-xl font-bold font-dogon">Enregistrer un Parrain</h3>
                    <p className="text-[10px] text-[#D4AF37] uppercase font-bold tracking-widest mt-1">Création du compte et code d&apos;affiliation</p>
                 </div>
                 <button type="button" onClick={() => setNewMemberOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="p-8 space-y-4 max-h-[75vh] overflow-y-auto custom-scrollbar">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Nom *</label>
                       <input
                         required
                         placeholder="Ex: Diallo"
                         value={memberForm.nom}
                         onChange={e => setMemberForm({ ...memberForm, nom: e.target.value })}
                         className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Prénom *</label>
                       <input
                         required
                         placeholder="Ex: Mamadou"
                         value={memberForm.prenom}
                         onChange={e => setMemberForm({ ...memberForm, prenom: e.target.value })}
                         className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                       />
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Téléphone Mobile (Normalisé) *</label>
                    <input
                      required
                      placeholder="Ex: +2250707070707"
                      value={memberForm.telephoneNormalise}
                      onChange={e => setMemberForm({ ...memberForm, telephoneNormalise: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                    />
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Email</label>
                    <input
                      type="email"
                      placeholder="Ex: mamadou@example.com"
                      value={memberForm.email}
                      onChange={e => setMemberForm({ ...memberForm, email: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Code Parrain Souhaité *</label>
                     <input
                       required
                       placeholder="Ex: MAMADOU26"
                       value={memberForm.codeId}
                       onChange={e => setMemberForm({ ...memberForm, codeId: e.target.value.toUpperCase().replace(/\s+/g, "") })}
                       className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-black outline-none text-[#5C3D2E]"
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Formation souhaitée en cadeau</label>
                     <input
                       placeholder="Ex: Chariot élévateur, HSE..."
                       value={memberForm.formationSouhaitee}
                       onChange={e => setMemberForm({ ...memberForm, formationSouhaitee: e.target.value })}
                       className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-semibold outline-none"
                     />
                  </div>

                  <div className="space-y-1.5">
                     <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest pl-1">Campagne active *</label>
                     <select
                       value={memberForm.campagneId}
                       onChange={e => setMemberForm({ ...memberForm, campagneId: e.target.value })}
                       className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E8DCC4] text-xs font-bold outline-none"
                     >
                       <option value="">Sélectionner</option>
                       {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                     </select>
                  </div>

                  <div className="border-t border-[#E8DCC4]/30 pt-4 flex gap-3">
                     <button 
                       type="button" 
                       onClick={() => setNewMemberOpen(false)}
                       className="flex-1 py-3 bg-white hover:bg-[#FAF3E0] border border-[#E8DCC4] rounded-xl text-xs font-bold text-[#5C3D2E] transition-colors cursor-pointer"
                     >
                       Annuler
                     </button>
                     <button 
                       type="submit" 
                       className="flex-1 py-3 bg-[#5C3D2E] text-white hover:bg-[#A66037] rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-md"
                     >
                       Créer le Parrain
                     </button>
                  </div>
               </div>
            </form>
         </div>
      )}

    </div>
  );
}
