import * as dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function fixAllUsersAccess() {
  try {
    const { adminAuth, adminDb } = await import("../lib/firebase/admin");
    if (!adminAuth || !adminDb) {
      throw new Error("Firebase Admin n'a pas pu être initialisé.");
    }

    const emails = ["admin@nyablo.com", "ogo@nyablo.com", "nyablo@outlook.com"];
    const password = "NyaBlo2024!";

    for (const email of emails) {
      try {
        console.log(`\n🔍 Traitement de l'utilisateur : ${email}...`);
        
        let authUser;
        try {
          authUser = await adminAuth.getUserByEmail(email);
          console.log(`✅ Utilisateur trouvé dans Auth (UID: ${authUser.uid})`);
          
          // Force reset password
          await adminAuth.updateUser(authUser.uid, { password });
          console.log(`  -> Mot de passe forcé à: ${password}`);
        } catch (authErr: any) {
          if (authErr.code === 'auth/user-not-found') {
            console.log(`⚠️ Utilisateur absent de Auth. Création...`);
            authUser = await adminAuth.createUser({
              email,
              password,
              displayName: email.split("@")[0].toUpperCase()
            });
            console.log(`  -> Utilisateur créé avec succès (UID: ${authUser.uid})`);
          } else {
            throw authErr;
          }
        }

        // Create or update Firestore profile
        const userDocRef = adminDb.collection("users").doc(authUser.uid);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
          console.log(`  -> Profil Firestore existant. Mise à jour...`);
          await userDocRef.update({
            role: "super_admin",
            active: true,
            email: email,
            displayName: authUser.displayName || email.split("@")[0].toUpperCase()
          });
        } else {
          console.log(`  -> Profil Firestore absent. Création...`);
          await userDocRef.set({
            email,
            displayName: authUser.displayName || email.split("@")[0].toUpperCase(),
            role: "super_admin",
            active: true,
            companies: [],
            createdAt: new Date()
          });
        }
        console.log(`✅ Profil Firestore configuré avec succès.`);
        
      } catch (err: any) {
        console.error(`❌ Erreur pour ${email} :`, err.message);
      }
    }

    console.log("\n🚀 Opération terminée ! Tous les administrateurs ont pour mot de passe : NyaBlo2024!");

  } catch (error: any) {
    console.error("❌ Erreur générale :", error.message);
  }
}

fixAllUsersAccess();
