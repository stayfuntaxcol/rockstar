import { onSnapshot, doc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { db } from "./firebase";
import type { User } from "firebase/auth";

export type Roles = { admin?:boolean; lead?:boolean; rm?:boolean; viewer?:boolean } | null;

export function useRoles(user: User | null): Roles {
  const [roles, setRoles] = useState<Roles>(null);
  useEffect(() => {
    if (!user) { setRoles(null); return; }
    const ref = doc(db, 'roles', user.uid);
    const off = onSnapshot(ref, (s) => setRoles((s.data() as any) || {}), ()=>setRoles({}));
    return () => off();
  }, [user]);
  return roles;
}

export function canEdit(roles: Roles){ return !!(roles?.admin || roles?.lead || roles?.rm); }
