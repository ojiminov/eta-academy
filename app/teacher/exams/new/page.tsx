"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function NewExamPage() {
  const router = useRouter();
  const [groups, setGroups] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({ groupId:"", title:"", description:"", scheduledAt:"", duration:"", maxScore:"100" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { fetch("/api/teacher/groups").then(r=>r.json()).then(setGroups); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setSaving(true);
    const res = await fetch("/api/teacher/exams", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    if (res.ok) { router.push("/teacher/exams"); }
    else { const d = await res.json(); setError(d.error || "Failed"); }
    setSaving(false);
  }

  return (
    <div style={{ padding:"2rem", maxWidth:"580px" }}>
      <button onClick={() => router.back()} style={{ background:"none", border:"none", color:"var(--primary, #6366f1)", cursor:"pointer", fontWeight:"600", fontSize:"0.875rem", padding:0, marginBottom:"1rem" }}>← Back</button>
      <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 1.5rem" }}>🧪 Schedule Exam</h1>
      <div className="card">
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:"1rem" }}>
            <label className="label">Group *</label>
            <select className="input" required value={form.groupId} onChange={e=>setForm({...form,groupId:e.target.value})}>
              <option value="">Select group...</option>
              {groups.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div style={{ marginBottom:"1rem" }}>
            <label className="label">Exam Title *</label>
            <input className="input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Mid-term Exam" />
          </div>
          <div style={{ marginBottom:"1rem" }}>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{ resize:"vertical" }} />
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr 1fr", gap:"1rem", marginBottom:"1.5rem" }}>
            <div>
              <label className="label">Date & Time *</label>
              <input className="input" required type="datetime-local" value={form.scheduledAt} onChange={e=>setForm({...form,scheduledAt:e.target.value})} />
            </div>
            <div>
              <label className="label">Duration (min)</label>
              <input className="input" type="number" min="10" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})} placeholder="60" />
            </div>
            <div>
              <label className="label">Max Score</label>
              <input className="input" type="number" min="1" value={form.maxScore} onChange={e=>setForm({...form,maxScore:e.target.value})} />
            </div>
          </div>
          {error && <div style={{ background:"#fee2e2", color:"#991b1b", padding:"0.75rem", borderRadius:"0.5rem", marginBottom:"1rem", fontSize:"0.875rem" }}>{error}</div>}
          <div style={{ display:"flex", gap:"0.75rem" }}>
            <button type="submit" disabled={saving} style={{ flex:1, padding:"0.75rem", background:"var(--primary-gradient, linear-gradient(135deg,#6366f1,#8b5cf6))", color:"white", border:"none", borderRadius:"0.5rem", fontWeight:"600", cursor:saving?"not-allowed":"pointer" }}>
              {saving ? "Scheduling..." : "Schedule Exam"}
            </button>
            <button type="button" onClick={()=>router.back()} style={{ flex:1, padding:"0.75rem", background:"#f1f5f9", color:"#475569", border:"none", borderRadius:"0.5rem", fontWeight:"600", cursor:"pointer" }}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
