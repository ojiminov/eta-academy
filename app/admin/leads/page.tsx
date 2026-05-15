"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Lead = {
  id: string; firstName: string; lastName: string; phone: string; email?: string;
  source: string; status: string; interestedLevel?: string; trialDate?: string;
  notes?: string; createdAt: string;
};

const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
  LEAD:     { bg: "#e0e7ff", color: "#3730a3" },
  TRIAL:    { bg: "#fef3c7", color: "#92400e" },
  ACTIVE:   { bg: "#d1fae5", color: "#065f46" },
  GRADUATE: { bg: "#dbeafe", color: "#1e40af" },
  INACTIVE: { bg: "#f1f5f9", color: "#475569" },
};
const STATUS_LABELS: Record<string, string> = {
  LEAD:"Lead", TRIAL:"Trial", ACTIVE:"Active", GRADUATE:"Graduate", INACTIVE:"Inactive"
};
const SOURCE_LABELS: Record<string, string> = {
  INSTAGRAM:"Instagram", TELEGRAM:"Telegram", FACEBOOK:"Facebook",
  REFERRAL:"Referral", WALK_IN:"Walk-in", WEBSITE:"Website", OTHER:"Other"
};
const SOURCE_ICONS: Record<string, string> = {
  INSTAGRAM:"📷", TELEGRAM:"✈️", FACEBOOK:"👥",
  REFERRAL:"🤝", WALK_IN:"🚶", WEBSITE:"🌐", OTHER:"📌"
};
const LEVEL_LABELS: Record<string, string> = {
  BEGINNER:"Beginner", ELEMENTARY:"Elementary", PRE_INTERMEDIATE:"Pre-Int",
  INTERMEDIATE:"Intermediate", UPPER_INTERMEDIATE:"Upper-Int", ADVANCED:"Advanced"
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ firstName:"", lastName:"", phone:"", email:"", source:"OTHER", status:"LEAD", interestedLevel:"", trialDate:"", notes:"" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/leads");
    if (res.ok) setLeads(await res.json());
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) { setShowForm(false); setForm({ firstName:"", lastName:"", phone:"", email:"", source:"OTHER", status:"LEAD", interestedLevel:"", trialDate:"", notes:"" }); await load(); }
    setSaving(false);
  }

  async function updateStatus(id: string, status: string) {
    await fetch("/api/admin/leads", { method:"PATCH", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ id, status }) });
    await load();
  }

  const filtered = statusFilter === "ALL" ? leads : leads.filter(l => l.status === statusFilter);

  const counts: Record<string, number> = {};
  leads.forEach(l => { counts[l.status] = (counts[l.status] || 0) + 1; });

  return (
    <div style={{ padding: "2rem" }}>
      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"2rem" }}>
        <div>
          <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>🎯 Leads & Sales Funnel</h1>
          <p style={{ color:"#64748b", margin:0 }}>{leads.length} total leads in pipeline</p>
        </div>
        <button onClick={() => setShowForm(true)} style={{ background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", border:"none", borderRadius:"0.5rem", padding:"0.625rem 1.25rem", fontWeight:"600", cursor:"pointer", fontSize:"0.875rem" }}>
          + New Lead
        </button>
      </div>

      {/* Kanban status summary */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:"1rem", marginBottom:"1.5rem" }}>
        {["ALL","LEAD","TRIAL","ACTIVE","GRADUATE"].map(s => {
          const col = s === "ALL" ? { bg:"#f1f5f9", color:"#1e293b" } : STATUS_COLORS[s];
          const cnt = s === "ALL" ? leads.length : (counts[s] || 0);
          return (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding:"1rem", borderRadius:"0.75rem", border: statusFilter===s ? "2px solid #6366f1" : "2px solid transparent",
              background: col.bg, cursor:"pointer", textAlign:"center"
            }}>
              <div style={{ fontSize:"1.5rem", fontWeight:"700", color: col.color }}>{cnt}</div>
              <div style={{ fontSize:"0.75rem", fontWeight:"600", color: col.color, textTransform:"uppercase", letterSpacing:"0.05em" }}>
                {s === "ALL" ? "All" : STATUS_LABELS[s]}
              </div>
            </button>
          );
        })}
      </div>

      {/* Leads table */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        {loading ? (
          <div style={{ padding:"3rem", textAlign:"center", color:"#94a3b8" }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding:"3rem", textAlign:"center", color:"#94a3b8" }}>
            <div style={{ fontSize:"2.5rem", marginBottom:"0.75rem" }}>🎯</div>
            <div style={{ fontWeight:"600" }}>No leads yet</div>
            <div style={{ fontSize:"0.875rem" }}>Add your first potential student to the pipeline</div>
          </div>
        ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Name","Phone","Source","Level","Trial Date","Status","Actions"].map(h => (
                  <th key={h} style={{ padding:"0.75rem 1rem", textAlign:"left", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", textTransform:"uppercase", borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead, i) => {
                const sc = STATUS_COLORS[lead.status] || { bg:"#f1f5f9", color:"#475569" };
                return (
                  <tr key={lead.id} style={{ borderBottom:"1px solid #f1f5f9", background: i%2===0 ? "white" : "#fafafa" }}>
                    <td style={{ padding:"0.875rem 1rem" }}>
                      <div style={{ fontWeight:"600", color:"#1e293b" }}>{lead.firstName} {lead.lastName}</div>
                      {lead.email && <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{lead.email}</div>}
                    </td>
                    <td style={{ padding:"0.875rem 1rem", color:"#475569", fontSize:"0.875rem" }}>{lead.phone}</td>
                    <td style={{ padding:"0.875rem 1rem" }}>
                      <span style={{ fontSize:"0.875rem" }}>{SOURCE_ICONS[lead.source]} {SOURCE_LABELS[lead.source]}</span>
                    </td>
                    <td style={{ padding:"0.875rem 1rem", color:"#475569", fontSize:"0.875rem" }}>
                      {lead.interestedLevel ? LEVEL_LABELS[lead.interestedLevel] : "—"}
                    </td>
                    <td style={{ padding:"0.875rem 1rem", color:"#475569", fontSize:"0.875rem" }}>
                      {lead.trialDate ? new Date(lead.trialDate).toLocaleDateString() : "—"}
                    </td>
                    <td style={{ padding:"0.875rem 1rem" }}>
                      <select value={lead.status} onChange={e => updateStatus(lead.id, e.target.value)}
                        style={{ padding:"0.25rem 0.5rem", borderRadius:"0.375rem", border:"none", background:sc.bg, color:sc.color, fontSize:"0.75rem", fontWeight:"700", cursor:"pointer" }}>
                        {Object.keys(STATUS_LABELS).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                      </select>
                    </td>
                    <td style={{ padding:"0.875rem 1rem" }}>
                      {lead.status !== "ACTIVE" && lead.status !== "GRADUATE" && (
                        <button onClick={() => updateStatus(lead.id, "ACTIVE")}
                          style={{ fontSize:"0.7rem", padding:"0.25rem 0.5rem", background:"#d1fae5", color:"#065f46", border:"none", borderRadius:"0.25rem", cursor:"pointer", fontWeight:"600" }}>
                          → Enroll
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Lead Modal */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:"1rem", padding:"2rem", width:"100%", maxWidth:"520px", maxHeight:"90vh", overflowY:"auto" }}>
            <h2 style={{ fontSize:"1.25rem", fontWeight:"700", color:"#1e293b", marginBottom:"1.5rem" }}>🎯 New Lead</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
                <div>
                  <label className="label">First Name *</label>
                  <input className="input" required value={form.firstName} onChange={e=>setForm({...form,firstName:e.target.value})} />
                </div>
                <div>
                  <label className="label">Last Name *</label>
                  <input className="input" required value={form.lastName} onChange={e=>setForm({...form,lastName:e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom:"1rem" }}>
                <label className="label">Phone *</label>
                <input className="input" required value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} placeholder="+998 90 000 00 00" />
              </div>
              <div style={{ marginBottom:"1rem" }}>
                <label className="label">Email</label>
                <input className="input" type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
                <div>
                  <label className="label">Source</label>
                  <select className="input" value={form.source} onChange={e=>setForm({...form,source:e.target.value})}>
                    {Object.entries(SOURCE_LABELS).map(([k,v]) => <option key={k} value={k}>{SOURCE_ICONS[k]} {v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={e=>setForm({...form,status:e.target.value})}>
                    {Object.entries(STATUS_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
                <div>
                  <label className="label">Interested Level</label>
                  <select className="input" value={form.interestedLevel} onChange={e=>setForm({...form,interestedLevel:e.target.value})}>
                    <option value="">— Any —</option>
                    {Object.entries(LEVEL_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Trial Date</label>
                  <input className="input" type="date" value={form.trialDate} onChange={e=>setForm({...form,trialDate:e.target.value})} />
                </div>
              </div>
              <div style={{ marginBottom:"1.5rem" }}>
                <label className="label">Notes</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} style={{ resize:"vertical" }} />
              </div>
              <div style={{ display:"flex", gap:"0.75rem" }}>
                <button type="submit" disabled={saving} style={{ flex:1, padding:"0.75rem", background:"linear-gradient(135deg,#6366f1,#8b5cf6)", color:"white", border:"none", borderRadius:"0.5rem", fontWeight:"600", cursor: saving ? "not-allowed":"pointer" }}>
                  {saving ? "Saving..." : "Add Lead"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex:1, padding:"0.75rem", background:"#f1f5f9", color:"#475569", border:"none", borderRadius:"0.5rem", fontWeight:"600", cursor:"pointer" }}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
