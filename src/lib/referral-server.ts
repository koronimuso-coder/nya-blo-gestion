import { adminDb } from "./firebase/admin";
import * as admin from "firebase-admin";

export interface ReferralVerificationResult {
  status: "valid" | "not_found" | "suspended" | "campaign_ended" | "self_referral" | "duplicate";
  message: string;
  member?: any;
  codeDoc?: any;
  campaign?: any;
}

/**
 * Normalise un numéro de téléphone pour comparaison (ne garde que les chiffres)
 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

/**
 * Vérifie si un code parrain est valide et renvoie les détails du parrain.
 * Version serveur / Admin SDK
 */
export async function verifyReferralCode(
  codeStr: string, 
  studentContact: string
): Promise<ReferralVerificationResult> {
  const normalizedCode = codeStr.trim().toUpperCase();
  const normalizedStudentPhone = normalizePhone(studentContact);

  if (!normalizedCode) {
    return { status: "not_found", message: "Le code est vide." };
  }

  if (!adminDb) {
    return {
      status: "not_found",
      message: "Base de données d'administration non disponible."
    };
  }

  try {
    // 1. Chercher le code dans Firestore
    const codeRef = adminDb.collection("referral_codes").doc(normalizedCode);
    const codeSnap = await codeRef.get();

    if (!codeSnap.exists) {
      return {
        status: "not_found",
        message: "Ce code parrain n’existe pas. Vérifiez l’orthographe ou recherchez le parrain."
      };
    }

    const codeData = codeSnap.data();
    if (!codeData) {
      return {
        status: "not_found",
        message: "Les données du code parrain sont corrompues."
      };
    }

    // 2. Vérifier si le code est actif
    if (codeData.status !== "active") {
      return {
        status: "suspended",
        message: "Ce code parrain est actuellement suspendu. Contactez un administrateur."
      };
    }

    // 3. Récupérer le membre (parrain)
    const memberRef = adminDb.collection("referral_members").doc(codeData.memberId);
    const memberSnap = await memberRef.get();

    if (!memberSnap.exists) {
      return {
        status: "not_found",
        message: "Le parrain associé à ce code est introuvable."
      };
    }

    const memberData = memberSnap.data();
    if (!memberData) {
      return {
        status: "not_found",
        message: "Les données du parrain sont corrompues."
      };
    }

    // 4. Vérifier si le parrain est suspendu
    if (memberData.status === "suspended") {
      return {
        status: "suspended",
        message: "Ce parrain est actuellement suspendu. Contactez un administrateur."
      };
    }

    // 5. Vérifier la campagne
    const campaignRef = adminDb.collection("referral_campaigns").doc(codeData.campaignId);
    const campaignSnap = await campaignRef.get();

    if (campaignSnap.exists) {
      const campaignData = campaignSnap.data();
      if (campaignData && campaignData.status !== "active") {
        return {
          status: "campaign_ended",
          message: "Ce code appartient à une campagne terminée. L’attribution nécessite une validation administrative."
        };
      }
    }

    // 6. Vérifier l'auto-parrainage (par téléphone normalisé)
    const normalizedMemberPhone = normalizePhone(memberData.telephoneNormalise || "");
    if (normalizedStudentPhone && normalizedStudentPhone === normalizedMemberPhone) {
      return {
        status: "self_referral",
        message: "Un apprenant ne peut pas s'auto-parrainer."
      };
    }

    // 7. Vérifier si ce numéro de téléphone a déjà été parrainé
    if (normalizedStudentPhone) {
      const attributionSnap = await adminDb.collection("referral_attributions")
        .where("studentPhoneNormalized", "==", normalizedStudentPhone)
        .get();
      if (!attributionSnap.empty) {
        return {
          status: "duplicate",
          message: "Cet apprenant semble déjà enregistré ou rattaché à un autre parrain. Vérification requise."
        };
      }
    }

    // Calculer la progression actuelle du parrain
    const progression = await calculateReferralProgress(memberData.id);

    return {
      status: "valid",
      message: `Code valide. Cette inscription peut être rattachée à ${memberData.prenom} ${memberData.nom}.`,
      member: {
        id: memberSnap.id,
        ...memberData,
        progression
      },
      codeDoc: {
        id: codeSnap.id,
        ...codeData
      }
    };

  } catch (error) {
    console.error("Error verifying referral code:", error);
    return {
      status: "not_found",
      message: "Erreur technique lors de la vérification du code."
    };
  }
}

/**
 * Calcule dynamiquement la progression validée d'un parrain (inscriptions au statut 'Confirmé' ou 'inscription validée').
 * Version serveur / Admin SDK
 */
export async function calculateReferralProgress(memberId: string): Promise<number> {
  if (!adminDb) return 0;
  try {
    const snap = await adminDb.collection("referral_attributions")
      .where("referralMemberId", "==", memberId)
      .where("status", "in", ["Confirmé", "inscription validée"])
      .get();
    return snap.size;
  } catch (error) {
    console.error("Error calculating referral progress:", error);
    return 0;
  }
}

/**
 * Enregistre le rattachement d'un filleul à son parrain
 * Version serveur / Admin SDK
 */
