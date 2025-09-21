import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot, orderBy, query, limit } from "firebase/firestore";
import { db } from "../../lib/firebase";
import StatCard from "../../components/StatCard";
import DataTable from "../../components/DataTable";

type Lead = { id?:string; company:string; stage?:string; created_at?:number; };

export default function Top20(){
  const [leads,setLeads]=useState<Lead[]>([]);
  useEffect(()=>{
    const qy = query(collection(db,"leads"), orderBy("created_at","desc"), limit(20));
    const off = onSnapshot(qy, s=> setLeads(s.docs.map(d=>({id:d.id, ...(d.data() as any)}))));
    return ()=>off();
  },[]);

  const counts = useMemo(()=>{
    const c:Record<string,number> = {};
    for(const l of leads){ const s=(l.stage||"Nieuw").toUpperCase(); c[s]=(c[s]||0)+1; }
    return c;
  },[leads]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Top 20 (recent)</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Totaal (Top20)" value={leads.length}/>
        <StatCard label="ENGAGE"   value={counts["ENGAGE"]||0}/>
        <StatCard label="PROPOSAL" value={counts["PROPOSAL"]||0}/>
        <StatCard label="COMMIT"   value={counts["COMMIT"]||0}/>
      </div>

      <DataTable
        head={
          <tr>
            <th className="text-left px-4 py-2">Company</th>
            <th className="text-left px-4 py-2">Stage</th>
            <th className="text-left px-4 py-2">Aangemaakt</th>
          </tr>
        }
        rows={
          <>
            {leads.map(l=>(
              <tr key={l.id} className="border-t">
                <td className="px-4 py-2 font-medium">{l.company}</td>
                <td className="px-4 py-2">{l.stage || "Nieuw"}</td>
                <td className="px-4 py-2">{l.created_at ? new Date(l.created_at).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </>
        }
      />
    </div>
  );
}
