import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCQeWBs5rkQXi9611YNtlQNLZMP3lUzVMk",
  authDomain: "free-deck.firebaseapp.com",
  projectId: "free-deck",
  storageBucket: "free-deck.firebasestorage.app",
  messagingSenderId: "570335234680",
  appId: "1:570335234680:web:131a675c83d5fcc213bb8d",
  measurementId: "G-SJXGW6Z5SB"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
