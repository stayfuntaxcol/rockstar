import { initializeApp } from "firebase/app";
import { getAuth, setPersistence, browserLocalPersistence, connectAuthEmulator } from "firebase/auth";
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

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(() => {});
export const db = getFirestore(app);

// --- Optioneel: Auth Emulator in dev ---
// Zet in .env.local: VITE_USE_AUTH_EMULATOR=1  (alleen als je emulator draait)
const useEmu = import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_AUTH_EMULATOR === '1';
if (useEmu && typeof window !== 'undefined' && !(window as any).__AUTH_EMU_CONNECTED__) {
  connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
  (window as any).__AUTH_EMU_CONNECTED__ = true;
}
