const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function clearCollections() {
  const collections = [
    'referral_members', 
    'referral_codes', 
    'referral_rewards', 
    'referral_attributions', 
    'referral_audit_logs',
    'referral_campaigns'
  ];
  
  for (const collName of collections) {
    const snap = await db.collection(collName).get();
    console.log(`Clearing collection: ${collName} (${snap.size} documents)...`);
    const batch = db.batch();
    snap.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    if (snap.size > 0) {
      await batch.commit();
      console.log(`Collection ${collName} cleared!`);
    }
  }
}

clearCollections().catch(console.error);
