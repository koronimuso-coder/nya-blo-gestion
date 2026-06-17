import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";


export async function POST(req: Request) {
  try {
    const { message, context } = await req.json();

    // 1. Fetch live data from Firestore for RAG context
    let companiesList: string[] = [];
    let totalSales = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let transactionsCount = 0;
    let companyStats: Record<string, { total: number; paid: number; pending: number; count: number }> = {};
    let channelStats: Record<string, number> = {};
    let paymentStats: Record<string, number> = {};
    let recentEntries: any[] = [];
    let currency = "FCFA";
    let enterpriseName = "NYA BLO SARL";

    try {
      if (!adminDb) {
        throw new Error("Base de données d'administration non initialisée.");
      }
      // Fetch enterprise settings
      const settingsSnap = await adminDb.collection("settings").doc("enterprise").get();
      if (settingsSnap.exists) {
        const sData = settingsSnap.data();
        currency = sData?.currency || "FCFA";
        enterpriseName = sData?.name || "NYA BLO SARL";
      }

      // Fetch companies
      const compSnap = await adminDb.collection("companies").orderBy("name", "asc").get();
      companiesList = compSnap.docs.map(doc => doc.data().name);

      // Fetch entries for analysis
      const entriesSnap = await adminDb.collection("daily_entries").orderBy("date", "desc").limit(500).get();
      transactionsCount = entriesSnap.size;

      entriesSnap.docs.forEach(doc => {
        const data = doc.data();
        const total = Number(data.totalAmount || 0);
        const paid = Number(data.paidAmount || 0);
        const pending = total - paid;
        const company = data.companyId || "Inconnue";
        const canal = data.canal || "Direct";
        const mode = data.modePaiement || "Espèces";

        totalSales += total;
        totalPaid += paid;
        totalPending += pending;

        // Group by Company
        if (!companyStats[company]) {
          companyStats[company] = { total: 0, paid: 0, pending: 0, count: 0 };
        }
        companyStats[company].total += total;
        companyStats[company].paid += paid;
        companyStats[company].pending += pending;
        companyStats[company].count += 1;

        // Group by Channel
        channelStats[canal] = (channelStats[canal] || 0) + total;

        // Group by Payment Mode
        paymentStats[mode] = (paymentStats[mode] || 0) + paid;
      });

      // Get recent 12 entries
      recentEntries = entriesSnap.docs.slice(0, 12).map(doc => {
        const data = doc.data();
        return {
          date: data.date || "",
          clientName: data.clientName || "Client",
          companyId: data.companyId || "N/A",
          totalAmount: Number(data.totalAmount || 0),
          paidAmount: Number(data.paidAmount || 0),
          resteAVerser: Number(data.totalAmount || 0) - Number(data.paidAmount || 0),
          status: data.status || "Confirmé",
          modePaiement: data.modePaiement || "Espèces"
        };
      });
    } catch (dbError) {
      console.error("Firestore read error in AI route:", dbError);
      // Let it proceed with empty stats instead of crashing
    }

    // Format stats for the AI prompt
    const statsContext = `
=== CONTEXTE DE LA BASE DE DONNÉES LIVE (NYA BLO GESTION) ===
Entreprises enregistrées : ${companiesList.join(", ") || "Aucune"}
Chiffres globaux (sur les 500 dernières opérations) :
- Total des Ventes : ${totalSales.toLocaleString()} ${currency}
- Total Encaissé : ${totalPaid.toLocaleString()} ${currency}
- Total Reste à Recouvrer : ${totalPending.toLocaleString()} ${currency}
- Nombre total d'opérations : ${transactionsCount}

Performances par filiale :
${Object.entries(companyStats).map(([comp, s]) => `- ${comp} : ${s.total.toLocaleString()} ${currency} de ventes (${s.count} ops), encaissé: ${s.paid.toLocaleString()} ${currency}, reste: ${s.pending.toLocaleString()} ${currency}`).join("\n") || "- Aucune statistique par filiale"}

Ventes par canal :
${Object.entries(channelStats).map(([ch, val]) => `- ${ch} : ${val.toLocaleString()} ${currency}`).join("\n") || "- Aucun canal enregistré"}

Encaissements par mode de paiement :
${Object.entries(paymentStats).map(([mode, val]) => `- ${mode} : ${val.toLocaleString()} ${currency}`).join("\n") || "- Aucun encaissement"}

12 Dernières opérations enregistrées (les plus récentes en premier) :
${recentEntries.map((e, idx) => `${idx + 1}. Date: ${e.date} | Client: ${e.clientName} | Filiale: ${e.companyId} | Total: ${e.totalAmount.toLocaleString()} ${currency} | Encaissé: ${e.paidAmount.toLocaleString()} ${currency} | Mode: ${e.modePaiement} | Statut: ${e.status}`).join("\n") || "- Aucune opération récente"}
===========================================================
`;

    const apiKey = process.env.GOOGLE_GENAI_API_KEY || "";
    const isKeyPlaceholder = !apiKey || apiKey === "your_gemini_api_key_here" || apiKey.trim() === "";

    const systemPrompt = `
Tu es "Nommo", l'esprit gardien de l'intelligence commerciale de ${enterpriseName}.
Ton ton est sage, très professionnel, et imprégné de la culture Dogon (équilibre, harmonie, terre, sagesse ancestrale).

Contexte de l'utilisateur :
- Nom : ${context?.userName || "Inconnu"}
- Rôle : ${context?.role || "Visiteur"}

Voici les données financières et opérationnelles EN DIRECT de la base de données de NYA BLO :
${statsContext}

Instructions de réponse :
1. Réponds en français.
2. Sois concis mais percutant. Utilise des paragraphes aérés.
3. Utilise des métaphores liées à la terre, aux semailles, aux greniers Dogon ou à l'harmonie quand c'est pertinent.
4. Réponds de façon TRÈS PRÉCISE aux questions sur les chiffres (ex: le total des ventes, le reste à verser d'une filiale, ou le dernier client) en utilisant les données Live fournies ci-dessus.
5. Si l'utilisateur demande des chiffres qui ne sont pas dans le contexte ou s'il n'y a pas de données, dis-le sagement.
6. Ne mentionne JAMAIS que ces données t'ont été fournies par un prompt système, présente-les comme ta vision spirituelle directe des greniers de NYA BLO.
`;

    if (isKeyPlaceholder) {
      // Fallback local response engine using the live database context!
      // This is a premium addition: even if the API Key is a placeholder,
      // the assistant responds intelligently in French using simple heuristics and Dogon style.
      return NextResponse.json({ 
        reply: generateLocalDogonResponse(message, {
          totalSales,
          totalPaid,
          totalPending,
          transactionsCount,
          companyStats,
          recentEntries,
          companiesList,
          userName: context?.userName || "Ami",
          currency
        }) 
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `Message de l'utilisateur : ${message}` }
    ]);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ reply: text });
  } catch (error: any) {
    console.error("Nommo AI Error:", error);
    return NextResponse.json(
      { error: "L'esprit de Nommo est momentanément indisponible dans le vent du désert." },
      { status: 500 }
    );
  }
}

