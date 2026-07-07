import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  auth, 
  googleProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut
} from "../firebase";
import type { FirebaseUser } from "../firebase";
import api from "../services/api";

interface UserProfile {
  firebaseUid: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  signInWithEmail: (e: string, p: string) => Promise<void>;
  signUpWithEmail: (e: string, p: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync user profile with MySQL backend on login
  const syncProfileWithBackend = async () => {
    try {
      const response = await api.post<UserProfile>("/api/auth/sync");
      setProfile(response.data);
    } catch (err) {
      console.error("Error syncing user profile with Spring Boot backend:", err);
      // Fallback profile if backend isn't reachable yet
      if (auth.currentUser) {
        setProfile({
          firebaseUid: auth.currentUser.uid,
          email: auth.currentUser.email || "",
          name: auth.currentUser.displayName || "User"
        });
      }
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await syncProfileWithBackend();
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = async (e: string, p: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, e, p);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async (e: string, p: string, name: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, e, p);
      // Update display name locally in Firebase (async, don't block)
      if (cred.user) {
        try {
          // Fallback update if firebase allows it
          // Import updateProfile dynamically to keep it clean
          const { updateProfile } = await import("firebase/auth");
          await updateProfile(cred.user, { displayName: name });
        } catch (nameError) {
          console.warn("Failed to set displayName on Firebase Auth record:", nameError);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInWithEmail, signUpWithEmail, signInWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
