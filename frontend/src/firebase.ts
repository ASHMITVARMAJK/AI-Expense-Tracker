import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut
} from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";

// Firebase web configuration (overridden by .env in production)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDummyKeyForCompilationPurposeOnly1234",
  authDomain: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "ai-expense-tracker-demo"}.firebaseapp.com`,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "ai-expense-tracker-demo",
  storageBucket: `${import.meta.env.VITE_FIREBASE_PROJECT_ID || "ai-expense-tracker-demo"}.appspot.com`,
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:dummyappid12345678"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
};
export type { FirebaseUser };
