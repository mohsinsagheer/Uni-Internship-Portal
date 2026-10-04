// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, isSupported } from "firebase/analytics";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA5Np7wPeAuw-a5DdBJ7QJClwSWmCDW3Tc",
  authDomain: "internsip-docs-portal.firebaseapp.com",
  projectId: "internsip-docs-portal",
  storageBucket: "internsip-docs-portal.firebasestorage.app",
  messagingSenderId: "598128029257",
  appId: "1:598128029257:web:becebe1cd9f9796f739998",
  measurementId: "G-7KY7BJEFMP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth & Firestore
export const auth = getAuth(app);
export const db = getFirestore(app);

// Initialize Analytics (supported in browser environment)
export let analytics;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

// Authentication & Verification helper functions
export const firebaseSendEmailVerification = async (user) => {
  const targetUser = user || auth.currentUser;
  if (!targetUser) throw new Error("No user found to send verification email.");
  return await sendEmailVerification(targetUser);
};

export const firebaseSignup = async (email, password, displayName) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName && userCredential.user) {
    await updateProfile(userCredential.user, { displayName });
  }
  if (userCredential.user) {
    try {
      await sendEmailVerification(userCredential.user);
    } catch (verr) {
      console.warn("Email verification send notice:", verr);
    }
  }
  return userCredential;
};

export const firebaseLogin = async (email, password) => {
  return await signInWithEmailAndPassword(auth, email, password);
};

export const firebaseLogout = async () => {
  return await signOut(auth);
};

export const firebaseResetPassword = async (email) => {
  return await sendPasswordResetEmail(auth, email);
};

// Store user role and email in Firebase Firestore
export const saveUserRoleToFirestore = async (uid, email, role, extraData = {}) => {
  try {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      uid,
      email: email.toLowerCase(),
      role,
      updatedAt: new Date().toISOString(),
      ...extraData,
    }, { merge: true });
  } catch (err) {
    console.warn("Firestore save user role notice:", err);
  }
};

// Fetch user role and details from Firebase Firestore
export const getUserRoleFromFirestore = async (uid) => {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data();
    }
  } catch (err) {
    console.warn("Firestore fetch user role notice:", err);
  }
  return null;
};

export const formatFirebaseError = (error) => {
  if (!error) return 'An error occurred during authentication.';
  const code = error.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email/registration number already exists in Firebase Auth.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Invalid email/ID or password. Please verify your credentials.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters for Firebase Auth.';
    case 'auth/user-disabled':
      return 'This user account has been disabled.';
    case 'auth/too-many-requests':
      return 'Access to this account has been temporarily disabled due to many failed login attempts.';
    default:
      return error.message || 'Firebase authentication failed.';
  }
};

export default app;
