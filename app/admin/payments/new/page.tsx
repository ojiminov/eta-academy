"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Student = {
  id: string;
  user: { firstName: string; lastName: string };
  groupStudents: {
    group: {
      name: string;
      teacher: { user: { firstName: string; lastName: string } } | null;
    };
  }[];
};

export default function NewPaymentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Student | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    studentId: "", amount: "", method: "cash", notes: "", status: "PAID",
  });

  useEffect(() => {
    fetch("/api/admin/students")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setStudents(data))
      .catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current && !inputRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filtered = students.filter((s) => {
    const full = `${s.user.firstName} ${s.user.lastName}`.toLowerCase();
    const group = s.groupStudents[0]?.group.name?.toLowerCase() || "";
    const teacher = s.groupStudents[0]?.group.teacher
      ? `${s.groupStudents[0].group.teacher.user.firstName} ${s.groupStudents[0].group.teacher.user.lastName}`.toLowerCase()
      : "";
    const q = query.toLowerCase();
    return full.includes(q) || group.includes(q) || teacher.includes(q);
  });

  function selectStudent(s: Student) {
    setSelected(s);
    setForm((f) => ({ ...f, studentId: s.id }));
    setQuery(`${s.user.firstName} ${s.user.lastName}`);
    setOpen(false);
  }

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

          {/* Searchable student picker */}
          <div style={{ marginBottom: "1rem", position: "relative" }}>
            <label className="label">Student *</label>
            <input
              ref={inputRef}
              className="input"
              type="text"
              placeholder="Type name, group, or teacher..."
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setOpen(true);
                if (!e.target.value) { setSelected(null); setForm((f) => ({ ...f, studentId: "" })); }
              }}
              onFocus={() => setOpen(true)}
              autoComplete="off"
              required={!form.studentId}
            />
            {/* Hidden required field to force validation */}
            <input type="hidden" value={form.studentId} required />

            {open && filtered.length > 0 && (
              <div
                ref={dropdownRef}
                style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "white", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 100,
                  maxHeight: "260px", overflowY: "auto",
                }}
              >
                {filtered.map((s) => {
                  const group = s.groupStudents[0]?.group;
                  const teacherName = group?.teacher
                    ? `${group.teacher.user.firstName} ${group.teacher.user.lastName}`
                    : null;
                  return (
                    <div
                      key={s.id}
                      onMouseDown={() => selectStudent(s)}
                      style={{
                        padding: "0.625rem 1rem",
                        cursor: "pointer",
                        borderBottom: "1px solid #f1f5f9",
                        background: selected?.id === s.id ? "#f5f3ff" : "white",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f8f7ff")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = selected?.id === s.id ? "#f5f3ff" : "white")}
                    >
                      <div style={{ fontWeight: "600", color: "#1e293b", fontSize: "0.9rem" }}>
                        {s.user.firstName} {s.user.lastName}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "#64748b", marginTop: "2px", display: "flex", gap: "0.75rem" }}>
                        {group && <span>📚 {group.name}</span>}
                        {teacherName && <span>👤 {teacherName}</span>}
                        {!group && <span style={{ color: "#94a3b8" }}>No active group</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {open && query.length > 0 && filtered.length === 0 && (
              <div
                ref={dropdownRef}
                style={{
                  position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
                  background: "white", border: "1.5px solid #e2e8f0", borderRadius: "0.5rem",
                  padding: "0.75rem 1rem", color: "#94a3b8", fontSize: "0.875rem", zIndex: 100,
                }}
              >
                No students found
              </div>
            )}
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
            <button type="submit" className="btn btn-primary" disabled={loading || !form.studentId}>
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
