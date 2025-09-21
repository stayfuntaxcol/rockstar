import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./lib/firebase";
import SignIn from "./features/auth/SignIn";

function Home(){ return <div className=\"p-4\">Welkom — Pipeline komt hier.</div>; }

export default function App(){
  const [user,setUser]=useState<any>(null);
  const [ready,setReady]=useState(false);
  useEffect(()=> onAuthStateChanged(auth,(u)=>{ setUser(u); setReady(true); }),[]);
  if(!ready) return <div className=\"p-8\">Laden…</div>;
  if(!user) return <SignIn/>;
  return (
    <BrowserRouter>
      <div className=\"min-h-screen bg-bg text-ink\">
        <header className=\"sticky top-0 bg-white/80 backdrop-blur border-b\">
          <div className=\"max-w-5xl mx-auto p-3 font-semibold\">ROCK CRM</div>
        </header>
        <main className=\"max-w-5xl mx-auto p-4\">
          <Routes>
            <Route path=\"/\" element={<Navigate to=\"/home\" replace/>}/>
            <Route path=\"/home\" element={<Home/>}/>
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
