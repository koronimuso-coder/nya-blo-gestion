import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { normalizePhone } from "@/lib/referral-server";

// Simple in-memory rate-limiter for basic public protection
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const LIMIT = 30; // 30 requests
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

function maskName(fullName: string): string {
  if (!fullName) return "";
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 3) + "...";
  }
  // Keep first name, mask the rest or keep first letter of subsequent parts
  const firstName = parts[0];
  const maskedRest = parts.slice(1).map(p => p.charAt(0).toUpperCase() + ".").join(" ");
  return `${firstName} ${maskedRest}`;
}

export async function GET(req: Request) {
  const ip = req.headers.get("x-forwarded-for") || "anonymous-ip";
  if (isRateLimited(ip)) {
    return NextResponse.json({ error: "Trop de requêtes. Veuillez réessayer plus tard." }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const queryVal = searchParams.get("q")?.trim();

  if (!queryVal) {
    return NextResponse.json({ error: "Veuillez spécifier un code parrain ou un numéro de téléphone." }, { status: 400 });
  }

  if (!adminDb) {
    return NextResponse.json({ error: "Service de base de données temporairement indisponible." }, { status: 500 });
  }

  try {
    let memberDoc: any = null;
    let codeUpper = queryVal.toUpperCase();
    
    // 1. Search by Code in referral_codes
    const codeSnap = await adminDb.collection("referral_codes").doc(codeUpper).get();
    
    if (codeSnap.exists) {
      const codeData = codeSnap.data();
      if (codeData && codeData.memberId) {
        const memberSnap = await adminDb.collection("referral_members").doc(codeData.memberId).get();
        if (memberSnap.exists) {
          memberDoc = { id: memberSnap.id, ...memberSnap.data() };
        }
      }
    }

    // 2. Search by Phone in referral_members if not found by code
    const digitsOnly = normalizePhone(queryVal);
    if (!memberDoc && digitsOnly) {
      // Try with '+' prefix
      let memberQuery = await adminDb.collection("referral_members")
        .where("telephoneNormalise", "==", `+${digitsOnly}`)
        .limit(1)
        .get();

      if (memberQuery.empty) {
        // Try without '+' prefix
        memberQuery = await adminDb.collection("referral_members")
          .where("telephoneNormalise", "==", digitsOnly)
          .limit(1)
          .get();
      }

      if (!memberQuery.empty) {
        const docSnap = memberQuery.docs[0];
        memberDoc = { id: docSnap.id, ...docSnap.data() };
      }
    }

    if (!memberDoc) {
      return NextResponse.json({ error: "Aucun compte parrain trouvé avec ces informations." }, { status: 404 });
    }

    if (memberDoc.status === "suspended") {
      return NextResponse.json({ error: "Ce compte parrain est actuellement suspendu. Veuillez contacter le support." }, { status: 403 });
    }

    // Mask sensitive details for public checker
    const publicMember = {
      id: memberDoc.id,
      nom: memberDoc.nom ? memberDoc.nom.substring(0, 1).toUpperCase() + "." : "",
      prenom: memberDoc.prenom,
      codeId: memberDoc.codeId,
      formationSouhaitee: memberDoc.formationSouhaitee,
      status: memberDoc.status,
      stats: memberDoc.stats || {
        totalReferred: 0,
        pendingCount: 0,
        validatedCount: 0,
        rewardCount: 0
      }
    };

    // Get attributions
    const attributionsSnap = await adminDb.collection("referral_attributions")
      .where("referralMemberId", "==", memberDoc.id)
      .get();

    const attributionsList = attributionsSnap.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        studentName: maskName(data.studentName || "Filleul"),
        status: data.status,
        createdAt: data.createdAt
      };
    });

    return NextResponse.json({
      success: true,
      member: publicMember,
      attributions: attributionsList
    });

  } catch (error: any) {
    console.error("Public checker API error:", error);
    return NextResponse.json({ error: "Une erreur interne est survenue." }, { status: 500 });
  }
}
