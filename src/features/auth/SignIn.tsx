import { useState } from "react";
import { auth, db } from "../../lib/firebase";
import { GoogleAuthProvider, signInWithPopup, signInAnonymously } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

export default function SignIn(){
  const [err,setErr] = useState<string>("");

  async function ensureRoles(uid:string){
    const ref = doc(db,"roles",uid);
    const snap = await getDoc(ref);
    if(!snap.exists()){
      // DEV: geef schrijfrecht meteen
      await setDoc(ref, { viewer:true, rm:true }, { merge:true });
    }
  }

  async function loginGoogle(){
    setErr("");
    try{
      const prov = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, prov);
      await ensureRoles(res.user.uid);
    }catch(e:any){ setErr(e?.message || String(e)); }
  }

  async function loginGuest(){
    setErr("");
    try{
      const res = await signInAnonymously(auth);
      await ensureRoles(res.user.uid);
    }catch(e:any){ setErr(e?.message || String(e)); }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-bg p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border shadow-card p-6 space-y-4">
        <h1 className="text-xl font-semibold">Inloggen</h1>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button onClick={loginGoogle} className="w-full rounded-lg bg-brand text-white py-2 font-medium">
          Inloggen met Google
        </button>
        <button onClick={loginGuest} className="w-full rounded-lg border py-2 font-medium">
          Ga verder als gast (anoniem)
        </button>
        <p className="text-xs text-slate-500">
          Gast = alleen voor testen. In productie een normale provider gebruiken.
        </p>
      </div>
    </div>
  );
}