export async function createReferralAttribution(params: {
  entryId: string;
  studentName: string;
  studentPhone: string;
  referralMemberId: string;
  referralCodeId: string;
  campaignId: string;
  attributionMethod: "manual" | "qr_code" | "link" | "search" | "admin";
  recordedBy: string;
  recordedByName: string;
  status: string;
  note?: string;
}) {
  if (!adminDb) throw new Error("Admin DB is not initialized");

  const attributionData = {
    entryId: params.entryId,
    studentName: params.studentName,
    studentPhone: params.studentPhone,
    studentPhoneNormalized: normalizePhone(params.studentPhone),
    referralMemberId: params.referralMemberId,
    referralCodeId: params.referralCodeId,
    campaignId: params.campaignId,
    attributionMethod: params.attributionMethod,
    recordedBy: params.recordedBy,
    recordedByName: params.recordedByName,
    status: params.status,
    note: params.note || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const attributionRef = adminDb.collection("referral_attributions").doc();
  await attributionRef.set(attributionData);

  // Journal d'historique de statut initial
  await adminDb.collection("referral_status_history").add({
    attributionId: attributionRef.id,
    previousStatus: "",
    newStatus: params.status,
    changedBy: params.recordedBy,
    reason: "Attribution initiale de l'inscription",
    createdAt: new Date().toISOString()
  });

  // Mettre à jour les statistiques globales du parrain
  await updateReferralMemberStats(params.referralMemberId);

  return attributionRef.id;
}

/**
 * Recalcule et met à jour les stats stockées sur le parrain, et gère les récompenses si progression = 5/5
 * Version serveur / Admin SDK
 */
export async function updateReferralMemberStats(memberId: string) {
  if (!adminDb) return;
  try {
    // 1. Compter toutes les attributions
    const snapAll = await adminDb.collection("referral_attributions")
      .where("referralMemberId", "==", memberId)
      .get();
    const totalReferred = snapAll.size;

    // 2. Compter les attributions validées ('Confirmé' ou 'inscription validée')
    const snapVal = await adminDb.collection("referral_attributions")
      .where("referralMemberId", "==", memberId)
      .where("status", "in", ["Confirmé", "inscription validée"])
      .get();
    const validatedCount = snapVal.size;

    // 3. Compter les attributions en attente
    const snapPend = await adminDb.collection("referral_attributions")
      .where("referralMemberId", "==", memberId)
      .where("status", "in", ["En attente", "inscription en attente", "paiement à vérifier"])
      .get();
    const pendingCount = snapPend.size;

    const memberRef = adminDb.collection("referral_members").doc(memberId);
    await memberRef.update({
      "stats.totalReferred": totalReferred,
      "stats.validatedCount": validatedCount,
      "stats.pendingCount": pendingCount
    });

    // 4. Vérifier l'éligibilité à une récompense
    if (validatedCount >= 5) {
      await checkAndCreateReward(memberId, snapVal.docs);
    }
  } catch (error) {
    console.error("Error updating referral stats:", error);
  }
}

/**
 * Crée un dossier de récompense si le parrain a atteint un multiple de 5 inscriptions validées
 * et qu'il n'a pas déjà de récompense en cours/créée pour ces inscriptions.
 * Version serveur / Admin SDK
 */
export async function checkAndCreateReward(memberId: string, validatedAttributionDocs: any[]) {
  if (!adminDb) return;
  try {
    const sortedAttributions = [...validatedAttributionDocs].sort((a, b) => 
      new Date(a.data().createdAt).getTime() - new Date(b.data().createdAt).getTime()
    );

    // Groupe par 5
    const rewardGroupsCount = Math.floor(sortedAttributions.length / 5);

    // Récupérer les récompenses existantes pour éviter les doublons
    const rewardsSnap = await adminDb.collection("referral_rewards")
      .where("memberId", "==", memberId)
      .get();
    const existingRewardsCount = rewardsSnap.size;

    if (rewardGroupsCount > existingRewardsCount) {
      // Il faut créer de nouvelles récompenses
      for (let i = existingRewardsCount; i < rewardGroupsCount; i++) {
        const startIdx = i * 5;
        const qualifyingDocs = sortedAttributions.slice(startIdx, startIdx + 5);
        const qualifyingEntryIds = qualifyingDocs.map(d => d.data().entryId);
        
        // Générer une référence unique
        const refNumber = String(existingRewardsCount + 1).padStart(6, "0");
        const rewardRef = `GALF-REWARD-${new Date().getFullYear()}-${refNumber}`;

        const rewardData = {
          memberId,
          reference: rewardRef,
          qualifyingCount: 5,
          status: "eligible", // initial state "Éligible - vérification requise"
          trainingId: null,
          centerId: null,
          approvedBy: null,
          approvedAt: null,
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // exp 1 an
          createdAt: new Date().toISOString(),
          qualifyingEntries: qualifyingEntryIds
        };

        await adminDb.collection("referral_rewards").add(rewardData);
        
        // Mettre à jour l'historique ou ajouter une notification admin
        await adminDb.collection("referral_audit_logs").add({
          userId: "system",
          userEmail: "System",
          action: "reward_created",
          details: `Création automatique de la récompense ${rewardRef} pour le parrain ID ${memberId}.`,
          timestamp: new Date().toISOString()
        });
        
        // Mettre à jour le compteur de récompenses sur le membre
        const memberRef = adminDb.collection("referral_members").doc(memberId);
        await memberRef.update({
          "stats.rewardCount": admin.firestore.FieldValue.increment(1)
        });
      }
    }
  } catch (error) {
    console.error("Error creating reward dossier:", error);
  }
}
