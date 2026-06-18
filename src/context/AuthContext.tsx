import React, { createContext, useContext, useEffect, useState } from "react";
import type { User } from "firebase/auth";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../firebase/config";

export interface UserData {
  uid: string;
  email: string;
  username: string;
  displayName: string;
  photoURL: string;
  bannerURL: string;
  bio: string;
  role: "user" | "admin";
  createdAt: string;
  stats: {
    totalWatchTime: number; // in minutes
    totalLikes: number;
    totalFavorites: number;
    totalComments: number;
  };
}

interface AuthContextType {
  user: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, pk: string) => Promise<void>;
  register: (email: string, pk: string, username: string, displayName: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<Omit<UserData, "uid" | "email" | "role" | "createdAt" | "stats">>) => Promise<void>;
  incrementWatchTime: (minutes: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Sign up
  const register = async (email: string, pk: string, username: string, displayName: string) => {
    // Basic formatting of username to be lowercase, no spaces
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, "");
    
    // First, create standard firebase user
    const credential = await createUserWithEmailAndPassword(auth, email, pk);
    const u = credential.user;

    const defaultProfile: UserData = {
      uid: u.uid,
      email: u.email || email,
      username: cleanUsername,
      displayName: displayName.trim() || cleanUsername,
      photoURL: `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanUsername}`,
      bannerURL: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=1200", // Default gradient banner
      bio: "¡Hola! Estoy usando PixelView.",
      role: "user",
      createdAt: new Date().toISOString(),
      stats: {
        totalWatchTime: 0,
        totalLikes: 0,
        totalFavorites: 0,
        totalComments: 0
      }
    };

    // Store in Firestore
    await setDoc(doc(db, "users", u.uid), defaultProfile);
    setUserData(defaultProfile);
  };

  // Sign in
  const login = async (email: string, pk: string) => {
    await signInWithEmailAndPassword(auth, email, pk);
  };

  // Sign out
  const logout = async () => {
    await signOut(auth);
    setUserData(null);
  };

  // Password Reset
  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  // Update profile
  const updateProfile = async (data: Partial<Omit<UserData, "uid" | "email" | "role" | "createdAt" | "stats">>) => {
    if (!user) throw new Error("No user is signed in.");
    
    const userDocRef = doc(db, "users", user.uid);
    await updateDoc(userDocRef, data);
    
    setUserData(prev => prev ? { ...prev, ...data } : null);
  };

  // Increment user watch time statistics
  const incrementWatchTime = async (minutes: number) => {
    if (!user || !userData) return;
    const userDocRef = doc(db, "users", user.uid);
    const newWatchTime = (userData.stats.totalWatchTime || 0) + minutes;
    
    const updatedStats = {
      ...userData.stats,
      totalWatchTime: newWatchTime
    };

    await updateDoc(userDocRef, {
      stats: updatedStats
    });

    setUserData(prev => prev ? { ...prev, stats: updatedStats } : null);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch Firestore extra details
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data() as UserData);
          } else {
            console.warn("User document not found in Firestore.");
          }
        } catch (err) {
          console.error("Error fetching user details from Firestore:", err);
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      userData, 
      loading, 
      login, 
      register, 
      logout, 
      resetPassword,
      updateProfile,
      incrementWatchTime
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
