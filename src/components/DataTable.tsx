import { ReactNode } from "react";

export default function DataTable({head, rows}:{head:ReactNode; rows:ReactNode;}){
  return (
    <div className="overflow-auto rounded-2xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-slate-600">{head}</thead>
        <tbody>{rows}</tbody>
      </table>
    </div>
  );
}
