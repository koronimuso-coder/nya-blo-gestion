import * as admin from "firebase-admin";

const firebaseAdminConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
};

let adminAuth: admin.auth.Auth | null = null;
let adminDb: admin.firestore.Firestore | null = null;
let adminStorage: admin.storage.Storage | null = null;

const hasCredentials = 
  !!(firebaseAdminConfig.projectId && 
  firebaseAdminConfig.clientEmail && 
  firebaseAdminConfig.privateKey && 
  firebaseAdminConfig.privateKey.includes("BEGIN PRIVATE KEY"));

if (hasCredentials) {
  try {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseAdminConfig as any),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    }
    adminAuth = admin.auth();
    adminDb = admin.firestore();
    adminStorage = admin.storage();
  } catch (err) {
    console.error("Firebase Admin initialization error:", err);
  }
} else {
  console.warn("Firebase Admin credentials missing or invalid in this environment. Firestore Admin operations will be disabled.");
}

export { adminAuth, adminDb, adminStorage };
