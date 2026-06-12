import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function verifyUser() {
  try {
    const { adminAuth } = await import("../lib/firebase/admin");
    if (!adminAuth) {
      throw new Error("Firebase Admin n'a pas pu être initialisé.");
    }
    const user = await adminAuth.getUserByEmail("admin@nyablo.com");
    console.log("✅ Utilisateur trouvé !");
    console.log("ID:", user.uid);
    console.log("Email:", user.email);
    console.log("Role (custom claims):", user.customClaims);
  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error("❌ Utilisateur NON trouvé:", error.message);
    }
  }
}


verifyUser();
