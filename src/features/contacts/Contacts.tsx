import { useEffect, useMemo, useState } from "react";
import { collection, addDoc, onSnapshot, orderBy, query, doc, updateDoc } from "firebase/firestore";
import { db, auth } from "../../lib/firebase";
import DataTable from "../../components/DataTable";
import { canEdit, useRoles } from "../../lib/roles";

type Contact = {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  org?: string;
  role?: string;
  country?: string;
  notes?: string;
  ownerUid?: string;
  created_at?: number;
  updated_at?: number;
};

export default function Contacts(){
  const [rows,setRows]=useState<Contact[]>([]);
  const [loading,setLoading]=useState(true);
  const [q,setQ]=useState("");
  const [showPII,setShowPII]=useState<boolean>(()=>localStorage.getItem("pii")==="1");
  const [open,setOpen]=useState(false);
  const [err,setErr]=useState<string>("");
  const roles = useRoles(auth.currentUser);

  useEffect(()=>{
    try{
      const qy = query(collection(db,"contacts"), orderBy("created_at","desc"));
      const off = onSnapshot(qy,
        s => { setRows(s.docs.map(d=>({id:d.id, ...(d.data() as any)}))); setLoading(false); },
        e => { console.error("CONTACTS SNAPSHOT ERROR", e); setErr(e?.message || "Leesrechten ontbreken"); setLoading(false); }
      );
      return ()=>off();
    }catch(e:any){
      console.error("CONTACTS INIT ERROR", e);
      setErr(e?.message || "Er ging iets mis"); setLoading(false);
    }
  },[]);

  useEffect(()=>{ localStorage.setItem("pii", showPII?"1":"0"); },[showPII]);

  const filtered = useMemo(()=> rows.filter(r=>{
    const hay = `${r.name||""} ${r.org||""} ${r.email||""}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  }),[rows,q]);

  if (err) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Contacts</h1>
        <div className="p-4 rounded-xl border bg-white text-sm">
          <div className="font-semibold mb-1">Kan contacts niet laden</div>
          <div className="text-red-600">{err}</div>
          <div className="text-slate-600 mt-2">
            Tip: zorg dat je rol <code>rm</code>, <code>lead</code> of <code>admin</code> <b>true</b> is in <code>roles/&lt;UID&gt;</code>.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Contacts</h1>
        {canEdit(roles) && (
          <button onClick={()=>setOpen(true)} className="rounded-xl bg-brand text-white px-4 py-2 font-semibold">+ Nieuw contact</button>
        )}
      </header>

      <div className="flex gap-3 items-center flex-wrap">
        <input className="border rounded-lg px-3 py-2 min-w-[260px]" placeholder="Zoek naam / org / email"
               value={q} onChange={(e)=>setQ(e.target.value)} />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="rounded" checked={showPII} onChange={(e)=>setShowPII(e.target.checked)} />
          Toon PII (email/phone)
        </label>
        <span className="text-sm text-slate-500">{filtered.length} items</span>
      </div>

      <DataTable
        head={
          <tr>
            <th className="text-left px-4 py-2">Naam</th>
            <th className="text-left px-4 py-2">Organisatie</th>
            <th className="text-left px-4 py-2">Rol</th>
            {showPII && <th className="text-left px-4 py-2">Email</th>}
            {showPII && <th className="text-left px-4 py-2">Phone</th>}
            <th className="text-left px-4 py-2">Country</th>
            <th className="text-left px-4 py-2">Notes</th>
            <th className="text-left px-4 py-2">Acties</th>
          </tr>
        }
        rows={
          <>
            {loading && <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={8}>Laden…</td></tr>}
            {!loading && filtered.length===0 && <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={8}>Geen resultaten</td></tr>}
            {filtered.map(r=> <Row key={r.id} row={r} showPII={showPII} />)}
          </>
        }
      />

      {open && <NewContact onClose={()=>setOpen(false)} />}
    </div>
  );
}

function Row({row, showPII}:{row:Contact; showPII:boolean;}){
  async function quickNote(){
    const note = prompt("Notitie toevoegen:", row.notes || "");
    if(!row.id || note===null) return;
    await updateDoc(doc(db,"contacts",row.id), { notes: note, updated_at: Date.now() });
  }
  return (
    <tr className="border-t">
      <td className="px-4 py-2 font-medium">{row.name}</td>
      <td className="px-4 py-2">{row.org || "—"}</td>
      <td className="px-4 py-2">{row.role || "—"}</td>
      {showPII && <td className="px-4 py-2">{row.email || "—"}</td>}
      {showPII && <td className="px-4 py-2">{row.phone || "—"}</td>}
      <td className="px-4 py-2">{row.country || "—"}</td>
      <td className="px-4 py-2">
        {row.notes ? (
          <span title={row.notes}>
            {row.notes.slice(0,60)}{row.notes.length>60 ? "…" : ""}
            {row.updated_at && (
              <span className="ml-2 text-xs text-slate-500">
                ({new Date(row.updated_at).toLocaleDateString()})
              </span>
            )}
          </span>
        ) : "—"}
      </td>
      <td className="px-4 py-2">
        <button onClick={quickNote} className="px-3 py-1 rounded border text-xs hover:bg-slate-50">Note</button>
      </td>
    </tr>
  );
}

function NewContact({onClose}:{onClose:()=>void}){
  const [name,setName]=useState(""); const [org,setOrg]=useState("");
  const [email,setEmail]=useState(""); const [phone,setPhone]=useState("");
  const [role,setRole]=useState(""); const [country,setCountry]=useState("");
  const [notes,setNotes]=useState(""); const [saving,setSaving]=useState(false);
  async function save(e:React.FormEvent){
    e.preventDefault(); if(!name) return;
    setSaving(true);
    await addDoc(collection(db,"contacts"),{
      name, org, role, country, email, phone: phone||"", notes,
      ownerUid: auth.currentUser?.uid || "unknown",
      created_at: Date.now(), updated_at: Date.now()
    });
    setSaving(false); onClose();
  }
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">Nieuw contact</h2>
            <button onClick={onClose}>✕</button>
          </div>
          <form onSubmit={save} className="p-5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-slate-500 mb-1">Naam *</label>
                <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required/></div>
              <div><label className="block text-sm text-slate-500 mb-1">Organisatie</label>
                <input className="w-full border rounded-lg px-3 py-2" value={org} onChange={e=>setOrg(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-slate-500 mb-1">Rol</label>
                <input className="w-full border rounded-lg px-3 py-2" value={role} onChange={e=>setRole(e.target.value)} /></div>
              <div><label className="block text-sm text-slate-500 mb-1">Land</label>
                <input className="w-full border rounded-lg px-3 py-2" value={country} onChange={e=>setCountry(e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm text-slate-500 mb-1">Email</label>
                <input className="w-full border rounded-lg px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} /></div>
              <div><label className="block text-sm text-slate-500 mb-1">Phone</label>
                <input className="w-full border rounded-lg px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} /></div>
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Notes</label>
              <textarea className="w-full border rounded-lg px-3 py-2" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border">Annuleren</button>
              <button disabled={saving} className="px-4 py-2 rounded-lg bg-brand text-white font-semibold">{saving ? "Opslaan…" : "Opslaan"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
