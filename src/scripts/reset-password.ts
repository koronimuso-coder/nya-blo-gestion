import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function resetPassword() {
  try {
    const { adminAuth } = await import("../lib/firebase/admin");
    if (!adminAuth) {
      throw new Error("Firebase Admin n'a pas pu être initialisé.");
    }
    const user = await adminAuth.getUserByEmail("admin@nyablo.com");
    await adminAuth.updateUser(user.uid, {
      password: "password123",
    });
    console.log("✅ Mot de passe réinitialisé avec succès !");
    console.log("Nouvel accès : admin@nyablo.com / password123");
  } catch (error: unknown) {
    if (error instanceof Error) {
        console.error("❌ Échec de la réinitialisation:", error.message);
    }
  }
}


resetPassword();
