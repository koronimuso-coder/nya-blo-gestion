import { useState, useEffect } from "react";
import { collection, query, where, getDocs, onSnapshot, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { useAuth } from "@/context/AuthContext";

export interface Company {
  id: string;
  name: string;
  logo?: string;
  sector: string;
  active: boolean;
  email: string;
  phone: string;
  address: string;
  settings?: any;
}

export const useCompanies = () => {
  const { profile, isSuperAdmin } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    let q;
    if (isSuperAdmin) {
      // Super admin sees all active companies
      q = query(collection(db, "companies"));
    } else if (profile.companies?.length > 0) {
      // Others see companies they are assigned to
      q = query(collection(db, "companies"), where("__name__", "in", profile.companies));
    } else {
      Promise.resolve().then(() => {
        setCompanies([]);
        setLoading(false);
      });
      return;
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const companyList: Company[] = [];
      snapshot.forEach((doc) => {
        companyList.push({ id: doc.id, ...doc.data() } as Company);
      });
      setCompanies(companyList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [profile, isSuperAdmin]);

  return { companies, loading };
};
