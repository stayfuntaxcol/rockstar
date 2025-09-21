import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../../lib/firebase";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, orderBy, query, serverTimestamp, where, getDoc, limit, getDocs
} from "firebase/firestore";

type Roles = { viewer?: boolean; rm?: boolean; lead?: boolean; admin?: boolean; };
type Lead = {
  id?: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  stage?: string;
  notes?: string | null;
  consent?: boolean;
  created_at?: any;
  created_by?: string | null;
  ttl_at?: any;
};

export default function Pipeline(){
  const [roles, setRoles] = useState<Roles>({});
  const [rows, setRows] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [stageFilter, setStageFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  // form state
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [stage, setStage] = useState("Nieuw");
  const [notes, setNotes] = useState("");
  const [consent, setConsent] = useState(false);
  const [saving, setSaving] = useState(false);

  const me = auth.currentUser;

  // load roles of current user; bootstrap minimal roles on first time
  useEffect(() => {
    async function loadRoles() {
      if (!auth.currentUser) return;
      try {
        const rref = doc(db, "roles", auth.currentUser.uid);
        const snap = await getDoc(rref);
        if (!snap.exists()) {
          // bootstrap: geef viewer+rm zodat je kunt lezen/schrijven zonder PII
          await (await import("firebase/firestore")).setDoc(rref, { viewer: true, rm: true }, { merge: true });
          setRoles({ viewer: true, rm: true });
        } else {
          setRoles(snap.data() as Roles);
        }
      } catch (e) {
        console.warn("roles load failed", e);
      }
    }
    loadRoles();
  }, [auth.currentUser?.uid]);

  // live query (met fallback zonder orderBy als index ontbreekt)
  useEffect(() => {
    const col = collection(db, "leads");
    const qy = stageFilter
      ? query(col, where("stage", "==", stageFilter), orderBy("created_at", "desc"), limit(500))
      : query(col, orderBy("created_at", "desc"), limit(500));
    const off = onSnapshot(
      qy,
      s => {
        setRows(s.docs.map(d => ({ id: d.id, ...(d.data() as any) })));
        setLoading(false);
      },
      async _err => {
        // fallback
        const q2 = stageFilter ? query(col, where("stage", "==", stageFilter), limit(500)) : query(col, limit(500));
        const off2 = onSnapshot(q2, s2 => {
          const arr = s2.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          arr.sort((a: any, b: any) => {
            const ta = a.created_at?.toMillis ? a.created_at.toMillis() : (a.created_at ? new Date(a.created_at).getTime() : 0);
            const tb = b.created_at?.toMillis ? b.created_at.toMillis() : (b.created_at ? new Date(b.created_at).getTime() : 0);
            return tb - ta;
          });
          setRows(arr);
          setLoading(false);
        });
        return () => off2();
      }
    );
    return () => off();
  }, [stageFilter]);

  const canWrite = !!(roles.rm || roles.lead || roles.admin);
  const isAdmin = !!roles.admin;

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const base = rows;
    if (!term) return base;
    return base.filter(r =>
      ["name", "company", "email", "phone", "notes"].some(k => (r as any)[k]?.toString().toLowerCase().includes(term))
    );
  }, [rows, q]);

  function resetForm() {
    setEditId(null);
    setName(""); setCompany(""); setEmail(""); setPhone(""); setStage("Nieuw"); setNotes(""); setConsent(false);
  }

  async function onSave(e: React.FormEvent) {
    e.preventDefault(); if (!name.trim()) return;
    if (!canWrite) { alert("Je hebt geen schrijfrechten."); return; }
    setSaving(true);

    try {
      // PII (email/phone) alleen meenemen als consent én lead/admin
      const canPII = !!(roles.lead || roles.admin);
      let emailToSave: string | null = email.trim() ? email.trim() : null;
      let phoneToSave: string | null = phone.trim() ? phone.trim() : null;
      if (!(canPII && consent)) {
        emailToSave = null;
        phoneToSave = null;
      }

      // TTL 24 maanden
      const ttl = new Date(); ttl.setMonth(ttl.getMonth() + 24);

      const payload: Omit<Lead, "id"> = {
        name: name.trim(),
        company: company.trim() || null,
        email: emailToSave,
        phone: phoneToSave,
        stage,
        notes: notes.trim() || null,
        consent: !!consent,
        created_by: me?.uid || null,
        ttl_at: ttl
      };

      if (!editId) {
        await addDoc(collection(db, "leads"), { ...payload, created_at: serverTimestamp() });
      } else {
        const upd: any = { ...payload };
        delete upd.created_at;
        await updateDoc(doc(db, "leads", editId), upd);
      }
      setShowForm(false);
      resetForm();
    } catch (e: any) {
      alert(e?.message || String(e));
    } finally {
      setSaving(false);
    }
  }

  async function onEdit(id: string) {
    const snap = await getDoc(doc(db, "leads", id));
    if (!snap.exists()) { alert("Lead niet gevonden"); return; }
    const r = snap.data() as Lead;
    setEditId(id);
    setName(r.name || "");
    setCompany(r.company || "");
    setEmail(r.email || "");
    setPhone(r.phone || "");
    setStage(r.stage || "Nieuw");
    setNotes(r.notes || "");
    setConsent(!!r.consent);
    setShowForm(true);
  }

  async function onDelete(id: string) {
    if (!isAdmin) return;
    if (!confirm("Verwijderen? Dit kan niet ongedaan worden gemaakt.")) return;
    await deleteDoc(doc(db, "leads", id));
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        <div className="flex gap-2 items-center">
          <input className="border rounded-lg px-3 py-2 min-w-[260px]" placeholder="Zoek (naam, email, bedrijf, notities)…"
                 value={q} onChange={e => setQ(e.target.value)} />
          <select className="border rounded-lg px-3 py-2" value={stageFilter} onChange={e => setStageFilter(e.target.value)}>
            <option value="">Alle fases</option>
            <option>Nieuw</option><option>Contact</option><option>Kwalificatie</option>
            <option>Offerte</option><option>Winst</option><option>Verloren</option>
          </select>
          {canWrite && (
            <button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-lg bg-brand text-white px-4 py-2 font-semibold">
              + Nieuwe lead
            </button>
          )}
        </div>
      </header>

      {showForm && (
        <div className="bg-white border rounded-xl shadow p-4">
          <h2 className="text-lg font-medium mb-3">{editId ? "Lead bewerken" : "Nieuwe lead"}</h2>
          <form onSubmit={onSave} className="grid md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Naam *</label>
              <input className="w-full border rounded-lg px-3 py-2" value={name} onChange={e=>setName(e.target.value)} required/>
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Bedrijf</label>
              <input className="w-full border rounded-lg px-3 py-2" value={company} onChange={e=>setCompany(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Email</label>
              <input className="w-full border rounded-lg px-3 py-2" type="email" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Telefoon</label>
              <input className="w-full border rounded-lg px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Fase</label>
              <select className="w-full border rounded-lg px-3 py-2" value={stage} onChange={e=>setStage(e.target.value)}>
                <option>Nieuw</option><option>Contact</option><option>Kwalificatie</option>
                <option>Offerte</option><option>Winst</option><option>Verloren</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input id="consent" type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)} />
              <label htmlFor="consent" className="text-sm">Toestemming voor contact (AVG)</label>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-slate-500 mb-1">Notities</label>
              <textarea className="w-full border rounded-lg px-3 py-2" rows={3} value={notes} onChange={e=>setNotes(e.target.value)} />
            </div>
            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              <button type="button" onClick={()=>{ setShowForm(false); resetForm(); }} className="px-4 py-2 rounded-lg border">Annuleren</button>
              <button disabled={saving} className="px-4 py-2 rounded-lg bg-brand text-white font-semibold">{saving ? "Opslaan…" : "Opslaan"}</button>
            </div>
          </form>
          <p className="text-xs text-slate-500 mt-2">PII (email/telefoon) wordt alleen opgeslagen als je toestemming hebt en je rol lead/admin is.</p>
        </div>
      )}

      <div className="bg-white border rounded-xl overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr>
              <th className="text-left px-4 py-2">Aangemaakt</th>
              <th className="text-left px-4 py-2">Naam</th>
              <th className="text-left px-4 py-2">Bedrijf</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Telefoon</th>
              <th className="text-left px-4 py-2">Fase</th>
              <th className="text-left px-4 py-2">Notities</th>
              <th className="text-left px-4 py-2">Acties</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={8}>Laden…</td></tr>}
            {!loading && filtered.length===0 && <tr><td className="px-4 py-6 text-center text-slate-500" colSpan={8}>Geen resultaten</td></tr>}
            {filtered.map(r => (
              <tr key={r.id} className="border-t">
                <td className="px-4 py-2">{fmtDate(r.created_at)}</td>
                <td className="px-4 py-2 font-medium">{r.name}</td>
                <td className="px-4 py-2">{r.company || "—"}</td>
                <td className="px-4 py-2">{r.email || "—"}</td>
                <td className="px-4 py-2">{r.phone || "—"}</td>
                <td className="px-4 py-2">{r.stage || "—"}</td>
                <td className="px-4 py-2">{r.notes || "—"}</td>
                <td className="px-4 py-2 flex gap-2">
                  {canWrite && <button onClick={()=>onEdit(r.id!)} className="px-3 py-1 rounded border text-xs hover:bg-slate-50">Bewerk</button>}
                  {isAdmin && <button onClick={()=>onDelete(r.id!)} className="px-3 py-1 rounded border text-xs text-white bg-red-600">Verwijder</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  function fmtDate(ts:any){
    if (!ts) return "";
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
  }
}
