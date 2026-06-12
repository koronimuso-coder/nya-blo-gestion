import { collection, addDoc } from "firebase/firestore";
import { db } from "./firebase/config";

export interface AuditLog {
  id?: string;
  userId: string;
  userEmail: string;
  action: string;      // e.g., 'sale_create', 'sale_update', 'sale_delete', 'company_create', 'company_update', 'company_delete', 'user_create', 'user_update', 'export_pdf', 'export_xlsx'
  details: string;     // e.g., 'Création de la saisie pour client Mamadou (150,000 FCFA)'
  companyId: string;   // e.g., 'GALF SARL', 'NB FLOWERS' or 'global'
  timestamp: string;   // ISO string
}

/**
 * Enregistre une action sensible dans les journaux d'audit de Firestore.
 */
export async function logAction(
  userId: string | undefined,
  userEmail: string | null | undefined,
  action: string,
  details: string,
  companyId: string = "global"
) {
  try {
    const logData = {
      userId: userId || "anonymous",
      userEmail: userEmail || "Anonyme",
      action,
      details,
      companyId: companyId || "global",
      timestamp: new Date().toISOString()
    };
    await addDoc(collection(db, "audit_logs"), logData);
  } catch (error) {
    console.error("Error writing audit log to Firestore:", error);
  }
}
