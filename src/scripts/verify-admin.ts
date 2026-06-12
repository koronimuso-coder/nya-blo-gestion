import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function verifyAdmin() {
  try {
    const { adminAuth, adminDb } = await import("../lib/firebase/admin");
    if (!adminAuth || !adminDb) {
      throw new Error("Firebase Admin n'a pas pu être initialisé.");
    }
    
    console.log("🔍 Vérification de l'admin admin@nyablo.com...");
    
    // Check Auth
    const authUser = await adminAuth.getUserByEmail("admin@nyablo.com");
    console.log(`✅ Utilisateur trouvé dans Auth (UID: ${authUser.uid})`);
    
    // Force reset password to be absolutely sure
    const newPass = "NyaBlo2024!";
    await adminAuth.updateUser(authUser.uid, { password: newPass });
    console.log(`✅ Mot de passe forcé à: ${newPass}`);

    // Check Firestore
    const userDoc = await adminDb.collection("users").doc(authUser.uid).get();
    
    if (userDoc.exists) {
      console.log("✅ Profil Firestore trouvé.");
      const data = userDoc.data();
      console.log("Données actuelles:", data);
      
      // Fix role and active status if needed
      if (data?.role !== "super_admin" || !data?.active) {
        console.log("🔧 Correction du rôle et de l'activation...");
        await adminDb.collection("users").doc(authUser.uid).update({
          role: "super_admin",
          active: true
        });
        console.log("✅ Rôle corrigé en 'super_admin'");
      }
    } else {
      console.log("⚠️ Profil Firestore manquant. Création...");
      await adminDb.collection("users").doc(authUser.uid).set({
        email: "admin@nyablo.com",
        displayName: "Admin NYA BLO",
        role: "super_admin",
        active: true,
        companies: [],
        createdAt: new Date()
      });
      console.log("✅ Profil Firestore créé.");
    }

    console.log(`🚀 ACCÈS FINAL : admin@nyablo.com / ${newPass}`);
    
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Erreur de vérification:", error.message);
    } else {
      console.error("❌ Erreur de vérification inconnue:", error);
    }
  }
}

verifyAdmin();
