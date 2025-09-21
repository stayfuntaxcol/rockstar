import { , Routes, Route } from "react-router-dom";
import { , Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import Pipeline from "./features/pipeline/Pipeline";
import SignIn from "./features/auth/SignIn";

export default function App(){
  const [user,setUser]=useState<unknown | null>(null);
  const [ready,setReady]=useState(false);

  useEffect(()=> {
    const off = onAuthStateChanged(auth,(u)=>{ setUser(u); setReady(true); });
    return () => off();
  },[]);

  if(!ready) return <div className="p-8">Laden…</div>;
  if(!user) return <SignIn/>;

  return (
    <>
      <div className="min-h-screen bg-bg text-ink">
        <header className="sticky top-0 bg-white/80 backdrop-blur border-b">
          <div className="max-w-5xl mx-auto p-3 font-semibold">ROCK CRM</div>
        </header>
        <main className="max-w-5xl mx-auto p-4">
          <Routes>
            <Route path="/" element={<Navigate to="/pipeline" replace/>}/>
            <Route path="/pipeline" element={<Pipeline/>}/>
            <Route path="/contacts" element={<Contacts/>}/>
          <Route path="/signin" element={<SignIn/>}/>
        </Routes>
        </main>
      </div>
    </>
  );
}
