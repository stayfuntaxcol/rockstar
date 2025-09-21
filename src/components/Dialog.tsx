import { ReactNode } from "react";

export default function Dialog({open, onClose, title, children, actions}:{open:boolean; onClose:()=>void; title:string; children:ReactNode; actions?:ReactNode}){
  if(!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose}></div>
      <div className="absolute inset-0 grid place-items-center p-4">
        <div className="w-full max-w-lg bg-white rounded-2xl shadow-pop">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100" aria-label="Close">✕</button>
          </div>
          <div className="p-5">{children}</div>
          {actions && <div className="px-5 py-4 border-t flex justify-end gap-2">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
