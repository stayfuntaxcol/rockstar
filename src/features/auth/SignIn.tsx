import { useEffect, useState } from "react";
import { auth, db } from "../../lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export default function SignIn() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"login"|"register">("login");
  const [email, setEmail] = useState(""); const [pass, setPass] = useState("");
  const [err, setErr] = useState<string>(""); const [loading, setLoading] = useState(false);

  useEffect(() => {
    const off = onAuthStateChanged(auth, (u) => { if (u) nav("/pipeline"); });
    return () => off();
  }, [nav]);

  async function ensureRoles(uid: string) {
    const ref = doc(db, "roles", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) await setDoc(ref, { viewer: true, rm: true }, { merge: true });
  }

  function validatePassword(p: string) { return p.length >= 8 && /\d/.test(p); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setLoading(true);
    try {
      if (mode === "login") {
        const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
        await ensureRoles(res.user.uid);
        nav("/pipeline");
      } else {
        if (!validatePassword(pass)) throw new Error("Min. 8 tekens, incl. cijfer.");
        const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
        await ensureRoles(res.user.uid);
        nav("/pipeline");
      }
    } catch (e:any) { setErr(e?.message || String(e)); }
    finally { setLoading(false); }
  }

  async function doReset() {
    setErr("");
    try {
      if (!email) throw new Error("Vul je e-mail in.");
      await sendPasswordResetEmail(auth, email.trim());
      alert("Reset-link verzonden.");
    } catch(e:any){ setErr(e?.message || String(e)); }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-bg p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl border shadow-card p-6 space-y-4">
        <h1 className="text-xl font-semibold">{mode === "login" ? "Inloggen" : "Registreren"}</h1>
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-600 mb-1">E-mail</label>
            <input className="w-full border rounded-lg px-3 py-2" type="email" required
                   value={email} onChange={(e)=>setEmail(e.target.value)} autoComplete="email"/>
          </div>
          <div>
            <label className="block text-sm text-slate-600 mb-1">Wachtwoord</label>
            <input className="w-full border rounded-lg px-3 py-2" type="password" required
                   value={pass} onChange={(e)=>setPass(e.target.value)}
                   autoComplete={mode==="login" ? "current-password" : "new-password"}
                   placeholder={mode==="register" ? "Min. 8 tekens, 1 cijfer" : ""}/>
          </div>
          <button disabled={loading} className="w-full rounded-lg bg-brand text-white py-2 font-medium" type="submit">
            {loading ? "Bezig…" : (mode==="login" ? "Inloggen" : "Account aanmaken")}
          </button>
        </form>
        {mode==="login" ? (
          <div className="text-sm flex items-center justify-between">
            <button className="underline" onClick={doReset}>Wachtwoord vergeten?</button>
            <button className="underline" onClick={()=>setMode("register")}>Registreren</button>
          </div>
        ) : (
          <div className="text-sm text-right">
            <button className="underline" onClick={()=>setMode("login")}>Al een account? Inloggen</button>
          </div>
        )}
        <p className="text-xs text-slate-500">Na eerste login krijgt je account rollen in <code>roles/&lt;uid&gt;</code> (viewer, rm).</p>
      </div>
    </div>
  );
}
