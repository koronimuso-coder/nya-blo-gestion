import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function seedReferral() {
  console.log("🌱 Début du seeding des données de parrainage...");
  try {
    const { adminDb } = await import("../lib/firebase/admin");
    if (!adminDb) {
      throw new Error("Firebase Admin SDK n'a pas pu être initialisé. Assurez-vous d'avoir configuré service-account.json ou les variables d'environnement.");
    }

    // 1. Nettoyer ou créer la campagne de test
    const campaignRef = adminDb.collection("referral_campaigns").doc("campagne_2026");
    const campaignData = {
      name: "Campagne Annuelle 2026",
      description: "Campagne principale de parrainage GALF Formation pour l'année 2026.",
      status: "active",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      createdAt: new Date().toISOString()
    };
    await campaignRef.set(campaignData);
    console.log("✅ Campagne 'Campagne Annuelle 2026' créée.");

    // 2. Créer des parrains de test
    const parrains = [
      {
        id: "parrain_mamadou",
        nom: "Diallo",
        prenom: "Mamadou",
        email: "mamadou.diallo@example.com",
        telephoneNormalise: "+2250707070707",
        formationSouhaitee: "Pelle hydraulique",
        campagneId: "campagne_2026",
        codeId: "MAMADOU26",
        status: "active",
        createdAt: new Date().toISOString(),
        recordedBy: "admin_seed",
        stats: {
          totalReferred: 0,
          pendingCount: 0,
          validatedCount: 0,
          rewardCount: 0
        }
      },
      {
        id: "parrain_kadi",
        nom: "Koné",
        prenom: "Kadiatou",
        email: "kadi.kone@example.com",
        telephoneNormalise: "+2250505050505",
        formationSouhaitee: "HSE",
        campagneId: "campagne_2026",
        codeId: "KADI26",
        status: "active",
        createdAt: new Date().toISOString(),
        recordedBy: "admin_seed",
        stats: {
          totalReferred: 0,
          pendingCount: 0,
          validatedCount: 0,
          rewardCount: 0
        }
      },
      {
        id: "parrain_suspendu",
        nom: "Traoré",
        prenom: "Adama",
        email: "adama.traore@example.com",
        telephoneNormalise: "+2250101010101",
        formationSouhaitee: "Chariot élévateur",
        campagneId: "campagne_2026",
        codeId: "ADAMA26",
        status: "suspended",
        createdAt: new Date().toISOString(),
        recordedBy: "admin_seed",
        stats: {
          totalReferred: 0,
          pendingCount: 0,
          validatedCount: 0,
          rewardCount: 0
        }
      }
    ];

    for (const parrain of parrains) {
      await adminDb.collection("referral_members").doc(parrain.id).set(parrain);
      
      // 3. Créer le code associé
      await adminDb.collection("referral_codes").doc(parrain.codeId).set({
        code: parrain.codeId,
        memberId: parrain.id,
        campaignId: "campagne_2026",
        status: parrain.status === "suspended" ? "suspended" : "active",
        createdAt: new Date().toISOString(),
        expiresAt: "2026-12-31"
      });
      console.log(`✅ Parrain ${parrain.prenom} ${parrain.nom} créé avec le code ${parrain.codeId} (Statut: ${parrain.status}).`);
    }

    console.log("✨ Seeding du module de parrainage terminé avec succès !");
  } catch (error: any) {
    console.error("❌ Erreur lors du seeding parrainage:", error.message);
  }
}

seedReferral();