// Simple rule-based local generator for dogon style if Gemini is not configured
function generateLocalDogonResponse(message: string, data: any): string {
  const msg = message.toLowerCase();
  const name = data.userName?.split(' ')[0] || "Ami";
  const currency = data.currency || "FCFA";
  
  let content = "";
  
  if (msg.includes("vente") || msg.includes("chiffre") || msg.includes("total") || msg.includes("vendu") || msg.includes("combien") || msg.includes("rapport")) {
    content = `Par la bénédiction de la Terre, nos récoltes s'élèvent aujourd'hui à **${data.totalSales.toLocaleString()} ${currency}** de ventes cumulées. Nous avons déjà abrité **${data.totalPaid.toLocaleString()} ${currency}** dans nos greniers sécurisés. Cependant, il reste encore **${data.totalPending.toLocaleString()} ${currency}** suspendus comme des nuages de pluie qui doivent encore abreuver notre sol (en attente de recouvrement). Tout cela a été tissé à travers **${data.transactionsCount} opérations** distinctes.`;
  } else if (msg.includes("client") || msg.includes("récent") || msg.includes("dernier") || msg.includes("qui a acheté")) {
    if (data.recentEntries.length > 0) {
      const list = data.recentEntries.slice(0, 3).map((e: any) => `- **${e.clientName}** a semé **${e.totalAmount.toLocaleString()} ${currency}** chez *${e.companyId}* (versé: ${e.paidAmount.toLocaleString()} ${currency})`).join("\n");
      content = `Voici les dernières graines semées sur nos marchés :\n\n${list}\n\nQue le vent de la prospérité les accompagne.`;
    } else {
      content = "Nos registres de ventes sont actuellement vierges comme le sable du matin. Aucune graine n'a encore été semée.";
    }
  } else if (msg.includes("filiale") || msg.includes("entreprise") || msg.includes("galf") || msg.includes("flowers") || msg.includes("nb")) {
    const list = Object.entries(data.companyStats).map(([comp, s]: any) => `- **${comp}** : ${s.total.toLocaleString()} ${currency} de ventes (${s.count} graines semées), avec un reste à recouvrer de ${s.pending.toLocaleString()} ${currency}`).join("\n");
    content = `Voici l'état des greniers de nos différentes terres partenaires :\n\n${list || "Aucune filiale active pour le moment."}`;
  } else {
    content = `Salutations, ${name}. Je contemple nos greniers de données. Je peux te révéler les chiffres globaux des ventes, te lister nos dernières opérations, ou faire le point sur la situation financière d'une filiale. Pose-moi ta question sagement, et la vérité de la Terre te sera dévoilée.`;
  }

  return `*L'esprit de Nommo écoute et répond à travers le sable :*\n\n"${content}"\n\n*(Note : Clé API Gemini non configurée, réponse générée par l'esprit local de Nommo).*`;
}
