import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function fixUserAccess() {
  const uid = "varFJ7WjNlYc6liKXcrqkZAelHW2";
  try {
    const { adminDb } = await import("../lib/firebase/admin");
    if (!adminDb) {
      throw new Error("Firebase Admin n'a pas pu être initialisé.");
    }
    await adminDb.collection("users").doc(uid).set({
      email: "admin@nyablo.com",
      displayName: "Grand Administrateur Dogon",
      role: "super_admin",
      companies: ["galf-sarl", "nb-flowers"],
      active: true,
      lastLogin: new Date().toISOString()
    }, { merge: true });
    console.log(`✅ Accès réglé pour l'utilisateur: ${uid}`);
  } catch (error: any) {
    console.error("❌ Erreur lors du réglage:", error.message);
  }
}

fixUserAccess();
