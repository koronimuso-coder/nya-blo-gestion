import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { normalizePhone } from "@/lib/referral-server";

// Simple in-memory rate-limiter for basic public protection
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 15; // 15 requests
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

// Helper to generate a unique random referral code
async function generateUniqueCode(prenom: string): Promise<string> {
  if (!adminDb) throw new Error("Database not initialized");
  
  const prefix = prenom.trim().replace(/[^a-zA-Z]/g, "").toUpperCase().substring(0, 6);
  let isUnique = false;
  let code = "";
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    const randomDigits = Math.floor(100 + Math.random() * 900); // 3 digits
    code = `${prefix}${randomDigits}`;
    
    // Check if code exists
    const codeSnap = await adminDb.collection("referral_codes").doc(code).get();
    if (!codeSnap.exists) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    // Fallback code
    code = `AMB${Math.floor(100000 + Math.random() * 900000)}`;
  }
  return code;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous-ip";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Trop de requêtes. Veuillez réessayer plus tard." }, { status: 429 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Service de base de données temporairement indisponible." }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { nom, prenom, email, telephone, formationSouhaitee, campagneId } = body;

    if (!nom || !prenom || !telephone || !formationSouhaitee) {
      return NextResponse.json({ error: "Champs obligatoires manquants (nom, prénom, téléphone, formation souhaitée)." }, { status: 400 });
    }

    const normalizedTel = normalizePhone(telephone);
    if (normalizedTel.length < 8) {
      return NextResponse.json({ error: "Numéro de téléphone invalide." }, { status: 400 });
    }

    // 1. Check if the telephone is already registered as a parrain
    const existingMemberQuery = await adminDb.collection("referral_members")
      .where("telephoneNormalise", "in", [`+${normalizedTel}`, normalizedTel])
      .limit(1)
      .get();

    if (!existingMemberQuery.empty) {
      const existingData = existingMemberQuery.docs[0].data();
      return NextResponse.json({ 
        error: `Ce numéro de téléphone est déjà associé au code parrain: ${existingData.codeId}.` 
      }, { status: 409 });
    }

    // 2. Determine target campaign
    let targetCampaignId = campagneId || "";
    if (!targetCampaignId) {
      const activeCampaigns = await adminDb.collection("referral_campaigns")
        .where("status", "==", "active")
        .limit(1)
        .get();
      if (!activeCampaigns.empty) {
        targetCampaignId = activeCampaigns.docs[0].id;
      } else {
        // Fallback or create default
        targetCampaignId = "campagne_generale";
      }
    }

    // 3. Generate unique referral code
    const generatedCode = await generateUniqueCode(prenom);
    const memberId = `member_${Date.now()}`;

    // 4. Create Parrain document
    const memberData = {
      id: memberId,
      nom: nom.trim().toUpperCase(),
      prenom: prenom.trim(),
      email: email?.trim() || "",
      telephoneNormalise: `+${normalizedTel}`,
      formationSouhaitee: formationSouhaitee,
      campagneId: targetCampaignId,
      codeId: generatedCode,
      status: "active",
      createdAt: new Date().toISOString(),
      recordedBy: "public_self_registration",
      stats: {
        totalReferred: 0,
        pendingCount: 0,
        validatedCount: 0,
        rewardCount: 0
      }
    };

    // 5. Create Code document
    const codeData = {
      code: generatedCode,
      memberId: memberId,
      campaignId: targetCampaignId,
      status: "active",
      createdAt: new Date().toISOString(),
      expiresAt: null
    };

    // Set docs in transaction or parallel
    await adminDb.collection("referral_members").doc(memberId).set(memberData);
    await adminDb.collection("referral_codes").doc(generatedCode).set(codeData);

    // 6. Log audit event
    await adminDb.collection("referral_audit_logs").add({
      userId: "public",
      userEmail: email || "auto-registration",
      action: "referral_self_register",
      details: `Auto-inscription réussie du parrain ${prenom} ${nom.toUpperCase()} avec le code ${generatedCode}`,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      code: generatedCode,
      member: {
        nom: memberData.nom,
        prenom: memberData.prenom,
        codeId: generatedCode,
        telephoneNormalise: memberData.telephoneNormalise,
        formationSouhaitee: memberData.formationSouhaitee
      }
    }, { status: 201 });

  } catch (error: any) {
    console.error("Public registration error:", error);
    return NextResponse.json({ error: "Une erreur interne est survenue." }, { status: 500 });
  }
}
