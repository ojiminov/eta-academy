"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CreateParentAccountButton({ studentId, studentName }: { studentId: string; studentName: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phone: "" });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/students/${studentId}/parent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create parent account");
      setOpen(false);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ display:"flex", alignItems:"center", gap:"1rem", padding:"0.75rem 1rem", background:"#f8fafc", borderRadius:"0.75rem", border:"1px dashed #cbd5e1" }}>
        <span style={{ fontSize:"1.5rem" }}>👨‍👩‍👧</span>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:"500", color:"#475569", fontSize:"0.875rem" }}>No parent account linked</div>
          <div style={{ fontSize:"0.75rem", color:"#94a3b8" }}>Create a parent portal account so the family can track {studentName}'s progress</div>
        </div>
        <button
          onClick={() => setOpen(true)}
          style={{ padding:"0.5rem 1rem", background:"var(--primary, #6366f1)", color:"white", border:"none", borderRadius:"0.5rem", cursor:"pointer", fontSize:"0.875rem", fontWeight:"600", whiteSpace:"nowrap" }}
        >
          + Create Account
        </button>
      </div>

      {open && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000 }}>
          <div style={{ background:"white", borderRadius:"1rem", padding:"2rem", width:"100%", maxWidth:"440px", boxShadow:"0 25px 50px rgba(0,0,0,0.15)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
              <h2 style={{ fontSize:"1.125rem", fontWeight:"700", color:"#1e293b", margin:0 }}>Create Parent Account</h2>
              <button onClick={() => setOpen(false)} style={{ background:"none", border:"none", cursor:"pointer", fontSize:"1.25rem", color:"#94a3b8" }}>✕</button>
            </div>
            <p style={{ fontSize:"0.875rem", color:"#64748b", marginBottom:"1.25rem", marginTop:0 }}>
              This will create a login for the parent of <strong>{studentName}</strong>. They'll be able to view attendance, grades, payments, and schedule.
            </p>
            <form onSubmit={handleSubmit}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem", marginBottom:"0.75rem" }}>
                <div>
                  <label style={{ display:"block", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", marginBottom:"0.25rem" }}>First Name *</label>
                  <input required value={form.firstName} onChange={e=>set("firstName",e.target.value)}
                    style={{ width:"100%", padding:"0.5rem 0.75rem", border:"1px solid #e2e8f0", borderRadius:"0.5rem", fontSize:"0.875rem", boxSizing:"border-box" }}
                    placeholder="e.g. Kamola" />
                </div>
                <div>
                  <label style={{ display:"block", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", marginBottom:"0.25rem" }}>Last Name *</label>
                  <input required value={form.lastName} onChange={e=>set("lastName",e.target.value)}
                    style={{ width:"100%", padding:"0.5rem 0.75rem", border:"1px solid #e2e8f0", borderRadius:"0.5rem", fontSize:"0.875rem", boxSizing:"border-box" }}
                    placeholder="e.g. Yusupova" />
                </div>
              </div>
              <div style={{ marginBottom:"0.75rem" }}>
                <label style={{ display:"block", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", marginBottom:"0.25rem" }}>Email Address *</label>
                <input required type="email" value={form.email} onChange={e=>set("email",e.target.value)}
                  style={{ width:"100%", padding:"0.5rem 0.75rem", border:"1px solid #e2e8f0", borderRadius:"0.5rem", fontSize:"0.875rem", boxSizing:"border-box" }}
                  placeholder="parent@example.com" />
              </div>
              <div style={{ marginBottom:"0.75rem" }}>
                <label style={{ display:"block", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", marginBottom:"0.25rem" }}>Phone</label>
                <input value={form.phone} onChange={e=>set("phone",e.target.value)}
                  style={{ width:"100%", padding:"0.5rem 0.75rem", border:"1px solid #e2e8f0", borderRadius:"0.5rem", fontSize:"0.875rem", boxSizing:"border-box" }}
                  placeholder="+998 90 123 4567" />
              </div>
              <div style={{ marginBottom:"1.25rem" }}>
                <label style={{ display:"block", fontSize:"0.75rem", fontWeight:"600", color:"#64748b", marginBottom:"0.25rem" }}>Password *</label>
                <input required type="password" value={form.password} onChange={e=>set("password",e.target.value)}
                  style={{ width:"100%", padding:"0.5rem 0.75rem", border:"1px solid #e2e8f0", borderRadius:"0.5rem", fontSize:"0.875rem", boxSizing:"border-box" }}
                  placeholder="Min. 6 characters" minLength={6} />
              </div>
              {error && (
                <div style={{ padding:"0.75rem", background:"#fee2e2", borderRadius:"0.5rem", color:"#dc2626", fontSize:"0.875rem", marginBottom:"1rem" }}>{error}</div>
              )}
              <div style={{ display:"flex", gap:"0.75rem" }}>
                <button type="button" onClick={() => setOpen(false)}
                  style={{ flex:1, padding:"0.625rem", background:"#f1f5f9", color:"#475569", border:"none", borderRadius:"0.5rem", cursor:"pointer", fontWeight:"600" }}>
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  style={{ flex:2, padding:"0.625rem", background:"var(--primary, #6366f1)", color:"white", border:"none", borderRadius:"0.5rem", cursor:"pointer", fontWeight:"600" }}>
                  {loading ? "Creating…" : "Create Parent Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
