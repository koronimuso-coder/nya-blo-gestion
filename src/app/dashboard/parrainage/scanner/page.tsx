"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  X, 
  Camera, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  ArrowLeft,
  Search,
  Sparkles,
  Link,
  ShieldCheck,
  Loader2
} from "lucide-react";
import { useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import toast, { Toaster } from "react-hot-toast";

interface ParrainInfo {
  id: string;
  nom: string;
  prenom: string;
  telephoneNormalise: string;
  codeId: string;
  stats: {
    validatedCount: number;
  };
}

export default function QRScannerPage() {
  const router = useRouter();
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [parrain, setParrain] = useState<ParrainInfo | null>(null);

  // List of mock parrains to simulate scans quickly
  const [availableCodes, setAvailableCodes] = useState<string[]>([]);

  useEffect(() => {
    // Fetch some code identifiers to populate the dropdown simulator
    const fetchCodes = async () => {
      try {
        const snap = await getDocs(collection(db, "referral_codes"));
        setAvailableCodes(snap.docs.map(d => d.id));
      } catch (e) {
        setAvailableCodes(["MAMADOU26", "KADI26", "ADAMA26"]);
      }
    };
    fetchCodes();
  }, []);

  const handleSimulateScan = async (code: string) => {
    if (!code) return;
    setLoading(true);
    setScanResult(code);
    setIsScanning(false);
    setParrain(null);

    try {
      const codeRef = doc(db, "referral_codes", code);
      const codeSnap = await getDoc(codeRef);

      if (codeSnap.exists()) {
        const codeData = codeSnap.data();
        const memberRef = doc(db, "referral_members", codeData.memberId);
        const memberSnap = await getDoc(memberRef);

        if (memberSnap.exists()) {
          const mData = memberSnap.data();
          setParrain({
            id: memberSnap.id,
            nom: mData.nom,
            prenom: mData.prenom,
            telephoneNormalise: mData.telephoneNormalise,
            codeId: code,
            stats: {
              validatedCount: mData.stats?.validatedCount || 0
            }
          });
          toast.success(`Code ${code} détecté avec succès !`);
        } else {
          toast.error("Parrain introuvable pour ce code.");
        }
      } else {
        toast.error("Ce code parrain n'existe pas en base.");
      }
    } catch (e) {
      toast.error("Erreur de connexion.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setScanResult(null);
    setParrain(null);
    setIsScanning(true);
  };

  return (
    <div className="min-h-screen bg-[#FAF3E0] text-[#2D1A12] flex flex-col justify-between pb-8">
      <Toaster position="top-center" />

      {/* Header */}
      <header className="bg-[#5C3D2E] p-6 text-[#FAF3E0] flex items-center justify-between shadow-md">
        <button 
          onClick={() => router.push("/dashboard/parrainage")}
          className="flex items-center gap-2 text-xs font-bold bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Retour
        </button>
        <h2 className="text-sm font-bold tracking-widest font-dogon uppercase text-center">Scanner QR Parrainage</h2>
        <div className="w-12" /> {/* alignment spacer */}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-center gap-6">
        
        {isScanning ? (
          <div className="bg-white p-8 rounded-[40px] border border-[#E8DCC4] shadow-xl space-y-6 relative overflow-hidden flex flex-col items-center">
            <h3 className="font-bold text-center text-sm uppercase tracking-wider text-[#5C3D2E]">Scannez le Badge</h3>
            
            {/* Visual Camera Scanner Frame */}
            <div className="w-64 h-64 border-4 border-dashed border-[#A66037] rounded-3xl relative flex items-center justify-center bg-stone-100 overflow-hidden shadow-inner">
              <Camera className="w-16 h-16 text-[#FAF3E0] animate-pulse" />
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-red-500 animate-scanLine" />
              <div className="absolute inset-0 bg-[#5C3D2E]/5 backdrop-blur-[1px] flex flex-col items-center justify-center p-4">
                <span className="text-[10px] font-black text-white/50 text-center uppercase tracking-widest mt-24">Viseur Appareil</span>
              </div>
            </div>

            {/* Dropdown Simulator */}
            <div className="w-full space-y-2">
              <label className="text-[10px] font-bold text-[#A66037] uppercase tracking-widest text-center block">Simuler un QR Code</label>
              <select
                onChange={e => handleSimulateScan(e.target.value)}
                className="w-full px-4 py-3 bg-[#FAF3E0]/30 border border-[#E8DCC4] rounded-xl text-xs font-bold outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>Sélectionner un code de test...</option>
                {availableCodes.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>
            
            <p className="text-[10px] text-gray-400 text-center italic">Le scanner utilise le flux caméra HTML5 pour décoder le lien unique GALF.</p>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[40px] border border-[#E8DCC4] shadow-xl space-y-6 animate-fadeIn">
            <div className="text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto" />
              <h3 className="font-black text-sm uppercase tracking-widest text-emerald-600 mt-2">Code Détecté</h3>
              <p className="font-mono text-2xl font-black text-[#5C3D2E] tracking-widest mt-1">{scanResult}</p>
            </div>

            {loading && (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-8 h-8 text-[#A66037] animate-spin" />
              </div>
            )}

            {parrain && (
              <div className="p-5 bg-[#FAF3E0]/30 border border-[#E8DCC4] rounded-2xl space-y-3 text-xs animate-slideUp">
                <div className="flex justify-between items-center border-b border-[#E8DCC4]/30 pb-2">
                  <span className="font-bold text-sm text-[#5C3D2E]">{parrain.prenom} {parrain.nom}</span>
                  <span className="font-black text-emerald-600 uppercase">Compte Actif</span>
                </div>
                <div className="space-y-1 text-gray-600">
                  <p><strong>Téléphone</strong> : {parrain.telephoneNormalise}</p>
                  <p><strong>Progression</strong> : {parrain.stats.validatedCount} / 5 filleuls validés</p>
                </div>
                <div className="w-full h-2 bg-[#FAF3E0] rounded-full overflow-hidden border border-[#E8DCC4]/50">
                  <div 
                    className="h-full bg-[#D4AF37]" 
                    style={{ width: `${Math.min((parrain.stats.validatedCount / 5) * 100, 100)}%` }} 
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button 
                onClick={handleReset}
                className="flex-1 py-3.5 bg-[#FAF3E0] text-[#5C3D2E] border border-[#E8DCC4] rounded-xl text-xs font-bold hover:bg-[#E8DCC4]/30 transition-all cursor-pointer text-center"
              >
                Recommencer
              </button>
              <button 
                onClick={() => {
                  // Push code to the router search params and redirect to entries
                  router.push(`/dashboard/entries?searchCode=${scanResult}`);
                }}
                className="flex-1 py-3.5 bg-[#5C3D2E] hover:bg-[#A66037] text-white rounded-xl text-xs font-bold transition-all cursor-pointer text-center shadow-md flex items-center justify-center gap-1.5"
              >
                <Link className="w-4 h-4" /> Lier à un élève
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] text-gray-400 font-medium">
        © {new Date().getFullYear()} GALF Formation • Portail Ambassadeur
      </footer>
    </div>
  );
}
