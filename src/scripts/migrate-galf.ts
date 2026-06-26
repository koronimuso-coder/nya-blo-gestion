import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const OLD_NAME = "GALF SARL";
const NEW_NAME = "GALF FORMATION";

async function migrateGalfFormation() {
  try {
    const { adminDb } = await import("../lib/firebase/admin");
    if (!adminDb) {
      throw new Error("Firebase Admin n'a pas pu être initialisé.");
    }

    console.log("🚀 Démarrage de la migration GALF SARL → GALF FORMATION\n");

    // ──────────────────────────────────────────────────────────────
    // ÉTAPE 1 : Trouver et supprimer l'entrée "GALF SARL" dans companies
    // ──────────────────────────────────────────────────────────────
    console.log("📋 ÉTAPE 1 : Mise à jour de la collection 'companies'...");

    const companiesSnap = await adminDb.collection("companies").get();
    let galfSarlDocId: string | null = null;
    let galfFormationExists = false;
    let galfSarlData: any = null;

    companiesSnap.forEach((doc) => {
      const data = doc.data();
      if (data.name === OLD_NAME) {
        galfSarlDocId = doc.id;
        galfSarlData = { id: doc.id, ...data };
        console.log(`  ✅ Trouvé "${OLD_NAME}" (ID: ${doc.id})`);
      }
      if (data.name === NEW_NAME) {
        galfFormationExists = true;
        console.log(`  ℹ️  "${NEW_NAME}" existe déjà (ID: ${doc.id})`);
      }
    });

    if (!galfSarlDocId) {
      console.log(`  ⚠️  Aucune entrée "${OLD_NAME}" trouvée dans companies.`);
    }

    if (!galfFormationExists) {
      // Créer GALF FORMATION avec les données de GALF SARL ou par défaut
      const newCompanyData = galfSarlData
        ? {
            ...galfSarlData,
            name: NEW_NAME,
            updatedAt: new Date().toISOString(),
          }
        : {
            name: NEW_NAME,
            sector: "Formation Professionnelle",
            active: true,
            email: "contact@galf.ci",
            phone: "",
            address: "Abidjan, Côte d'Ivoire",
            settings: {},
            createdAt: new Date().toISOString(),
          };

      // Supprimer l'ancien id s'il vient de galfSarlData
      delete newCompanyData.id;

      const newDocRef = await adminDb.collection("companies").add(newCompanyData);
      console.log(`  ✅ "${NEW_NAME}" créé avec succès (ID: ${newDocRef.id})`);
    }

    // Supprimer GALF SARL
    if (galfSarlDocId) {
      await adminDb.collection("companies").doc(galfSarlDocId).delete();
      console.log(`  🗑️  "${OLD_NAME}" supprimé de la collection companies.`);
    }

    // ──────────────────────────────────────────────────────────────
    // ÉTAPE 2 : Migrer daily_entries
    // ──────────────────────────────────────────────────────────────
    console.log(`\n📋 ÉTAPE 2 : Migration des 'daily_entries'...`);

    const entriesSnap = await adminDb
      .collection("daily_entries")
      .where("companyId", "==", OLD_NAME)
      .get();

    if (entriesSnap.empty) {
      console.log(`  ℹ️  Aucune entrée avec companyId="${OLD_NAME}" trouvée.`);
    } else {
      console.log(`  📊 ${entriesSnap.size} entrée(s) à migrer...`);
      const batch = adminDb.batch();
      entriesSnap.forEach((doc) => {
        batch.update(doc.ref, { companyId: NEW_NAME });
      });
      await batch.commit();
      console.log(`  ✅ ${entriesSnap.size} daily_entries mis à jour → "${NEW_NAME}"`);
    }

    // ──────────────────────────────────────────────────────────────
    // ÉTAPE 3 : Migrer audit_logs
    // ──────────────────────────────────────────────────────────────
    console.log(`\n📋 ÉTAPE 3 : Migration des 'audit_logs'...`);

    const auditSnap = await adminDb
      .collection("audit_logs")
      .where("companyId", "==", OLD_NAME)
      .get();

    if (auditSnap.empty) {
      console.log(`  ℹ️  Aucun audit_log avec companyId="${OLD_NAME}" trouvé.`);
    } else {
      const batch2 = adminDb.batch();
      auditSnap.forEach((doc) => {
        batch2.update(doc.ref, { companyId: NEW_NAME });
      });
      await batch2.commit();
      console.log(`  ✅ ${auditSnap.size} audit_logs mis à jour.`);
    }

    // ──────────────────────────────────────────────────────────────
    // ÉTAPE 4 : Migrer users.companies (tableau d'IDs ou de noms)
    // ──────────────────────────────────────────────────────────────
    console.log(`\n📋 ÉTAPE 4 : Migration des profils 'users' (champ companies)...`);

    const usersSnap = await adminDb.collection("users").get();
    let usersUpdated = 0;

    const batchUsers = adminDb.batch();
    usersSnap.forEach((doc) => {
      const data = doc.data();
      const companies: string[] = data.companies || [];
      const idx = companies.indexOf(OLD_NAME);
      if (idx !== -1) {
        const newCompanies = [...companies];
        newCompanies[idx] = NEW_NAME;
        batchUsers.update(doc.ref, { companies: newCompanies });
        usersUpdated++;
        console.log(`  → Utilisateur ${data.email || doc.id} : "${OLD_NAME}" → "${NEW_NAME}"`);
      }
    });

    if (usersUpdated > 0) {
      await batchUsers.commit();
      console.log(`  ✅ ${usersUpdated} profil(s) utilisateur mis à jour.`);
    } else {
      console.log(`  ℹ️  Aucun profil utilisateur ne référençait "${OLD_NAME}".`);
    }

    // ──────────────────────────────────────────────────────────────
    // ÉTAPE 5 : Migrer referral_audit_logs si applicable
    // ──────────────────────────────────────────────────────────────
    console.log(`\n📋 ÉTAPE 5 : Migration des 'referral_audit_logs'...`);

    const refAuditSnap = await adminDb
      .collection("referral_audit_logs")
      .where("companyId", "==", OLD_NAME)
      .get();

    if (!refAuditSnap.empty) {
      const batchRef = adminDb.batch();
      refAuditSnap.forEach((doc) => {
        batchRef.update(doc.ref, { companyId: NEW_NAME });
      });
      await batchRef.commit();
      console.log(`  ✅ ${refAuditSnap.size} referral_audit_logs mis à jour.`);
    } else {
      console.log(`  ℹ️  Aucun referral_audit_log concerné.`);
    }

    // ──────────────────────────────────────────────────────────────
    // RÉSUMÉ
    // ──────────────────────────────────────────────────────────────
    console.log("\n═══════════════════════════════════════════════════════");
    console.log("✅ MIGRATION TERMINÉE AVEC SUCCÈS !");
    console.log(`   "${OLD_NAME}" → "${NEW_NAME}"`);
    console.log(`   daily_entries migrées : ${entriesSnap.size}`);
    console.log(`   audit_logs migrés     : ${auditSnap.size}`);
    console.log(`   profils utilisateurs  : ${usersUpdated}`);
    console.log("═══════════════════════════════════════════════════════\n");

  } catch (error: any) {
    console.error("❌ Erreur critique lors de la migration :", error.message);
    process.exit(1);
  }
}

migrateGalfFormation();
