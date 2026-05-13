"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NewPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<{ id: string; user: { firstName: string; lastName: string } }[]>([]);
  const [form, setForm] = useState({
    studentId: "", amount: "", method: "cash", notes: "", status: "PAID",
  });

  useEffect(() => {
    fetch("/api/admin/students")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setStudents(data))
      .catch(() => {});
  }, []);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const d = await res.json();
        setError(d.error || "Failed to record payment");
        return;
      }
      router.push("/admin/payments");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "600px" }}>
      <div style={{ marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "700", color: "#1e293b", margin: "0 0 0.25rem" }}>Record Payment</h1>
        <p style={{ color: "#64748b", margin: 0 }}>Log a student payment</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: "0.75rem 1rem", background: "#fee2e2", color: "#dc2626", borderRadius: "0.5rem", marginBottom: "1.25rem", fontSize: "0.875rem" }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Student *</label>
            <select className="input" value={form.studentId} onChange={(e) => set("studentId", e.target.value)} required>
              <option value="">Select student...</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>{s.user.firstName} {s.user.lastName}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label className="label">Amount (UZS) *</label>
              <input className="input" type="number" placeholder="750000" value={form.amount} onChange={(e) => set("amount", e.target.value)} required />
            </div>
            <div>
              <label className="label">Payment Method</label>
              <select className="input" value={form.method} onChange={(e) => set("method", e.target.value)}>
                <option value="cash">💵 Cash</option>
                <option value="card">💳 Card</option>
                <option value="transfer">🏦 Bank Transfer</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => set("status", e.target.value)}>
              <option value="PAID">✅ Paid</option>
              <option value="PENDING">⏳ Pending</option>
              <option value="OVERDUE">⚠️ Overdue</option>
            </select>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label className="label">Notes</label>
            <textarea className="input" rows={3} placeholder="Optional notes..." value={form.notes} onChange={(e) => set("notes", e.target.value)} style={{ resize: "vertical" }} />
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Recording..." : "Record Payment"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => router.back()}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
