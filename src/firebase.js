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
  deleteUser,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
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
  }).catch(() => { });
}

// Authentication & Verification helper functions
export const firebaseSendEmailVerification = async (user) => {
  const targetUser = user || auth.currentUser;
  if (!targetUser) throw new Error("No user found to send verification email.");
  return await sendEmailVerification(targetUser);
};

export const findUserInFirestoreByEmail = async (email) => {
  if (!email) return null;
  const cleanEmail = email.trim().toLowerCase();
  try {
    const q1 = query(
      collection(db, "users"),
      where("email", "==", cleanEmail)
    );
    const snap1 = await Promise.race([
      getDocs(q1),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore query timed out")), 1500)),
    ]);
    if (!snap1.empty) {
      const docSnap = snap1.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }

    const q2 = query(
      collection(db, "users"),
      where("personalEmail", "==", cleanEmail)
    );
    const snap2 = await Promise.race([
      getDocs(q2),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Firestore query timed out")), 1500)),
    ]);
    if (!snap2.empty) {
      const docSnap = snap2.docs[0];
      return { id: docSnap.id, ...docSnap.data() };
    }
  } catch (err) {
    console.warn("Firestore find user by email notice:", err);
  }
  return null;
};

export const deleteUserFromFirestore = async (uid, email = null) => {
  try {
    if (uid) {
      const userRef = doc(db, "users", uid);
      await deleteDoc(userRef).catch(() => {});
    }
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      const q1 = query(collection(db, "users"), where("email", "==", cleanEmail));
      const snap1 = await getDocs(q1).catch(() => ({ empty: true, docs: [] }));
      if (!snap1.empty) {
        for (const d of snap1.docs) {
          await deleteDoc(doc(db, "users", d.id)).catch(() => {});
        }
      }
      const q2 = query(collection(db, "users"), where("personalEmail", "==", cleanEmail));
      const snap2 = await getDocs(q2).catch(() => ({ empty: true, docs: [] }));
      if (!snap2.empty) {
        for (const d of snap2.docs) {
          await deleteDoc(doc(db, "users", d.id)).catch(() => {});
        }
      }
    }
  } catch (err) {
    console.warn("Firestore delete user notice:", err);
  }
};

export const firebaseDeleteCurrentUser = async () => {
  const user = auth.currentUser;
  if (!user) return { success: false, error: 'No active session to delete.' };
  try {
    const uid = user.uid;
    const email = user.email;
    await deleteUserFromFirestore(uid, email);
    await deleteUser(user);
    return { success: true };
  } catch (err) {
    console.warn("Firebase delete user notice:", err);
    return { success: false, error: formatFirebaseError(err) };
  }
};

export const firebaseSignup = async (email, password, displayName) => {
  const cleanEmail = email.trim().toLowerCase();
  let userCredential = null;

  try {
    userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  } catch (err) {
    // If the email is already in use in Firebase Auth, check if the account was deleted from the database
    if (err.code === 'auth/email-already-in-use') {
      const activeDbUser = await findUserInFirestoreByEmail(cleanEmail);
      // If no account exists in the database, it was deleted! Reclaim and recreate clean account
      if (!activeDbUser) {
        try {
          // Attempt to sign in to the old unlinked Firebase Auth record
          const existingCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
          // Purge the old auth user so that a clean new account can be created
          await deleteUser(existingCred.user);
          // Create the new fresh account in Firebase Auth
          userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        } catch (recoverErr) {
          if (recoverErr.code === 'auth/wrong-password' || recoverErr.code === 'auth/invalid-credential') {
            await sendPasswordResetEmail(auth, cleanEmail).catch(() => { });
            throw new Error(
              "An account with this email was previously deleted from the database, but exists in Auth with a previous password. A password reset link has been dispatched to your email so you can set your credentials and create this new account."
            );
          }
          throw recoverErr;
        }
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }

  if (displayName && userCredential.user) {
    updateProfile(userCredential.user, { displayName }).catch((err) => {
      console.warn("Profile update notice:", err);
    });
  }
  if (userCredential.user) {
    try {
      await sendEmailVerification(userCredential.user);
    } catch (verr) {
      console.warn("Email verification send notice:", verr);
    }
  }
  // Sign out immediately so newly registered user is not granted access until email is verified
  await signOut(auth).catch(() => { });
  return userCredential;
};

export const firebaseResendVerification = async (email, password = null) => {
  try {
    let targetUser = auth.currentUser;
    let shouldSignOut = false;
    if ((!targetUser || targetUser.email?.toLowerCase() !== email.toLowerCase()) && password) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      targetUser = cred.user;
      shouldSignOut = true;
    }
    if (!targetUser) {
      return {
        success: false,
        error: "Unable to find active user session. Please enter your credentials to resend the verification link."
      };
    }
    await sendEmailVerification(targetUser);
    if (shouldSignOut) {
      await signOut(auth).catch(() => { });
    }
    return { success: true };
  } catch (err) {
    await signOut(auth).catch(() => { });
    return { success: false, error: formatFirebaseError(err) };
  }
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

// Store user role and email in Firebase Firestore (asynchronous non-blocking)
export const saveUserRoleToFirestore = (uid, email, role, extraData = {}) => {
  try {
    const userRef = doc(db, "users", uid);
    return setDoc(userRef, {
      uid,
      email: email.toLowerCase(),
      role,
      updatedAt: new Date().toISOString(),
      ...extraData,
    }, { merge: true }).catch((err) => {
      console.warn("Firestore save user role notice:", err);
    });
  } catch (err) {
    console.warn("Firestore save user role notice:", err);
    return Promise.resolve();
  }
};

// Fetch user role and details from Firebase Firestore with safety timeout
export const getUserRoleFromFirestore = async (uid, timeoutMs = 1200) => {
  try {
    const userRef = doc(db, "users", uid);
    const snap = await Promise.race([
      getDoc(userRef),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Firestore fetch timed out")), timeoutMs)
      ),
    ]);
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
      return 'An account with this personal email already exists in Firebase Auth.';
    case 'auth/invalid-email':
      return 'Invalid email address format.';
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
      return 'Invalid personal email or password. Please verify your credentials.';
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
