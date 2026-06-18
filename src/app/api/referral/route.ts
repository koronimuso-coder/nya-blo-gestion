import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { verifyReferralCode, createReferralAttribution, normalizePhone } from "@/lib/referral-server";
import * as admin from "firebase-admin";

// Simple in-memory rate-limiter for basic protection
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 60; // 60 requests
const WINDOW = 60000; // per 1 minute

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userRate = rateLimitMap.get(ip) || { count: 0, lastReset: now };

  if (now - userRate.lastReset > WINDOW) {
    userRate.count = 1;
    userRate.lastReset = now;
  } else {
    userRate.count++;
  }
  rateLimitMap.set(ip, userRate);
  return userRate.count > LIMIT;
}

/**
 * GET: Vérification d'un code parrain à distance
 * En-tête requis : Authorization: Bearer <GALF_API_KEY> ou x-api-key: <GALF_API_KEY>
 */
export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous-ip";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Trop de requêtes. Veuillez réessayer plus tard." }, { status: 429 });
  }

  // 1. Authentification
  const authHeader = req.headers.get("Authorization") || req.headers.get("x-api-key");
  const apiKey = process.env.GALF_API_KEY || "nya-blo-galf-secure-token-2026";
  const providedKey = authHeader?.replace("Bearer ", "").trim();

  if (!providedKey || providedKey !== apiKey) {
    return NextResponse.json({ error: "Non autorisé. Clé API invalide ou absente." }, { status: 401 });
  }

  // 2. Paramètres
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code")?.trim().toUpperCase();
  const studentPhone = searchParams.get("studentPhone")?.trim() || "";

  if (!code) {
    return NextResponse.json({ error: "Le paramètre 'code' est requis." }, { status: 400 });
  }

  try {
    const res = await verifyReferralCode(code, studentPhone);

    if (res.status !== "valid") {
      return NextResponse.json({
        status: res.status,
        message: res.message
      }, { status: 200 });
    }

    return NextResponse.json({
      status: "valid",
      message: res.message,
      member: {
        nom: res.member.nom,
        prenom: res.member.prenom,
        campagneId: res.member.campagneId
      }
    }, { status: 200 });

  } catch (error: any) {
    console.error("Referral API Error:", error.message);
    return NextResponse.json({ error: "Erreur serveur lors de la vérification." }, { status: 500 });
  }
}

/**
 * POST: Création d'une inscription parrainée à distance (Lead de pré-inscription)
 */
export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous-ip";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Trop de requêtes. Veuillez réessayer plus tard." }, { status: 429 });
  }

  // 1. Authentification
  const authHeader = req.headers.get("Authorization") || req.headers.get("x-api-key");
  const apiKey = process.env.GALF_API_KEY || "nya-blo-galf-secure-token-2026";
  const providedKey = authHeader?.replace("Bearer ", "").trim();

  if (!providedKey || providedKey !== apiKey) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { 
      studentName, 
      studentPhone, 
      referralCode, 
      engin, 
      companyId,
      totalAmount, 
      paidAmount, 
      modePaiement,
      note 
    } = body;

    if (!studentName || !studentPhone || !referralCode) {
      return NextResponse.json({ error: "Champs obligatoires manquants: studentName, studentPhone, referralCode." }, { status: 400 });
    }

    const codeUpper = referralCode.trim().toUpperCase();

    // 2. Vérifier la validité du code
    const verifyRes = await verifyReferralCode(codeUpper, studentPhone);
    if (verifyRes.status !== "valid" && verifyRes.status !== "duplicate") {
      return NextResponse.json({ error: verifyRes.message || "Code parrain invalide ou inactif." }, { status: 400 });
    }

    const codeData = verifyRes.codeDoc;
    if (!codeData) {
      return NextResponse.json({ error: "Code parrain invalide." }, { status: 400 });
    }

    if (!adminDb) {
      throw new Error("Admin DB non initialisée.");
    }

    // 3. Créer la saisie Point Journalier (daily_entries)
    const entryRef = adminDb.collection("daily_entries").doc();
    const entryData = {
      date: new Date().toISOString().split("T")[0],
      companyId: companyId || "GALF SARL",
      session: "Matin",
      localisation: "En ligne (Site GALF)",
      status: "prospect enregistré",
      clientName: studentName,
      clientContact: studentPhone,
      engin: engin || "Carte Opérateur",
      motif: "Pré-inscription parrainage",
      totalAmount: Number(totalAmount) || 15000,
      paidAmount: Number(paidAmount) || 0,
      resteAVerser: (Number(totalAmount) || 15000) - (Number(paidAmount) || 0),
      canal: "Referral",
      modePaiement: modePaiement || "Wave",
      createdAt: new Date().toISOString(),
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: "api_galf",
      createdByEmail: "api@galf.ci",
      createdByName: "Site Web GALF"
    };
    await entryRef.set(entryData);

    // 4. Créer l'attribution de parrainage
    const attributionId = await createReferralAttribution({
      entryId: entryRef.id,
      studentName,
      studentPhone,
      referralMemberId: codeData.memberId,
      referralCodeId: codeUpper,
      campaignId: codeData.campaignId,
      attributionMethod: "link",
      recordedBy: "api_galf",
      recordedByName: "Site Web GALF",
      status: "prospect enregistré",
      note: note || "Créé automatiquement par le portail GALF"
    });

    // Journal global
    await adminDb.collection("audit_logs").add({
      userId: "api_galf",
      userEmail: "api@galf.ci",
      action: "referral_api_create",
      details: `Pré-inscription parrainage de ${studentName} via code ${codeUpper} enregistrée.`,
      companyId: companyId || "GALF SARL",
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: "Pré-inscription enregistrée avec succès.",
      entryId: entryRef.id,
      attributionId: attributionId
    }, { status: 201 });

  } catch (error: any) {
    console.error("API POST Error:", error.message);
    return NextResponse.json({ error: "Erreur lors de l'enregistrement de l'inscription." }, { status: 500 });
  }
}
