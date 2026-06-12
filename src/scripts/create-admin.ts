import * as dotenv from "dotenv";
import path from "path";

// 1. CHARGER DOTENV EN PREMIER
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function createFirstAdmin(email: string, password: string, displayName: string) {
  try {
    console.log(`🚀 Tentative de création de l'admin: ${email}`);
    
    // 2. IMPORTER LE RESTE DYNAMIQUEMENT APRES DOTENV
    const { adminAuth, adminDb } = await import("../lib/firebase/admin");

    if (!adminAuth || !adminDb) {
      throw new Error("Firebase Admin n'a pas pu être initialisé.");
    }

    if (!process.env.FIREBASE_PROJECT_ID) {
      throw new Error("FIREBASE_PROJECT_ID est toujours manquant !");
    }

    // 1. Create user in Firebase Auth
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName,
    });
    
    console.log(`✅ Utilisateur Auth créé: ${userRecord.uid}`);
    
    // 2. Create profile in Firestore
    await adminDb.collection("users").doc(userRecord.uid).set({
      email,
      displayName,
      role: "super_admin",
      active: true,
      companies: [],
      createdAt: new Date(),
    });
    
    console.log(`✅ Profil Firestore créé avec succès.`);
    console.log(`-----------------------------------------------`);
    console.log(`IDENTIFIANTS D'ACCÈS :`);
    console.log(`Email : ${email}`);
    console.log(`Password : ${password}`);
    console.log(`-----------------------------------------------`);
    
  } catch (error: any) {
    if (error.code === 'auth/email-already-exists') {
        console.log("⚠️ L'utilisateur existe déjà.");
    } else {
        console.error("❌ Erreur critique:", error.message);
    }
  }
}

createFirstAdmin("admin@nyablo.com", "NyaBlo2024!", "Admin NYA BLO");
