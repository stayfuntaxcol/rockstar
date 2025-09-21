import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    try {
      await signInWithEmailAndPassword(auth, email, pw);
    } catch (x: any) {
      setErr(x.message || "Login mislukt");
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-24 bg-white rounded-2xl shadow-card p-6">
      <h1 className="text-xl font-bold mb-4">Inloggen</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full rounded-lg border p-2"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="w-full rounded-lg border p-2"
          type="password"
          placeholder="Wachtwoord"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="w-full rounded-lg bg-brand text-white py-2 font-semibold">
          Log in
        </button>
      </form>
    </div>
  );
}
