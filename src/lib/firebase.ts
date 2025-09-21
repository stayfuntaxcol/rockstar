import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDWjt0YeuEhUCMMOKToGUhjq21K8HlZ8Fk",
  authDomain: "rock-f5937.firebaseapp.com",
  projectId: "rock-f5937",
  storageBucket: "rock-f5937.appspot.com",
  messagingSenderId: "1066836195707",
  appId: "1:1066836195707:web:153c8721f8cf0510af65de",
  measurementId: "G-SLZXLRZMCG"
};

console.log("FIREBASE CONFIG @runtime", { apiKey: firebaseConfig.apiKey, projectId: firebaseConfig.projectId });

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});
export const db = getFirestore(app);
