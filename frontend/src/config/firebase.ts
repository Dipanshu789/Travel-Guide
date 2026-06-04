import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBIBDrybEmrSrAfC5hw5yGRO7fsvhwL6_A",
  authDomain: "travel-guide-527e2.firebaseapp.com",
  projectId: "travel-guide-527e2",
  storageBucket: "travel-guide-527e2.firebasestorage.app",
  messagingSenderId: "270682896211",
  appId: "1:270682896211:android:9078260644836bf3eb53a6"
};

// Initialize Firebase only once
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const appleProvider = new OAuthProvider('apple.com');
