import { useEffect, useMemo, useState } from "react";
import { collection, addDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import DataTable from "../../components/DataTable";

type Activity = {
  id?: string;
  type: "call"|"meet"|"email"|"note";
  subject?: string;
  note?: string;
  ref?: string;        // bv. lead-id of organisatie
  at: number;          // datum/tijd (ms)
  created_by: string;  // uid
};

export default function Activities(){
  const [rows,setRows]=useState<Activity[]>([]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState("");
  const [type,setType]=useState<Activity["type"]>("note");
  const [subject,setSubject]=useState("");
  const [note,setNote]=useState("");
  const [refId,setRefId]=useState("");

  useEffect(()=>{
    const qy = query(collection(db,"activities"), orderBy("at","desc"));
    const off = onSnapshot(qy, s=>{
      setRows(s.docs.map(d=>({id:d.id, ...(d.data() as any)})));
      setLoading(false);
    });
    return ()=>off();
  },[]);

  const filtered = useMemo(()=> rows.filter(r=>{
    const hay = `${r.type} ${r.subject||""} ${r.note||""} ${r.ref||""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }),[rows,q]);

  async function save(e:React.FormEvent){
    e.preventDefault();
    await addDoc(collection(db,"activities"),{
      type, subject, note, ref: refId || "",
      at: Date.now(),
      created_by: auth.currentUser?.uid || "unknown"
    });
    setSubject(""); setNote(""); setRefId("");
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activities</h1>
      </header>

      <form onSubmit={save} className="bg-white border rounded-2xl p-4 grid md:grid-cols-5 gap-3">
        <select value={type} onChange={e=>setType(e.target.value as Activity["type"])} className="border rounded-lg px-3 py-2">
          <option value="note">Note</option><option value="call">Call</option>
          <option value="email">Email</option><option value="meet">Meeting</option>
        </select>
        <input className="border rounded-lg px-3 py-2 md:col-span-2" placeholder="Subject" value={subject} onChange={e=>setSubject(e.target.value)} />
        <input className="border rounded-lg px-3 py-2" placeholder="Ref (lead/org)" value={refId} onChange={e=>setRefId(e.target.value)} />
        <button className="rounded-xl bg-brand text-white px-4 py-2 font-semibold">Log</button>
        <textarea className="border rounded-lg px-3 py-2 md:col-span-5" rows={3} placeholder="Notes…" value={note} onChange={e=>setNote(e.target.value)} />
      </form>

      <div className="flex items-center gap-2">
        <input className="border rounded-lg px-3 py-2 min-w-[260px]" placeholder="Zoek in activities…" value={q} onChange={e=>setQ(e.target.value)} />
        <span className="text-sm text-slate-500">{filtered.length} items</span>
      </div>

      <DataTable
        head={
          <tr>
            <th className="text-left px-4 py-2">Type</th>
            <th className="text-left px-4 py-2">Subject</th>
            <th className="text-left px-4 py-2">Ref</th>
            <th className="text-left px-4 py-2">Wanneer</th>
            <th className="text-left px-4 py-2">Notes</th>
          </tr>
        }
        rows={
          <>
            {loading && <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={5}>Laden…</td></tr>}
            {!loading && filtered.length===0 && <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={5}>Geen resultaten</td></tr>}
            {filtered.map(r=>(
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{r.type}</td>
                <td className="px-4 py-2">{r.subject || "—"}</td>
                <td className="px-4 py-2">{r.ref || "—"}</td>
                <td className="px-4 py-2">{new Date(r.at).toLocaleString()}</td>
                <td className="px-4 py-2">{r.note || "—"}</td>
              </tr>
            ))}
          </>
        }
      />
    </div>
  );
}
