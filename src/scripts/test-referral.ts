import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function runTests() {
  console.log("🧪 DÉBUT DES TESTS D'INTÉGRATION DU MODULE DE PARRAINAGE\n");
  
  console.log("🔑 Utilisation de Firebase Admin SDK pour les tests (Bypasses Client Auth)...");

  let passed = 0;
  let failed = 0;

  const runTest = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(`✅ [SUCCÈS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ [ÉCHEC] ${name}:`, err.message);
      failed++;
    }
  };

  try {
    const { verifyReferralCode, calculateReferralProgress, createReferralAttribution, updateReferralMemberStats } = await import("../lib/referral-server");
    const { adminDb } = await import("../lib/firebase/admin");

    if (!adminDb) {
      throw new Error("Impossible de se connecter au SDK d'administration.");
    }

    // --- TEST 1: Inscription sans code parrain ---
    await runTest("Test 1: Inscription sans code parrain", async () => {
      const res = await verifyReferralCode("", "+2250707070707");
      if (res.status !== "not_found") {
        throw new Error(`Attendu status 'not_found', obtenu '${res.status}'`);
      }
    });

    // --- TEST 2: Code valide ---
    await runTest("Test 2: Inscription avec code valide (MAMADOU26)", async () => {
      const res = await verifyReferralCode("MAMADOU26", "+2250909090909");
      if (res.status !== "valid" || !res.member) {
        throw new Error(`Attendu status 'valid', obtenu '${res.status}' - ${res.message}`);
      }
    });

    // --- TEST 3: Code introuvable ---
    await runTest("Test 3: Code parrain introuvable (INCONNU99)", async () => {
      const res = await verifyReferralCode("INCONNU99", "+2250909090909");
      if (res.status !== "not_found") {
        throw new Error(`Attendu status 'not_found', obtenu '${res.status}'`);
      }
    });

    // --- TEST 4: Code suspendu ---
    await runTest("Test 4: Code suspendu (ADAMA26)", async () => {
      const res = await verifyReferralCode("ADAMA26", "+2250909090909");
      if (res.status !== "suspended") {
        throw new Error(`Attendu status 'suspended', obtenu '${res.status}'`);
      }
    });

    // --- TEST 5: Auto-parrainage ---
    await runTest("Test 5: Détection de l'auto-parrainage", async () => {
      // Le parrain 'MAMADOU26' a le téléphone '+2250707070707'
      const res = await verifyReferralCode("MAMADOU26", "+2250707070707");
      if (res.status !== "self_referral") {
        throw new Error(`Attendu status 'self_referral', obtenu '${res.status}'`);
      }
    });

    // --- TEST 6: Doublon de téléphone ---
    await runTest("Test 6: Détection de doublon de filleul", async () => {
      // Créer une fausse attribution existante
      const testPhone = "+2250000000000";
      const dummyAttrRef = adminDb.collection("referral_attributions").doc("test_dup_attribution");
      await dummyAttrRef.set({
        entryId: "test_entry_dup",
        studentName: "Filleul Doublon",
        studentPhone: testPhone,
        studentPhoneNormalized: testPhone.replace(/\D/g, ""),
        referralMemberId: "parrain_mamadou",
        referralCodeId: "MAMADOU26",
        campaignId: "campagne_2026",
        status: "inscription validée",
        createdAt: new Date().toISOString()
      });

      const res = await verifyReferralCode("MAMADOU26", testPhone);
      
      // Nettoyage immédiat
      await dummyAttrRef.delete();

      if (res.status !== "duplicate") {
        throw new Error(`Attendu status 'duplicate', obtenu '${res.status}' : ${res.message}`);
      }
    });

    // --- TEST 7: Progression 5/5 et création automatique de récompense ---
    await runTest("Test 7: Progression et déclenchement automatique de la récompense à 5/5", async () => {
      const memberId = "parrain_kadi";
      const codeId = "KADI26";
      
      // Nettoyer les anciennes attributions ou récompenses de test pour ce parrain
      const oldAttrs = await adminDb.collection("referral_attributions").where("referralMemberId", "==", memberId).get();
      for (const d of oldAttrs.docs) { await d.ref.delete(); }
      const oldRewards = await adminDb.collection("referral_rewards").where("memberId", "==", memberId).get();
      for (const d of oldRewards.docs) { await d.ref.delete(); }

      // Créer 5 inscriptions validées successives
      for (let i = 1; i <= 5; i++) {
        await createReferralAttribution({
          entryId: `test_entry_kadi_${i}`,
          studentName: `Filleul Kadi ${i}`,
          studentPhone: `+22599999990${i}`,
          referralMemberId: memberId,
          referralCodeId: codeId,
          campaignId: "campagne_2026",
          attributionMethod: "manual",
          recordedBy: "test_commerciale",
          recordedByName: "Test Agent",
          status: "inscription validée"
        });
      }

      // Vérifier le compteur du parrain
      const mSnap = await adminDb.collection("referral_members").doc(memberId).get();
      const mData = mSnap.data();
      if (mData?.stats?.validatedCount !== 5) {
        throw new Error(`Attendu compteur de validation = 5, obtenu ${mData?.stats?.validatedCount}`);
      }

      // Vérifier la création du dossier de récompense
      const rewardSnap = await adminDb.collection("referral_rewards").where("memberId", "==", memberId).get();
      if (rewardSnap.empty) {
        throw new Error("Aucun dossier de récompense créé à 5/5 !");
      }
      
      const rewardDoc = rewardSnap.docs[0].data();
      if (rewardDoc.status !== "eligible") {
        throw new Error(`Le statut initial de la récompense doit être 'eligible', obtenu '${rewardDoc.status}'`);
      }
      
      console.log(`   └─ Référence de récompense créée : ${rewardDoc.reference}`);

      // Nettoyer
      for (const d of rewardSnap.docs) { await d.ref.delete(); }
      const newAttrs = await adminDb.collection("referral_attributions").where("referralMemberId", "==", memberId).get();
      for (const d of newAttrs.docs) { await d.ref.delete(); }
      await updateReferralMemberStats(memberId);
    });

  } catch (err: any) {
    console.error("❌ Erreur critique lors du chargement des tests:", err.message);
  }

  console.log(`\n📊 BILAN DES TESTS : ${passed} passés, ${failed} échoués.`);
}

runTests();
