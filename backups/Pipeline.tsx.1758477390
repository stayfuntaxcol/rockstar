import { useEffect, useMemo, useState } from "react";
import { collection, addDoc, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import { useRoles, canEdit } from "../../lib/roles";

type Lead = {
  id?: string;
  company: string;
  name?: string;
  email?: string;
  phone?: string | null;
  notes?: string;
  stage?: string;
  created_at?: number;
  created_by?: string;
  ownerUid?: string;
};

const STAGES = ["Nieuw","IDENTIFY","MAP","ENGAGE","PROPOSAL","COMMIT"];

export default function Pipeline(){
  const [rows,setRows]=useState<Lead[]>([]);
  const [loading,setLoading]=useState(true);
  const [qStage,setQStage]=useState<string|"ALL">("ALL");
  const [qText,setQText]=useState("");
  const [open,setOpen]=useState(false);
  const roles = useRoles(auth.currentUser);

  useEffect(()=>{
    const qy = query(collection(db,"leads"), orderBy("created_at","desc"));
    const off = onSnapshot(qy, snap=>{
      const data = snap.docs.map(d=>({id:d.id, ...(d.data() as any)})) as Lead[];
      setRows(data); setLoading(false);
    });
    return ()=>off();
  },[]);

  const filtered = useMemo(()=> rows.filter(r=>{
    if(qStage!=="ALL" && (r.stage||"").toUpperCase() !== qStage.toUpperCase()) return false;
    if(qText && !(`${r.company} ${r.name||""} ${r.email||""}`.toLowerCase().includes(qText.toLowerCase()))) return false;
    return true;
  }),[rows,qStage,qText]);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leads</h1>
        {canEdit(roles) && (
          <button onClick={()=>setOpen(true)} className="rounded-xl bg-brand text-white px-4 py-2 font-semibold">
            + Nieuwe lead
          </button>
        )}
      </header>

      <div className="flex flex-wrap gap-2 items-center">
        <select value={qStage} onChange={e=>setQStage(e.target.value)} className="border rounded-lg px-3 py-2">
          <option value="ALL">Alle stages</option>
          {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
        <input value={qText} onChange={e=>setQText(e.target.value)} placeholder="Zoek op company/contact/email…" className="border rounded-lg px-3 py-2 min-w-[280px]" />
        <span className="text-sm text-slate-500">{filtered.length} items</span>
      </div>

      <div className="overflow-auto rounded-2xl border bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="text-left px-4 py-2">Company</th>
              <th className="text-left px-4 py-2">Contact</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Phone</th>
              <th className="text-left px-4 py-2">Stage</th>
              <th className="text-left px-4 py-2">Acties</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={6}>Laden…</td></tr>}
            {!loading && filtered.length===0 && <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={6}>Geen resultaten</td></tr>}
            {filtered.map(r=> <Row key={r.id} row={r} />)}
          </tbody>
        </table>
      </div>

      {open && <NewLead onClose={()=>setOpen(false)} />}
    </div>
  );
}

function Row({row}:{row:Lead}){
  async function setStage(next:string){
    if(!row.id) return;
    await updateDoc(doc(db,"leads",row.id), { stage: next });
  }
  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{row.company}</td>
      <td className="px-4 py-2">{row.name || "—"}</td>
      <td className="px-4 py-2">{row.email || "—"}</td>
      <td className="px-4 py-2">{row.phone || "—"}</td>
      <td className="px-4 py-2">
        <span className="rounded-full bg-slate-100 px-2 py-0.5">{row.stage || "Nieuw"}</span>
      </td>
      <td className="px-4 py-2">
        <div className="flex gap-1 flex-wrap">
          {STAGES.map(s=>(
            <button key={s} onClick={()=>setStage(s)}
              className={"px-2 py-1 rounded border text-xs "+((row.stage||"").toUpperCase()===s.toUpperCase() ? "bg-brand text-white border-brand" : "hover:bg-slate-50")}>
              {s}
            </button>
          ))}
        </div>
      </td>
    </tr>
  );
}

function NewLead({onClose}:{onClose:()=>void}){
  const [company,setCompany]=useState("");
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [phone,setPhone]=useState("");
  const [notes,setNotes]=useState("");
  const [saving,setSaving]=useState(false);
  const user = auth.currentUser;

  async function save(e:React.FormEvent){
    e.preventDefault();
    if(!company) return;
    setSaving(true);
    try{
      await addDoc(collection(db,"leads"),{
        company, name, email, phone: phone||null, notes,
        stage: "Nieuw",
        created_at: Date.now(),
        ownerUid: user?.uid,        // voor rules
        created_by: user?.uid       // voor rules
      });
      onClose();
      setCompany(""); setName(""); setEmail(""); setPhone(""); setNotes("");
    }catch(err:any){
      console.error("ADD LEAD ERROR", err?.code, err?.message);
      alert(`Mislukt: ${err?.code} – ${err?.message}`);
    }finally{
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nieuwe lead</h2>
            <button onClick={onClose}>✕</button>
          </div>
          <form onSubmit={save} className="p-5 space-y-3">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Company *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={company} onChange={e=>setCompany(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-500 mb-1">Contact</label>
                <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Email</label>
                <input className="w-full border rounded-lg px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-slate-500 mb-1">Phone</label>
                <input className="w-full border rounded-lg px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-sm text-slate-500 mb-1">Stage</label>
                <select className="w-full border rounded-lg px-3 py-2" value={"Nieuw"} onChange={()=>{}}>
                  {STAGES.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Notes</label>
              <textarea className="w-full border rounded-lg px-3 py-2" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Annuleren</button>
              <button disabled={saving} className="px-4 py-2 rounded-lg bg-brand text-white font-semibold">
                {saving ? "Opslaan…" : "Opslaan"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
