import * as dotenv from "dotenv";
import path from "path";

// 1. CHARGER DOTENV EN PREMIER
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const DUMMY_COMPANIES = [
  {
    name: "GALF SARL",
    sector: "Vente d'Engins",
    email: "contact@galf.ci",
    phone: "+225 01020304",
    address: "Zone 4, Abidjan",
    active: true,
    stats: { totalSales: 2500000, totalPaid: 1800000, entryCount: 15 }
  },
  {
    name: "NB FLOWERS",
    sector: "Décoration Luxe",
    email: "hello@nb-flowers.com",
    phone: "+225 05060708",
    address: "Cocody Ambassades",
    active: true,
    stats: { totalSales: 850000, totalPaid: 850000, entryCount: 8 }
  }
];

async function seedData() {
  console.log("🌱 Début du seeding des données de démo...");
  
  try {
    const { adminDb } = await import("../lib/firebase/admin");
    if (!adminDb) {
      throw new Error("Firebase Admin n'a pas pu être initialisé.");
    }

    for (const company of DUMMY_COMPANIES) {
        const docRef = await adminDb.collection("companies").add({
          ...company,
          createdAt: new Date(),
        });
        console.log(`✅ Entreprise ajoutée : ${company.name} (ID: ${docRef.id})`);
      }
      
      console.log("✨ Seeding terminé !");
  } catch (error: any) {
    console.error("❌ Erreur seeding:", error.message);
  }
}

seedData();
