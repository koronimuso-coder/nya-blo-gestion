const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function listCollections() {
  const collections = ['referral_members', 'referral_codes', 'referral_rewards', 'referral_attributions', 'referral_audit_logs'];
  
  for (const collName of collections) {
    const snap = await db.collection(collName).get();
    console.log(`Collection: ${collName} -> Count: ${snap.size}`);
    snap.docs.forEach(doc => {
      console.log(`  - [${doc.id}]:`, doc.data());
    });
  }
}

listCollections().catch(console.error);
