"use client";

import { useEffect, useState } from "react";
import UzbekDatePicker from "@/components/UzbekDatePicker";

type Expense = { id: string; title: string; amount: number; currency: string; category: string; description?: string; date: string; };

const CATS: Record<string, { label: string; icon: string; color: string }> = {
  RENT:      { label:"Rent",       icon:"🏢", color:"var(--primary, #6366f1)" },
  SALARIES:  { label:"Salaries",   icon:"👥", color:"#10b981" },
  UTILITIES: { label:"Utilities",  icon:"⚡", color:"#f59e0b" },
  MARKETING: { label:"Marketing",  icon:"📣", color:"#ec4899" },
  SUPPLIES:  { label:"Supplies",   icon:"📦", color:"#8b5cf6" },
  EQUIPMENT: { label:"Equipment",  icon:"💻", color:"#06b6d4" },
  OTHER:     { label:"Other",      icon:"📌", color:"#64748b" },
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title:"", amount:"", category:"OTHER", description:"", date: new Date().toISOString().slice(0,10) });
  const [saving, setSaving] = useState(false);
  const [catFilter, setCatFilter] = useState("ALL");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/expenses");
    if (res.ok) setExpenses(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/admin/expenses", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    if (res.ok) { setShowForm(false); setForm({ title:"", amount:"", category:"OTHER", description:"", date: new Date().toISOString().slice(0,10) }); await load(); }
    setSaving(false);
  }

  const filtered = catFilter === "ALL" ? expenses : expenses.filter(e => e.category === catFilter);
  const total = filtered.reduce((s,e) => s+e.amount, 0);

  // Group by category for chart
  const catTotals = Object.keys(CATS).map(k => ({ key:k, ...CATS[k], total: expenses.filter(e=>e.category===k).reduce((s,e)=>s+e.amount,0) })).filter(c=>c.total>0).sort((a,b)=>b.total-a.total);
  const maxTotal = catTotals[0]?.total || 1;

  return (
    <div style={{ padding:"2rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:"2rem" }}>
        <div>
          <h1 style={{ fontSize:"1.75rem", fontWeight:"700", color:"#1e293b", margin:"0 0 0.25rem" }}>💸 Expenses</h1>
          <p style={{ color:"#64748b", margin:0 }}>Track all operational costs</p>
        </div>
        <button onClick={() => { setForm({ title:"", amount:"", category:"OTHER", description:"", date: new Date().toISOString().slice(0,10) }); setShowForm(true); }} style={{ background:"var(--primary-gradient, linear-gradient(135deg,#6366f1,#8b5cf6))", color:"white", border:"none", borderRadius:"0.5rem", padding:"0.625rem 1.25rem", fontWeight:"600", cursor:"pointer", fontSize:"0.875rem" }}>
          + Add Expense
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"2fr 1fr", gap:"1.5rem", marginBottom:"1.5rem" }}>
        {/* Summary stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem" }}>
          {[
            { label:"Total Expenses", value:`${expenses.reduce((s,e)=>s+e.amount,0).toLocaleString()} UZS`, icon:"💸", color:"#ef4444", bg:"#fee2e2" },
            { label:"This Month", value:`${expenses.filter(e=>{ const d=new Date(e.date); const n=new Date(); return d.getUTCMonth()===n.getUTCMonth()&&d.getUTCFullYear()===n.getUTCFullYear(); }).reduce((s,e)=>s+e.amount,0).toLocaleString()} UZS`, icon:"📅", color:"#f59e0b", bg:"#fef3c7" },
            { label:"Records", value:expenses.length, icon:"📋", color:"var(--primary, #6366f1)", bg:"var(--primary-light, #ede9fe)" },
          ].map(s => (
            <div key={s.label} className="card" style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
              <div style={{ width:44,height:44,borderRadius:10,background:s.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem",flexShrink:0 }}>{s.icon}</div>
              <div>
                <div style={{ fontWeight:"700", color:s.color, fontSize:"1.1rem" }}>{s.value}</div>
                <div style={{ fontSize:"0.75rem", color:"#64748b" }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Category breakdown */}
        <div className="card">
          <h3 style={{ fontSize:"0.9rem", fontWeight:"600", color:"#1e293b", marginBottom:"0.75rem" }}>By Category</h3>
          {catTotals.slice(0,5).map(c => (
            <div key={c.key} style={{ marginBottom:"0.5rem" }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"2px", fontSize:"0.75rem" }}>
                <span>{c.icon} {c.label}</span>
                <span style={{ fontWeight:"600", color:c.color }}>{c.total.toLocaleString()}</span>
              </div>
              <div style={{ height:6, background:"#f1f5f9", borderRadius:3, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(c.total/maxTotal)*100}%`, background:c.color, borderRadius:3 }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category filter tabs */}
      <div style={{ display:"flex", gap:"0.5rem", marginBottom:"1rem", flexWrap:"wrap" }}>
        {["ALL",...Object.keys(CATS)].map(k => (
          <button key={k} onClick={() => setCatFilter(k)} style={{ padding:"0.375rem 0.875rem", borderRadius:"9999px", border:"2px solid", borderColor: catFilter===k ? "var(--primary, #6366f1)":"#e2e8f0", background: catFilter===k?"var(--primary, #6366f1)":"white", color: catFilter===k?"white":"#475569", fontSize:"0.8rem", fontWeight:"600", cursor:"pointer" }}>
            {k==="ALL" ? "All" : `${CATS[k].icon} ${CATS[k].label}`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card" style={{ padding:0, overflow:"hidden" }}>
        {loading ? <div style={{ padding:"3rem", textAlign:"center", color:"#94a3b8" }}>Loading...</div>
          : filtered.length === 0 ? (
            <div style={{ padding:"3rem", textAlign:"center", color:"#94a3b8" }}>
              <div style={{ fontSize:"2.5rem", marginBottom:"0.5rem" }}>💸</div>
              <div style={{ fontWeight:"600" }}>No expenses recorded</div>
            </div>
          ) : (
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr style={{ background:"#f8fafc" }}>
                {["Date","Title","Category","Description","Amount"].map(h=>(
                  <th key={h} style={{ padding:"0.75rem 1rem", textAlign:"left", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", textTransform:"uppercase", borderBottom:"1px solid #e2e8f0" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e,i) => {
                const cat = CATS[e.category] || CATS.OTHER;
                return (
                  <tr key={e.id} style={{ borderBottom:"1px solid #f1f5f9", background:i%2===0?"white":"#fafafa" }}>
                    <td style={{ padding:"0.875rem 1rem", fontSize:"0.875rem", color:"#64748b" }}>{new Date(e.date).toLocaleDateString()}</td>
                    <td style={{ padding:"0.875rem 1rem", fontWeight:"600", color:"#1e293b" }}>{e.title}</td>
                    <td style={{ padding:"0.875rem 1rem" }}>
                      <span style={{ padding:"0.25rem 0.625rem", borderRadius:"9999px", fontSize:"0.75rem", fontWeight:"600", background:`${cat.color}20`, color:cat.color }}>
                        {cat.icon} {cat.label}
                      </span>
                    </td>
                    <td style={{ padding:"0.875rem 1rem", fontSize:"0.875rem", color:"#64748b" }}>{e.description || "—"}</td>
                    <td style={{ padding:"0.875rem 1rem", fontWeight:"700", color:"#dc2626" }}>{e.amount.toLocaleString()} {e.currency}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ background:"#f8fafc", borderTop:"2px solid #e2e8f0" }}>
                <td colSpan={4} style={{ padding:"0.75rem 1rem", fontWeight:"700", color:"#1e293b" }}>Total ({filtered.length} records)</td>
                <td style={{ padding:"0.75rem 1rem", fontWeight:"700", color:"#dc2626", fontSize:"1rem" }}>{total.toLocaleString()} UZS</td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>

      {/* Add Expense Modal */}
      {showForm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:"1rem" }}>
          <div style={{ background:"white", borderRadius:"1rem", padding:"2rem", width:"100%", maxWidth:"460px" }}>
            <h2 style={{ fontSize:"1.25rem", fontWeight:"700", color:"#1e293b", marginBottom:"1.5rem" }}>💸 Add Expense</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom:"1rem" }}>
                <label className="label">Title *</label>
                <input className="input" required value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="e.g. Rent for October" />
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"1rem", marginBottom:"1rem" }}>
                <div>
                  <label className="label">Amount (UZS) *</label>
                  <input className="input" required type="number" min="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} />
                </div>
                <div>
                  <label className="label">Category</label>
                  <select className="input" value={form.category} onChange={e=>setForm({...form,category:e.target.value})}>
                    {Object.entries(CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom:"1rem" }}>
                <label className="label">Date</label>
                <UzbekDatePicker dateOnly value={form.date} onChange={v => setForm({...form, date: v})} placeholder="Sana..." />
              </div>
              <div style={{ marginBottom:"1.5rem" }}>
                <label className="label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={{ resize:"vertical" }} />
              </div>
              <div style={{ display:"flex", gap:"0.75rem" }}>
                <button type="submit" disabled={saving} style={{ flex:1, padding:"0.75rem", background:"var(--primary-gradient, linear-gradient(135deg,#6366f1,#8b5cf6))", color:"white", border:"none", borderRadius:"0.5rem", fontWeight:"600", cursor: saving?"not-allowed":"pointer" }}>
                  {saving ? "Saving..." : "Save Expense"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{ flex:1, padding:"0.75rem", background:"#f1f5f9", color:"#475569", border:"none", borderRadius:"0.5rem", fontWeight:"600", cursor:"pointer" }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
