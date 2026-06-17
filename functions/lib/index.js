"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledDailyReport = exports.onNewDailyEntry = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();
exports.onNewDailyEntry = functions.firestore
    .document("daily_entries/{entryId}")
    .onCreate(async (snap, context) => {
    const entry = snap.data();
    const { companyId, amount, paidAmount } = entry;
    const companyRef = db.collection("companies").doc(companyId);
    await db.runTransaction(async (transaction) => {
        var _a;
        const companyDoc = await transaction.get(companyRef);
        if (!companyDoc.exists)
            return;
        const currentStats = ((_a = companyDoc.data()) === null || _a === void 0 ? void 0 : _a.stats) || { totalSales: 0, totalPaid: 0, entryCount: 0 };
        transaction.update(companyRef, {
            "stats.totalSales": admin.firestore.FieldValue.increment(amount),
            "stats.totalPaid": admin.firestore.FieldValue.increment(paidAmount),
            "stats.entryCount": admin.firestore.FieldValue.increment(1),
            "lastActivity": admin.firestore.FieldValue.serverTimestamp()
        });
    });
    console.log(`Stats mises à jour pour l'entreprise ${companyId}`);
});
exports.scheduledDailyReport = functions.pubsub
    .schedule("0 20 * * *")
    .timeZone("Africa/Abidjan")
    .onRun(async (context) => {
    const today = new Date().toISOString().split('T')[0];
    const entriesSnapshot = await db.collection("daily_entries")
        .where("date", "==", today)
        .get();
    if (entriesSnapshot.empty) {
        console.log("Aucune saisie aujourd'hui.");
        return null;
    }
    console.log(`Rapport du ${today}: ${entriesSnapshot.size} entrées traitées.`);
    return null;
});
//# sourceMappingURL=index.js.map