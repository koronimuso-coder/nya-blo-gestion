"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";

export type UserRole = "super_admin" | "admin_entreprise" | "superviseur" | "commerciale" | "lecteur";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  companies: string[];
  active: boolean;
  photoURL?: string;
  notifications?: Record<string, boolean>;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isCommerciale: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  isSuperAdmin: false,
  isAdmin: false,
  isCommerciale: false,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (firebaseUser) {
        const userDocRef = doc(db, "users", firebaseUser.uid);
        
        const unsubProfile = onSnapshot(userDocRef, 
          (docSnap) => {
            if (docSnap.exists()) {
              setProfile({ uid: firebaseUser.uid, ...docSnap.data() } as UserProfile);
            } else {
              console.warn("Utilisateur non trouvé dans Firestore.");
              setProfile(null);
            }
            setLoading(false);
          },
          (error) => {
            console.error("Erreur d'accès aux données (Vérifiez vos règles Firebase) :", error.message);
            setProfile(null);
            setLoading(false);
          }
        );

        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const value = {
    user,
    profile,
    loading,
    isSuperAdmin: profile?.role === "super_admin",
    isAdmin: profile?.role === "super_admin" || profile?.role === "admin_entreprise",
    isCommerciale: profile?.role === "commerciale",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
